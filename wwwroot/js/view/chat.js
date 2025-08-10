let chatConnection = null;
let videoCallConnection = null;
let userId = document.getElementById('userId')?.value;
let localStream;
let peerConnections = {}; // Lưu trữ kết nối peer-to-peer cho từng người dùng
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const videoCallContainer = document.getElementById("videoCallContainer");

// Cấu hình WebRTC với STUN server miễn phí
const configuration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" } // STUN server miễn phí của Google
    ]
};

if (typeof signalR === "undefined") {
    console.log("Lỗi: Không tải được SignalR! Vui lòng kiểm tra kết nối mạng hoặc CDN.");
} else {
    // Kiểm tra window.apiSettings
    if (!window.apiSettings || !window.apiSettings.signalRBaseUrl) {
        console.error("apiSettings or signalRBaseUrl is not defined");
        throw new Error("SignalR configuration is missing");
    }

    // Khởi tạo SignalR connection cho chat
    chatConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${window.apiSettings.signalRBaseUrl}/chatHub`, { withCredentials: true })
        .withAutomaticReconnect()
        .build();

    // Khởi tạo SignalR connection cho video call
    videoCallConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${window.apiSettings.signalRBaseUrl}/videoCallHub`, { withCredentials: true })
        .withAutomaticReconnect()
        .build();

    function registerSignalREvents() {
        // Xử lý khi nhận Offer từ người gọi
        videoCallConnection.on("ReceiveOffer", async (callerId, offer) => {
            if (callerId === videoCallConnection.connectionId) {
                console.log("Ignored self Offer");
                return;
            }

            console.log(`Received Offer from caller ${callerId}`);
            peerConnections[callerId] = new RTCPeerConnection(configuration);
            console.log(`Created peer connection for caller ${callerId}`);

            const remoteVideosContainer = document.getElementById('remoteVideosContainer');
            if (!remoteVideosContainer) {
                console.error("remoteVideosContainer not found in DOM");
                return;
            }

            const remoteVideo = document.createElement('video');
            remoteVideo.autoplay = true;
            remoteVideo.id = `remoteVideo-${callerId}`;
            remoteVideo.style.width = '380px';
            remoteVideo.style.margin = '5px';
            remoteVideo.style.border = '2px solid #28a745';
            remoteVideo.style.borderRadius = '8px';
            remoteVideosContainer.appendChild(remoteVideo);
            console.log(`Added remote video element for caller ${callerId}`);

            peerConnections[callerId].onicecandidate = (event) => {
                if (event.candidate) {
                    videoCallConnection.invoke("SendIceCandidate", callerId, JSON.stringify(event.candidate));
                    console.log(`Sent ICE candidate to caller ${callerId}`);
                }
            };

            peerConnections[callerId].ontrack = (event) => {
                console.log(`Received remote stream from caller ${callerId}`);
                remoteVideo.srcObject = event.streams[0];
            };

            peerConnections[callerId].onconnectionstatechange = () => {
                console.log(`Peer connection state for ${callerId}: ${peerConnections[callerId].connectionState}`);
                if (peerConnections[callerId].connectionState === 'disconnected' ||
                    peerConnections[callerId].connectionState === 'failed') {
                    if (remoteVideo) {
                        remoteVideo.remove();
                        console.log(`Removed video element for disconnected caller ${callerId}`);
                    }
                    delete peerConnections[callerId];
                }
            };

            try {
                await peerConnections[callerId].setRemoteDescription(new RTCSessionDescription(JSON.parse(offer)));
                console.log(`Set remote description for caller ${callerId}`);

                if (localStream) {
                    localStream.getTracks().forEach(track => peerConnections[callerId].addTrack(track, localStream));
                    console.log(`Added local stream tracks to peer connection for caller ${callerId}`);
                } else {
                    console.error("localStream is not available");
                    return;
                }

                const answer = await peerConnections[callerId].createAnswer();
                await peerConnections[callerId].setLocalDescription(answer);
                await videoCallConnection.invoke("SendAnswer", callerId, JSON.stringify(peerConnections[callerId].localDescription));
                console.log(`Sent Answer to caller ${callerId}`);
            } catch (error) {
                console.error(`Error handling Offer from ${callerId}:`, error);
            }
        });

        // Xử lý khi nhận Answer từ người nhận
        videoCallConnection.on("ReceiveAnswer", async (callerId, answer) => {
            try {
                console.log(`Received Answer from ${callerId}`);
                if (peerConnections[callerId]) {
                    await peerConnections[callerId].setRemoteDescription(new RTCSessionDescription(JSON.parse(answer)));
                    console.log(`Set remote description for Answer from ${callerId}`);
                } else {
                    console.error(`No peer connection found for ${callerId}`);
                }
            } catch (error) {
                console.error(`Error handling Answer from ${callerId}:`, error);
            }
        });

        // Xử lý khi nhận ICE Candidate
        videoCallConnection.on("ReceiveIceCandidate", async (callerId, candidate) => {
            try {
                console.log(`Received ICE candidate from ${callerId}`);
                if (peerConnections[callerId]) {
                    await peerConnections[callerId].addIceCandidate(new RTCIceCandidate(JSON.parse(candidate)));
                    console.log(`Added ICE candidate from ${callerId}`);
                } else {
                    console.error(`No peer connection found for ${callerId}`);
                }
            } catch (error) {
                console.error(`Error adding ICE candidate from ${callerId}:`, error);
            }
        });

        // Xử lý khi có người tham gia phòng
        videoCallConnection.on("UserJoined", (userId) => {
            console.log(`User ${userId} joined the room`);
        });

        // Xử lý khi có người rời phòng
        videoCallConnection.on("UserLeft", (userId) => {
            console.log(`User ${userId} left the room`);
            if (peerConnections[userId]) {
                peerConnections[userId].close();
                delete peerConnections[userId];
            }
            const remoteVideo = document.getElementById(`remoteVideo-${userId}`);
            if (remoteVideo) {
                remoteVideo.remove();
                console.log(`Removed video element for user ${userId}`);
            }
        });
    }

    // Nhận tin nhắn mới
    chatConnection.on("ReceiveMessage", (messageId, senderId, content, mediaList, sentAt, senderAvatarUrl, senderName) => {
        const chatRoomId = parseInt($("input[name='chatRoomId']").val());
        const isOutgoing = senderId == userId;

        let mediaHtml = '';
        if (mediaList && mediaList.length > 0) {
            mediaList.forEach(media => {
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
                        mediaHtml += `
                    <a href="#" data-bs-toggle="modal" data-bs-target="#mediaModal" data-media-url="${media.fileUrl}" data-media-type="video" class="d-block mb-2">
                        <img src="/images/fallback-video.jpg" alt="Video not available" 
                            class="img-fluid rounded-3" 
                            style="max-width: 200px; max-height: 150px; object-fit: cover;">
                    </a>`;
                    }
                } else {
                    if (isOutgoing) {
                        mediaHtml += `
                        <a href="${media.fileUrl}" target="_blank" class="text-decoration-none mb-2 d-block" style="color:#ffff;">
                            <i class="bi bi-file-pdf-fill text-danger me-1"></i>${media.fileName || 'Tải file'}
                        </a>`;
                    } else {
                        mediaHtml += `
                        <a href="${media.fileUrl}" target="_blank" class="text-decoration-none mb-2 d-block" style="color:#06BBCC;">
                            <i class="bi bi-file-pdf-fill text-danger me-1"></i>${media.fileName || 'Tải file'}
                        </a>`;
                    }
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
    chatConnection.on("MessageDeleted", (messageId) => {
        $(`.message-content[data-message-id="${messageId}"]`).closest(".message").remove();
    });

    // Nhận thông báo thành viên mới
    chatConnection.on("UserJoined", (userId) => {
        showInfoModal(`Người dùng ${userId} đã tham gia phòng chat.`);
    });

    // Nhận thông báo thành viên rời phòng
    chatConnection.on("UserLeft", (userId) => {
        showInfoModal(`Người dùng ${userId} đã rời phòng chat.`);
    });

    // Khởi động SignalR
    chatConnection.start().catch(err => {
        showErrorModal("Lỗi kết nối SignalR: " + err.message);
    });

    // Xử lý ngắt kết nối
    chatConnection.onclose((error) => {
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

// Hàm ngắt kết nối video call
function hangUp() {
    // Dừng stream local
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    // Đóng tất cả peer connections
    Object.values(peerConnections).forEach(pc => pc.close());
    peerConnections = {};

    // Xóa tất cả video từ xa
    const remoteVideosContainer = document.getElementById('remoteVideosContainer');
    if (remoteVideosContainer) {
        remoteVideosContainer.innerHTML = '';
    } else {
        console.error("remoteVideosContainer not found in DOM");
    }

    // Xóa nguồn video local
    if (localVideo) {
        localVideo.srcObject = null;
    } else {
        console.error("localVideo element not found in DOM");
    }

    // Ngắt kết nối SignalR
    if (videoCallConnection) {
        videoCallConnection.stop().then(() => {
            console.log("SignalR connection stopped");
            // Reset các sự kiện SignalR để tránh xử lý từ phiên cũ
            videoCallConnection.off("ReceiveOffer");
            videoCallConnection.off("ReceiveAnswer");
            videoCallConnection.off("ReceiveIceCandidate");
            videoCallConnection.off("UserJoined");
            videoCallConnection.off("UserLeft");
        }).catch(error => {
            console.error("Error stopping SignalR connection:", error);
        });
    }

    // Ẩn modal video call
    $("#videoCallModal").modal("hide");
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
        if (chatConnection && chatConnection.state === signalR.HubConnectionState.Connected) {
            // Lấy phòng hiện tại
            const currentRoomId = parseInt($("input[name='chatRoomId']").val());

            // Gọi LeaveRoom nếu đang ở trong một phòng
            if (currentRoomId && !isNaN(currentRoomId)) {
                chatConnection.invoke("LeaveRoom", currentRoomId, parseInt(userId)).catch(err => {
                    console.error("SignalR LeaveRoom error:", err);
                    showErrorModal("Lỗi khi rời phòng chat: " + err.message);
                });
            }

            // Tham gia phòng mới
            chatConnection.invoke("JoinRoom", parseInt(roomId), parseInt(userId)).catch(err => {
                console.error("SignalR JoinRoom error:", err);
                showErrorModal("Lỗi khi tham gia phòng chat: " + err.message);
            });
        } else {
            console.error("SignalR is not connected or not loaded");
            showInfoModal("Đường truyền đang kết nối...");
        }

        // Tải khung Chat Window
        $.ajax({
            url: `/Chat/GetChatWindow?chatRoomId=${roomId}`,
            type: "GET",
            success: function (data) {
                $(".col-lg-8").html(data);
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

    // Hàm khởi tạo video call
    $(document).on("click", "#startVideoCall", async function (e) {
        e.preventDefault();

        const chatRoomId = $(this).data('chatroom-id');
        if (!chatRoomId) {
            console.error("chatRoomId không được định nghĩa");
            return;
        }

        // Làm sạch trạng thái trước khi bắt đầu
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }
        Object.values(peerConnections).forEach(pc => pc.close());
        peerConnections = {};
        const remoteVideosContainer = document.getElementById('remoteVideosContainer');
        if (remoteVideosContainer) {
            remoteVideosContainer.innerHTML = '';
        } else {
            console.error("remoteVideosContainer not found in DOM");
            return;
        }
        if (localVideo) {
            localVideo.srcObject = null;
        } else {
            console.error("localVideo element not found in DOM");
            return;
        }

        // Hiển thị modal video call
        $("#videoCallModal").modal("show");
        // Kích hoạt Draggable cho modal
        $("#videoCallModal .modal-dialog").draggable({
            handle: ".modal-header",
            containment: "window",
            scroll: false
        });
        console.log(`Starting video call for room ${chatRoomId} with userId ${userId}`);

        try {
            // Kiểm tra trạng thái kết nối SignalR
            if (videoCallConnection.state === signalR.HubConnectionState.Connected) {
                console.log("SignalR connection already active, skipping start()");
            } else if (videoCallConnection.state === signalR.HubConnectionState.Disconnected) {
                // Đăng ký lại các sự kiện SignalR
                registerSignalREvents();
                await videoCallConnection.start();
                console.log("Video call SignalR connection started");
            } else {
                console.warn("SignalR connection in unexpected state:", videoCallConnection.state);
                return;
            }

            await videoCallConnection.invoke("JoinRoom", chatRoomId.toString(), userId);
            console.log(`Joined room ${chatRoomId} with userId ${userId}`);

            await new Promise(resolve => setTimeout(resolve, 2000));

            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (localVideo) {
                localVideo.srcObject = localStream;
                console.log("Local stream acquired and set to localVideo");
            } else {
                console.error("localVideo element not found in DOM");
                return;
            }

            const response = await fetch(`/Chat/GetUsersInChatRoom?chatRoomId=${chatRoomId}`);
            const result = await response.json();
            if (!result.success) {
                console.error("Lấy danh sách người tham gia thất bại:", result.message);
                return;
            }
            const participants = result.data;
            console.log("Participants:", JSON.stringify(participants, null, 2));

            // Kiểm tra và lọc participants hợp lệ
            const validParticipants = participants.filter(participant =>
                participant.connectionId &&
                participant.connectionId !== videoCallConnection.connectionId
            );

            if (validParticipants.length === 0) {
                console.log("No valid participants found in the room");
                showInfoModal("Không có người dùng nào khác trong phòng để gọi.");
                return;
            }

            for (const participant of validParticipants) {
                const participantConnectionId = participant.connectionId;
                console.log(`Processing participant ${participantConnectionId}`);

                peerConnections[participantConnectionId] = new RTCPeerConnection(configuration);
                console.log(`Created peer connection for participant ${participantConnectionId}`);

                const remoteVideo = document.createElement('video');
                remoteVideo.autoplay = true;
                remoteVideo.id = `remoteVideo-${participantConnectionId}`;
                remoteVideo.style.width = '280px';
                remoteVideo.style.margin = '5px';
                remoteVideo.style.border = '2px solid #28a745';
                remoteVideo.style.borderRadius = '8px';
                remoteVideosContainer.appendChild(remoteVideo);
                console.log(`Added remote video element for participant ${participantConnectionId}`);

                peerConnections[participantConnectionId].onicecandidate = (event) => {
                    if (event.candidate) {
                        videoCallConnection.invoke("SendIceCandidate", participantConnectionId, JSON.stringify(event.candidate))
                            .catch(error => console.error(`Failed to send ICE candidate to ${participantConnectionId}:`, error));
                        console.log(`Sent ICE candidate to participant ${participantConnectionId}`);
                    }
                };

                peerConnections[participantConnectionId].ontrack = (event) => {
                    console.log(`Received remote stream from participant ${participantConnectionId}`);
                    remoteVideo.srcObject = event.streams[0];
                };

                peerConnections[participantConnectionId].onconnectionstatechange = () => {
                    console.log(`Peer connection state for ${participantConnectionId}: ${peerConnections[participantConnectionId].connectionState}`);
                    if (peerConnections[participantConnectionId].connectionState === 'disconnected' ||
                        peerConnections[participantConnectionId].connectionState === 'failed') {
                        if (remoteVideo) {
                            remoteVideo.remove();
                            console.log(`Removed video element for disconnected participant ${participantConnectionId}`);
                        }
                        delete peerConnections[participantConnectionId];
                    }
                };

                localStream.getTracks().forEach(track => peerConnections[participantConnectionId].addTrack(track, localStream));
                console.log(`Added local stream tracks to peer connection for participant ${participantConnectionId}`);

                const offer = await peerConnections[participantConnectionId].createOffer();
                await peerConnections[participantConnectionId].setLocalDescription(offer);
                await videoCallConnection.invoke("SendOffer", participantConnectionId, JSON.stringify(peerConnections[participantConnectionId].localDescription))
                    .catch(error => console.error(`Failed to send Offer to ${participantConnectionId}:`, error));
                console.log(`Sent Offer to participant ${participantConnectionId}`);
            }
        } catch (error) {
            console.error("Lỗi khi bắt đầu video call:", error);
            alert("Không thể bắt đầu video call: " + error.message);
            hangUp();
        }
    });

    // Gắn sự kiện cho nút ngắt kết nối
    $(document).on("click", "#hangUpButton, #hangUpButtonFooter", function () {
        if (typeof hangUp === "function") {
            hangUp();
            console.log("Video call disconnected and modal closed");
        } else {
            console.error("Hàm hangUp chưa được định nghĩa");
        }
    });

    // Gửi tin nhắn qua SignalR
    $(document).on("submit", "#sendMessageForm", function (e) {
        e.preventDefault();
        const formData = new FormData(this);
        const chatRoomId = formData.get("chatRoomId");
        const content = formData.get("content");
        const attachments = formData.getAll("attachment");
        const senderId = parseInt(userId);

        // Kiểm tra nếu nội dung rỗng
        if (content.trim() === '') {
            return;
        }

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

        // Lưu trữ nút gửi và nội dung ban đầu
        const $sendButton = $(this).find('button[type="submit"]');
        const originalButtonContent = $sendButton.html();
        
        // Thay đổi nút thành trạng thái loading
        $sendButton
            .prop("disabled", true)
            .html('<i class="bi bi-arrow-repeat spin"></i>');
        
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
            },
            complete: function () {
                // Khôi phục nút về trạng thái ban đầu
                $sendButton
                    .prop("disabled", false)
                    .html(originalButtonContent);
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


    // Xử lý tham gia phòng chat bằng chatcode
    enterRoom.addEventListener('click', function () {
        console.log("vô hàm");
        const enterRoomBtn = document.getElementById('enterRoom');
        const chatCodeInput = document.getElementById('chatCode');
        const chatCode = chatCodeInput.value.trim();

        if (!chatCode) {
            showErrorModal('Vui lòng nhập Chat Code!');
            return;
        }

        $.ajax({
            url: '/Chat/JoinChatRoom',
            type: 'POST',
            data: { chatCode: chatCode },
            success: function (data) {
                if (data.success) {
                    showSuccessModal(data.message)
                    setTimeout(function () {
                        window.location.reload();
                    }, 2000);
                } else {
                    showErrorModal(data.message);
                }
            },
            error: function (xhr, status, error) {
                console.error('Error:', error);
                showErrorModal('Đã xảy ra lỗi server');
                alert('Có lỗi xảy ra khi gửi Chat Code!');
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', function () {
    scrollToBottom();
});