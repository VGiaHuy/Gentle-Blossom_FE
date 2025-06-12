// Khai báo connection ở phạm vi toàn cục
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
    connection.on("ReceiveMessage", (senderId, content, attachmentUrl, sentAt) => {
        const chatRoomId = parseInt($("input[name='chatRoomId']").val());
        const isOutgoing = senderId == userId;

        const messageHtml = `
            <div class="message ${isOutgoing ? 'outgoing ms-auto' : 'incoming'} p-2 mb-3" data-room-id="${chatRoomId}">
                <p class="mb-1">${content || ''}</p>
                ${attachmentUrl ? (attachmentUrl.match(/\.(jpeg|jpg|png|gif)$/i) ?
                `<img src="${attachmentUrl}" alt="Attachment" class="message-attachment">` :
                attachmentUrl.match(/\.(mp4|webm)$/i) ?
                    `<video src="${attachmentUrl}" controls class="message-attachment"></video>` :
                    `<a href="${attachmentUrl}" class="text-decoration-none">Tải file</a>`) : ''}
                <small class="d-block text-muted ${isOutgoing ? 'text-end' : ''}">${new Date(sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</small>
                ${isOutgoing ? `<button class="btn btn-sm btn-danger delete-message" data-message-id="new">Xóa</button>` : ''}
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

        //// Log dữ liệu FormData
        //console.log("FormData entries:");
        //for (const [key, value] of formData.entries()) {
        //    console.log(`${key}:`, value, typeof value);
        //}

        const chatRoomId = formData.get("chatRoomId");
        const content = formData.get("content");
        const attachment = formData.get("attachment");
        const userId = formData.get("senderId") || userId;
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
        if (!content && (!attachment || attachment.size === 0)) {
            showInfoModal("Vui lòng nhập nội dung hoặc chọn tệp đính kèm!");
            return;
        }

        //// Log trước khi gọi invoke
        //const messageData = {
        //    chatRoomId: parseInt(chatRoomId),
        //    senderId: senderId,
        //    content: content || "", // Đảm bảo content không là null
        //    attachmentUrl: attachment && attachment.size > 0 ? attachment.name : null
        //};
        //console.log("Before invoke SendMessage:", messageData);

        // Nếu có file đính kèm, tải lên server trước
        if (attachment && attachment.size > 0) {
            const uploadFormData = new FormData();
            uploadFormData.append("file", attachment);
            $.ajax({
                url: "/Chat/UploadFile",
                type: "POST",
                data: uploadFormData,
                processData: false,
                contentType: false,
                success: function (response) {
                    if (response.success && response.fileUrl) {
                        sendMessage(parseInt(chatRoomId), senderId, content || "", response.fileUrl);
                    } else {
                        showErrorModal("Lỗi khi tải file: " + (response.message || "Không xác định"));
                    }
                },
                error: function (xhr, status, error) {
                    console.error("Upload file error:", status, error, xhr.responseText);
                    showErrorModal("Lỗi khi tải file!");
                }
            });
        } else {
            // Gửi tin nhắn không có file
            sendMessage(parseInt(chatRoomId), senderId, content || "", null);
        }

        // Hàm gửi tin nhắn qua SignalR
        function sendMessage(chatRoomId, senderId, content, attachmentUrl) {
            if (connection && connection.state === signalR.HubConnectionState.Connected) {
                connection.invoke("SendMessage", chatRoomId, senderId, content, attachmentUrl)
                    .then(() => {
                        $("#messageInput").val(""); // Cập nhật ID nếu input có ID khác
                        $("#attachment").val("");   // Cập nhật ID nếu input có ID khác
                    })
                    .catch(err => {
                        showErrorModal("Lỗi khi gửi tin nhắn: " + err.message);
                    });
            } else {
                showErrorModal("Lỗi: SignalR chưa kết nối!");
            }
        }
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