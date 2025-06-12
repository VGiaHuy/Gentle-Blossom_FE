let connection = null;
let userId = document.getElementById('userId')?.value;

if (typeof signalR === "undefined") {
    showErrorModal("Lỗi: Không tải được SignalR! Vui lòng kiểm tra kết nối mạng hoặc CDN.");
} else {
    // Khởi tạo SignalR connection
    connection = new signalR.HubConnectionBuilder()
        .withUrl("https://localhost:7111/chatHub", { withCredentials: true })
        .withAutomaticReconnect()
        .build();

    // Nhận tin nhắn mới
    connection.on("ReceiveMessage", (senderId, content, mediaList, sentAt, senderAvatarUrl, senderName) => {
        console.log("Nhận tin nhắn mới từ chathub");
        const chatRoomId = parseInt($("input[name='chatRoomId']").val());
        const isOutgoing = senderId == userId;

        let mediaHtml = '';
        if (mediaList && mediaList.length > 0) {
            mediaList.forEach(media => {
                if (media.mediaType.startsWith('image')) {
                    mediaHtml += `<img src="${media.mediaUrl}" alt="Attachment" class="img-fluid rounded-3 mb-2">`;
                } else if (media.mediaType.startsWith('video')) {
                    mediaHtml += `<video src="${media.mediaUrl}" controls class="img-fluid rounded-3 mb-2"></video>`;
                } else {
                    mediaHtml += `<a href="${media.mediaUrl}" class="text-decoration-none mb-2 d-block">${media.fileName || 'Tải file'}</a>`;
                }
            });
        }

        const messageHtml = `
        <div class="message d-flex align-items-start mb-1 ${isOutgoing ? 'ms-auto flex-row-reverse' : ''}" data-room-id="${chatRoomId}">
            <img src="/Post/ProxyImage?url=${senderAvatarUrl}" alt="Avatar" class="rounded-circle ${isOutgoing ? 'ms-2' : 'me-2'}" style="width: 32px; height: 32px;">
            <div class="message-content p-2 rounded-4 ${isOutgoing ? 'bg-primary text-white' : 'bg-light'}" style="max-width: 70%;">
                <strong class="d-block mb-1">${senderName || 'Unknown'}</strong>
                ${content ? `<p class="mb-1">${content}</p>` : ''}
                ${mediaHtml}
                <small class="d-block text-muted ${isOutgoing ? 'text-end' : ''}">${new Date(sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</small>
                ${isOutgoing ? `<button class="btn btn-sm btn-danger mt-2" data-message-id="new">Xóa</button>` : ''}
            </div>
        </div>`;
        $("#chatMessages").append(messageHtml);
        $("#chatMessages").scrollTop($("#chatMessages")[0].scrollHeight);
    });

    // Nhận thông báo xóa tin nhắn
    connection.on("MessageDeleted", (messageId) => {
        $(`.delete-message[data-message-id="${messageId}"]`).closest(".message").remove();
    });

    // Nhận thông báo thành viên mới
    connection.on("UserJoined", (userId) => {
        showInfoModal(`Người dùng ${userId} đã tham gia phòng chat.`);
    });

    // Nhận thông báo thành viên rời phòng
    connection.on("UserLeft", (userId) => {
        showInfoModal(`Người dùng ${userId} đã rời phòng chat.`);
    });

    // Khởi động SignalR
    connection.start().catch(err => {
        showErrorModal("Lỗi kết nối SignalR: " + err.message);
    });

    // Xử lý ngắt kết nối
    connection.onclose((error) => {
        showInfoModal("Kết nối SignalR bị đóng!");
    });
}

