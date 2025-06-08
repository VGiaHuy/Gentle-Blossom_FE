// SignalR Connection
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/chatHub")
    .build();

// Nhận tin nhắn mới
connection.on("ReceiveMessage", (senderId, content, attachmentUrl, sentAt) => {
    const isOutgoing = senderId == @Model.CurrentUserId;
    const messageHtml = `
                <div class="message ${isOutgoing ? 'outgoing ms-auto' : 'incoming'} p-3 mb-3">
                    <p class="mb-1">${content || ''}</p>
                    ${attachmentUrl ? (attachmentUrl.match(/\.(jpeg|jpg|png|gif)$/i) ?
            `<img src="${attachmentUrl}" alt="Attachment" class="message-attachment">` :
            attachmentUrl.match(/\.(mp4|webm)$/i) ?
                `<video src="${attachmentUrl}" controls class="message-attachment"></video>` :
                `<a href="${attachmentUrl}" class="text-decoration-none">Tải file</a>`) : ''}
                    <small class="d-block text-muted ${isOutgoing ? 'text-end' : ''}">${new Date(sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</small>
                    ${isOutgoing ? '<button class="btn btn-sm btn-danger delete-message" data-message-id="new">Xóa</button>' : ''}
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
    alert(`Người dùng ${userId} đã tham gia phòng chat.`);
});

// Nhận thông báo thành viên rời phòng
connection.on("UserLeft", (userId) => {
    alert(`Người dùng ${userId} đã rời phòng chat.`);
});

// Khởi động SignalR
connection.start().then(() => {
    if (@Model.SelectedRoom?.ChatRoomId) {
        connection.invoke("JoinRoom", @Model.SelectedRoom?.ChatRoomId);
    }
}).catch(err => console.error(err));

$(document).ready(function () {
    // Chuyển đổi phòng chat
    $(".chat-room-item").click(function () {
        const roomId = $(this).data("room-id");
        window.location.href = `/Chat/Index?chatRoomId=${roomId}`;
    });

    // Gửi tin nhắn
    $("#sendMessageForm").submit(function (e) {
        e.preventDefault();
        const formData = new FormData(this);
        $.ajax({
            url: "/Chat/SendMessage",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                if (response.success) {
                    $("#messageInput").val("");
                    $("#attachmentInput").val("");
                } else {
                    alert(response.message);
                }
            },
            error: function () {
                alert("Lỗi khi gửi tin nhắn!");
            }
        });
    });

    // Tạo phòng chat
    $("#createRoomForm").submit(function (e) {
        e.preventDefault();
        const formData = {
            chatRoomName: $("#chatRoomName").val(),
            isGroup: $("#isGroup").is(":checked"),
            participantIds: $("#participantIds").val().map(Number)
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
                    alert(response.message);
                }
            },
            error: function () {
                alert("Lỗi khi tạo phòng chat!");
            }
        });
    });

    // Xóa tin nhắn
    $(document).on("click", ".delete-message", function () {
        const messageId = $(this).data("message-id");
        if (messageId === "new") return; // Bỏ qua tin nhắn mới chưa có ID
        $.ajax({
            url: `/Chat/DeleteMessage?messageId=${messageId}`,
            type: "DELETE",
            success: function (response) {
                if (!response.success) {
                    alert(response.message);
                }
            },
            error: function () {
                alert("Lỗi khi xóa tin nhắn!");
            }
        });
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