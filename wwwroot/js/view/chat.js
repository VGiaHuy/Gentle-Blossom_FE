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
    connection.on("ReceiveMessage", (messageId, senderId, content, mediaList, sentAt, senderAvatarUrl, senderName) => {
        console.log("Nhận tin nhắn mới từ chathub");
        const chatRoomId = parseInt($("input[name='chatRoomId']").val());
        const isOutgoing = senderId == userId;

        let mediaHtml = '';
        if (mediaList && mediaList.length > 0) {
            mediaList.forEach(media => {
                console.log('Media:', media);
                const mediaType = media.mediaType.toLowerCase(); // Chuẩn hóa mediaType
                if (mediaType.startsWith('image')) {
                    mediaHtml += `
                <a href="#" data-bs-toggle="modal" data-bs-target="#mediaModal" data-media-url="${media.fileUrl}" data-media-type="image" class="d-block mb-2">
                    <img src="/Post/ProxyImage?url=${encodeURIComponent(media.fileUrl)}" alt="${media.fileName || 'Attachment'}" 
                        class="img-fluid rounded-3" 
                        style="max-width: 200px; max-height: 150px; object-fit: cover;"
                        loading="lazy"
                        onerror="this.onerror=null; this.src='/images/fallback-image.jpg';">
                </a>`;
                } else if (mediaType.startsWith('video')) {
                    const fileId = extractFileId(media.fileUrl);
                    console.log('Video File ID:', fileId);
                    if (fileId) {
                        mediaHtml += `
                    <a href="#" data-bs-toggle="modal" data-bs-target="#mediaModal" data-media-url="${media.fileUrl}" data-media-type="video" class="d-block mb-2">
                        <iframe src="https://drive.google.com/file/d/${fileId}/preview?t=${Date.now()}"
                            class="img-fluid rounded-3"
                            style="max-width: 200px; max-height: 150px; width: 100%;"
                            allowfullscreen
                            onerror="this.onerror=null; this.src='/images/fallback-video.jpg';">
                        </iframe>
                    </a>`;
                    } else {
                        console.warn('No valid File ID for video, falling back to placeholder');
                        mediaHtml += `
                    <a href="#" data-bs-toggle="modal" data-bs-target="#mediaModal" data-media-url="${media.fileUrl}" data-media-type="video" class="d-block mb-2">
                        <img src="/images/fallback-video.jpg" alt="Video not available" 
                            class="img-fluid rounded-3" 
                            style="max-width: 200px; max-height: 150px; object-fit: cover;">
                    </a>`;
                    }
                } else {
                    mediaHtml += `
                <a href="${media.fileUrl}" target="_blank" class="text-decoration-none mb-2 d-block" style="color:#fff;">
                    <i class="bi bi-file-pdf-fill text-danger me-1"></i>${media.fileName || 'Tải file'}
                </a>`;
                }
            });

            scrollToBottom();
        }

        const messageHtml = `
        <div class="message d-flex align-items-start mb-1 ${isOutgoing ? 'ms-auto flex-row-reverse' : ''}" data-room-id="${chatRoomId}">
            <img src="/Post/ProxyImage?url=${senderAvatarUrl}" alt="Avatar" class="rounded-circle ${isOutgoing ? 'ms-2' : 'me-2'}" style="width: 32px; height: 32px;">
            <div class="message-content p-2 rounded-4 ${isOutgoing ? 'bg-primary text-white' : 'bg-light'}" style="max-width: 70%;" data-message-id="${messageId}">
                <strong class="d-block mb-1">${senderName || 'Unknown'}</strong>
                ${content ? `<p class="mb-1">${content}</p>` : ''}
                ${mediaHtml}
                <small class="d-block text-muted ${isOutgoing ? 'text-end' : ''}">${new Date(sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</small>
            </div>
        </div>`;
        $("#chatMessages").append(messageHtml);
        $("#chatMessages").scrollTop($("#chatMessages")[0].scrollHeight);
    });

    // Nhận thông báo xóa tin nhắn
    connection.on("MessageDeleted", (messageId) => {
        $(`.message-content[data-message-id="${messageId}"]`).closest(".message").remove();
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

// Hàm khởi tạo cho ChatWindow
function initChatWindow() {
    // Kiểm tra sự tồn tại của các phần tử
    const messageInput = $('#messageInput');
    const attachmentInput = $('#attachmentInput');
    const emojiPickerBtn = $('#emojiPickerBtn');
    const mediaPreview = $('#mediaPreview');
    const sendMessageForm = $('#sendMessageForm');

    if (!messageInput.length || !attachmentInput.length || !emojiPickerBtn.length || !mediaPreview.length || !sendMessageForm.length) {
        console.log('ChatWindow elements not found, skipping initialization.');
        return; // Thoát nếu các phần tử chưa được render
    }

    // Xóa emojiPicker cũ nếu tồn tại
    $('#emojiPicker').remove();

    // Xóa sự kiện cũ để tránh trùng lặp
    emojiPickerBtn.off('click');
    attachmentInput.off('change');
    sendMessageForm.off('submit');
    $(document).off('click', 'handleClickOutsideEmojiPicker');

    // Tạo Emoji Picker
    const emojiPicker = $('<div id="emojiPicker" class="emoji-picker"></div>').appendTo('body');
    emojiPicker.css({
        display: 'none',
        position: 'absolute',
        zIndex: 1060,
        backgroundColor: '#fff',
        border: '1px solid #0dcaf0',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
    });

    const picker = new EmojiMart.Picker({
        data: async () => {
            const response = await fetch('https://cdn.jsdelivr.net/npm/@emoji-mart/data@latest');
            return response.json();
        },
        onEmojiSelect: (emoji) => {
            const input = messageInput[0];
            const startPos = input.selectionStart || 0;
            const endPos = input.selectionEnd || 0;
            const value = input.value;
            input.value = value.substring(0, startPos) + emoji.native + value.substring(endPos);
            input.focus();
            input.selectionStart = input.selectionEnd = startPos + emoji.native.length;
            emojiPicker.hide();
        },
        perLine: 6
    });
    emojiPicker.append(picker);

    // Sự kiện click nút emoji
    emojiPickerBtn.on('click', function (e) {
        e.preventDefault();
        console.log('Emoji button clicked');
        const rect = this.getBoundingClientRect();
        const pickerHeight = emojiPicker[0].offsetHeight || 330;
        const pickerWidth = emojiPicker[0].offsetWidth || 400;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        let top = rect.top - pickerHeight + window.scrollY;
        let left = rect.left + window.scrollX;
        if (top < 0) {
            top = rect.bottom + window.scrollY;
        }
        if (left + pickerWidth > windowWidth) {
            left = windowWidth - pickerWidth - 10;
        }
        if (left < 0) {
            left = 10;
        }

        emojiPicker.css({ top: `${top}px`, left: `${left}px` });
        emojiPicker.toggle();
    });

    // Đóng picker khi click ra ngoài
    $(document).on('click', 'handleClickOutsideEmojiPicker', function (e) {
        if (!emojiPicker.is(e.target) && !emojiPicker.has(e.target).length && !emojiPickerBtn.is(e.target)) {
            emojiPicker.hide();
        }
    });

    // Xử lý preview file
    attachmentInput.on('change', function () {
        console.log('File input changed', this.files);
        mediaPreview.empty();
        const files = this.files;

        for (let file of files) {
            const fileType = file.type.split('/')[0];
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const url = URL.createObjectURL(file);
            const col = $('<div class="col-4 position-relative"></div>');

            if (fileType === 'image') {
                col.append(`<img src="${url}" class="img-fluid rounded-3" style="max-height: 120px;">`);
            } else if (fileType === 'video') {
                col.append(`<video src="${url}" controls class="img-fluid rounded-3" style="max-height: 120px;"></video>`);
            } else if (fileExtension === 'pdf') {
                col.append(`
                    <div class="d-flex align-items-center justify-content-center" style="height: 120px; background-color: #f8f9fa; border-radius: 8px;">
                        <i class="bi bi-file-pdf-fill text-danger" style="font-size: 48px;"></i>
                        <span class="ms-2">${file.name}</span>
                    </div>
                `);
            }

            const removeBtn = $(`
                <button class="btn btn-danger btn-sm rounded-circle position-absolute top-0 end-0">
                    <i class="bi bi-x"></i>
                </button>
            `);
            removeBtn.on('click', () => {
                col.remove();
                const newFiles = Array.from(attachmentInput[0].files).filter(f => f !== file);
                const dataTransfer = new DataTransfer();
                newFiles.forEach(f => dataTransfer.items.add(f));
                attachmentInput[0].files = dataTransfer.files;
            });
            col.append(removeBtn);

            mediaPreview.append(col);
        }
    });

    // Xử lý sự kiện nhấn chuột phải vào tin nhắn
    $(document).on('contextmenu', '.message-content', function (e) {
        // Chỉ xử lý cho tin nhắn của người dùng (có class bg-primary)
        if (!$(this).hasClass('bg-primary')) {
            return;
        }

        e.preventDefault(); // Ngăn menu chuột phải mặc định của trình duyệt

        // Xóa nút xóa hiện có (nếu có)
        $('.delete-message-btn').remove();

        // Lấy ID tin nhắn
        const messageId = $(this).data('message-id');
        const chatRoomId = parseInt($("input[name='chatRoomId']").val());

        // Tạo nút xóa
        const deleteButton = $(`
            <button class="btn btn-sm btn-danger delete-message-btn rounded-circle">
                <i class="bi bi-trash"></i>
            </button>
        `);

        // Định vị nút xóa
        $(this).css('position', 'relative');
        $(this).append(deleteButton);

        console.log(messageId);

        // Xử lý sự kiện click nút xóa
        deleteButton.on('click', function () {
            $.ajax({
                url: '/Chat/DeleteMessage', // Endpoint xóa tin nhắn
                type: 'DELETE',
                data: { messageId: parseInt(messageId), chatRoomId: chatRoomId },
                success: function (response) {
                    if (!response.success) {
                        showErrorModal('Xóa tin nhắn thất bại!');
                    }
                },
                error: function () {
                    showErrorModal('Lỗi khi gửi yêu cầu xóa tin nhắn!');
                }
            });
        });
    });

    // Ẩn nút xóa khi click ra ngoài
    $(document).on('click', function (e) {
        if (!$(e.target).hasClass('delete-message-btn') && !$(e.target).closest('.delete-message-btn').length) {
            $('.delete-message-btn').remove();
        }
    });
}

// Hàm xử lý URL video
function extractFileId(url) {
    if (!url) {
        console.warn('URL is empty or undefined');
        return '';
    }
    // Hỗ trợ các định dạng URL Google Drive
    const patterns = [
        /\/d\/(.+?)\//, 
        /\/d\/([^\/]+)/, 
        /id=([^&]+)/, 
        /\/file\/d\/(.+?)\//
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            console.log('Extracted File ID:', match[1]);
            return match[1];
        }
    }
    console.warn('Could not extract File ID from URL:', url);
    return '';
}

// Hàm xử lý cuộn xuống cuối
function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Sử dụng jQuery
jQuery(document).ready(function ($) {
    initChatWindow();

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
                // Xóa emojiPicker cũ trước khi khởi tạo mới
                $('#emojiPicker').remove();
                initChatWindow();
                $(".chat-room-item").removeClass("active");
                $(`[data-room-id="${roomId}"]`).addClass("active");
                scrollToBottom();
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
        const attachments = formData.getAll("attachment");
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
        if (!content && (!attachments || attachments.length === 0)) {
            showInfoModal("Vui lòng nhập nội dung hoặc chọn ít nhất một tệp đính kèm!");
            return;
        }

        // Tạo FormData để upload
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
                    $("#attachmentInput").val("");
                    $("#mediaPreview").empty();
                } else {
                    showErrorModal("Lỗi khi gửi tin nhắn: " + (response.message || "Không xác định"));
                }
            },
            error: function (xhr, status, error) {
                console.error("Send message error:", status, error, xhr.responseText);
                showErrorModal("Lỗi khi gửi tin nhắn: " + xhr.responseText);
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

    // Tìm kiếm phòng chat
    $("#searchRooms").on("input", function () {
        const searchText = $(this).val().toLowerCase();
        $(".chat-room-item").each(function () {
            const roomName = $(this).find("strong").text().toLowerCase();
            $(this).toggle(roomName.includes(searchText));
        });
    });

    // Xử lý modal hiển thị hình ảnh/video
    $(document).on('show.bs.modal', '#mediaModal', function (event) {
        const button = $(event.relatedTarget); // Nút kích hoạt modal
        const mediaUrl = button.data('media-url');
        const mediaType = button.data('media-type');
        const modalContent = $('#mediaModalContent');

        // Xóa nội dung cũ 
        modalContent.empty();

        // Thêm nội dung mới
        if (mediaType.toLowerCase() === 'image') {
            modalContent.append(`<img src="/Post/ProxyImage?url=${encodeURIComponent(mediaUrl)}" alt="Attachment" class="img-fluid rounded-3" style="max-height: 80vh;">`);
        } else if (mediaType.toLowerCase() === 'video') {
            const fileId = extractFileId(mediaUrl);
            if (fileId) {
                // Video Google Drive
                modalContent.append(`
                <iframe src="https://drive.google.com/file/d/${fileId}/preview?t=${Date.now()}"
                    class="img-fluid rounded-3"
                    style="max-height: 80vh; width: 100%; border: none;"
                    allowfullscreen>
                </iframe>
            `);
            } else {
                // Video trực tiếp
                modalContent.append(`
                <video src="${mediaUrl}" controls class="img-fluid rounded-3" style="max-height: 80vh;">
                    Trình duyệt của bạn không hỗ trợ video.
                </video>
            `);
            }
        }
    });
});