// Sử dụng jQuery
jQuery(document).ready(function ($) {
    // Chuyển đổi phòng chat
    $(document).on("click", ".chat-room-item", function (e) {
        e.preventDefault();
        const roomId = $(this).data("room-id");

        if (!roomId || isNaN(roomId)) {
            showInfoModal("ID phòng chat không hợp lệ!");
            return;
        }

        // Kiểm tra trạng thái connection
        if (connection && connection.state === signalR.HubConnectionState.Connected) {
            // Lấy phòng hiện tại
            const currentRoomId = parseInt($("input[name='chatRoomId']").val());

            // Gọi LeaveRoom nếu đang ở trong một phòng
            if (currentRoomId && !isNaN(currentRoomId)) {
                connection.invoke("LeaveRoom", currentRoomId, parseInt(userId)).catch(err => {
                    console.error("SignalR LeaveRoom error:", err);
                    showErrorModal("Lỗi khi rời phòng chat: " + err.message);
                });
            }

            // Tham gia phòng mới
            connection.invoke("JoinRoom", parseInt(roomId), parseInt(userId)).catch(err => {
                console.error("SignalR JoinRoom error:", err);
                showErrorModal("Lỗi khi tham gia phòng chat: " + err.message);
            });
        } else {
            console.error("SignalR is not connected or not loaded");
            showErrorModal("Lỗi: SignalR chưa kết nối!");
        }

        // Tải khung Chat Window
        $.ajax({
            url: `/Chat/GetChatWindow?chatRoomId=${roomId}`,
            type: "GET",
            success: function (data) {
                $(".col-lg-8").html(data);
                $(".chat-room-item").removeClass("active");
                $(`[data-room-id="${roomId}"]`).addClass("active");
            },
            error: function (xhr, status, error) {
                console.error("AJAX error:", status, error, xhr.responseText);
                showErrorModal("Lỗi khi tải phòng chat: " + error);
            }
        });
    });

    // Gửi tin nhắn qua SignalR
    $(document).on("submit", "#sendMessageForm", function (e) {
        e.preventDefault();
        const formData = new FormData(this);
        const chatRoomId = formData.get("chatRoomId");
        const content = formData.get("content");
        const attachments = formData.getAll("attachments"); // Lấy tất cả file từ input
        const senderId = parseInt(userId);

        // Kiểm tra giá trị hợp lệ
        if (!chatRoomId || isNaN(chatRoomId)) {
            showInfoModal("ID phòng chat không hợp lệ!");
            return;
        }
        if (!senderId || isNaN(senderId)) {
            showInfoModal("ID người dùng không hợp lệ!");
            return;
        }
        if (!content && (!attachments || attachments.length === 0 || attachments.every(file => file.size === 0))) {
            showInfoModal("Vui lòng nhập nội dung hoặc chọn ít nhất một tệp đính kèm!");
            return;
        }

        // Tạo FormData để upload file
        const uploadFormData = new FormData();
        uploadFormData.append("chatRoomId", chatRoomId);
        uploadFormData.append("senderId", senderId);
        uploadFormData.append("content", content || "");
        attachments.forEach((file, index) => {
            if (file.size > 0) {
                uploadFormData.append("attachments", file);
            }
        });

        // Gửi yêu cầu upload file và tin nhắn
        $.ajax({
            url: "/Chat/SendMessage",
            type: "POST",
            data: uploadFormData,
            processData: false,
            contentType: false,
            success: function (response) {
                if (response.success) {
                    $("#messageInput").val("");
                    $("#attachments").val("");
                } else {
                    showErrorModal("Lỗi khi gửi tin nhắn: " + (response.message || "Không xác định"));
                }
            },
            error: function (xhr, status, error) {
                console.error("Send message error:", status, error, xhr.responseText);
                showErrorModal("Lỗi khi gửi tin nhắn!");
            }
        });
    });

    // Tạo phòng chat
    $("#createRoomForm").submit(function (e) {
        e.preventDefault();
        const formData = {
            chatRoomName: $("#chatRoomName").val(),
            isGroup: $("#isGroup").is(":checked"),
            userCreate: parseInt(userId),
        };

        $.ajax({
            url: "/Chat/CreateChatRoom",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(formData),
            success: function (response) {
                if (response.success) {
                    window.location.reload();
                } else {
                    showErrorModal(response.message || "Lỗi khi tạo phòng chat!");
                }
            },
            error: function (xhr, status, error) {
                console.error("AJAX error:", status, error, xhr.responseText);
                showErrorModal("Lỗi khi tạo phòng chat: " + error);
            }
        });
    });

    // Xóa tin nhắn
    $(document).on("click", ".delete-message", function () {
        const messageId = $(this).data("message-id");
        const chatRoomId = $(this).closest(".message").data("room-id");
        if (messageId === "new" || !chatRoomId || isNaN(chatRoomId)) {
            showInfoModal("ID tin nhắn hoặc phòng chat không hợp lệ!");
            return;
        }

        if (connection && connection.state === signalR.HubConnectionState.Connected) {
            connection.invoke("DeleteMessage", parseInt(chatRoomId), parseInt(messageId))
                .catch(err => {
                    console.error("SignalR DeleteMessage error:", err);
                    showErrorModal("Lỗi khi xóa tin nhắn: " + err.message);
                });
        } else {
            showErrorModal("Lỗi: SignalR chưa kết nối!");
        }
    });

    // Tìm kiếm phòng chat
    $("#searchRooms").on("input", function () {
        const searchText = $(this).val().toLowerCase();
        $(".chat-room-item").each(function () {
            const roomName = $(this).find("strong").text().toLowerCase();
            $(this).toggle(roomName.includes(searchText));
        });
    });
});