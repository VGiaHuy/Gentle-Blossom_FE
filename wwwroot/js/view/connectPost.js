// Biến quản lý trạng thái
const commentStates = new Map(); // Lưu trạng thái cho từng post

// Khởi tạo trạng thái cho một post
function initCommentState(postId) {
    return {
        currentPage: 1,
        isLoading: false,
        hasMoreComments: true
    };
}

// Hàm lấy bình luận với phân trang
function fetchComments(postId, page = 1, append = false) {
    const state = commentStates.get(postId) || initCommentState(postId);
    if (state.isLoading || !state.hasMoreComments) return;

    state.isLoading = true;
    commentStates.set(postId, state);

    const loadingSpinner = document.getElementById(`loadingSpinner-${postId}`);
    if (loadingSpinner) loadingSpinner.style.display = 'block';

    $.ajax({
        url: `/Post/GetComments?postId=${postId}&page=${page}`,
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            const commentsList = document.getElementById(`commentsList-${postId}`);
            if (!commentsList) {
                console.error(`❌ Không tìm thấy #commentsList-${postId}`);
                state.isLoading = false;
                if (loadingSpinner) loadingSpinner.style.display = 'none';
                commentStates.set(postId, state);
                return;
            }

            if (!append) {
                commentsList.innerHTML = `
                    <div id="loadingSpinner-${postId}" class="text-center" style="display: none;">
                        <div class="spinner-border spinner-border-sm text-primary" role="status">
                            <span class="visually-hidden">Đang tải...</span>
                        </div>
                    </div>
                    <div id="sentinel-${postId}" style="height: 20px;"></div>
                `;
            }

            if (data.success && data.data && data.data.length > 0) {
                data.data.forEach(comment => {
                    const commentHtml = `
                        <div class="d-flex align-items-start mb-3 p-2 rounded hover-bg-light">
                            <img src="/Post/ProxyImage?url=${encodeURIComponent(comment.posterAvatarUrl)}" 
                                 alt="Avatar" 
                                 class="rounded-circle me-2 border" 
                                 style="width: 32px; height: 32px; object-fit: cover;">
                            <div class="flex-grow-1">
                                <p class="mb-1">
                                    <strong class="text-dark">${comment.fullName}</strong>
                                    <span class="text-muted">${comment.content}</span>
                                </p>
                                ${comment.mediaUrl && comment.mediaType.toLowerCase() === 'image' ? `
                                    <div class="mt-1">
                                        <img src="/Post/ProxyImage?url=${encodeURIComponent(comment.mediaUrl)}"
                                             alt="${comment.fileName || ''}"
                                             class="img-fluid rounded"
                                             style="max-height: 80px; object-fit: cover;"
                                             loading="lazy"
                                             onerror="this.onerror=null; this.src='/images/fallback-image.jpg';" />
                                    </div>
                                ` : ''}
                                <small class="text-muted d-block mb-1">${comment.commentDate}</small>
                                <button class="btn btn-link p-0 text-muted small" style="text-decoration: none;">
                                    <i class="bi bi-reply me-1"></i>Trả lời
                                </button>
                            </div>
                        </div>
                    `;
                    const sentinel = document.getElementById(`sentinel-${postId}`);
                    sentinel.insertAdjacentHTML('beforebegin', commentHtml);
                });

                state.hasMoreComments = data.hasMore !== undefined ? data.hasMore : false;
            } else {
                state.hasMoreComments = false;
            }

            state.isLoading = false;
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            commentStates.set(postId, state);
        },
        error: function (xhr, status, error) {
            console.error(`❌ Lỗi khi lấy bình luận cho post ${postId}:`, error, xhr.status, xhr.responseText);
            state.isLoading = false;
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            commentStates.set(postId, state);
        }
    });
}

// Khởi tạo observer cho bình luận
function initCommentsObserver(postId) {
    if (!commentStates.has(postId)) {
        commentStates.set(postId, initCommentState(postId));
    }

    const commentsList = document.getElementById(`commentsList-${postId}`);
    const sentinel = document.getElementById(`sentinel-${postId}`);
    if (!commentsList || !sentinel) {
        console.error(`❌ Không tìm thấy #commentsList-${postId} hoặc #sentinel-${postId}`);
        return;
    }

    // Tải bình luận đầu tiên
    fetchComments(postId, 1, false);

    // Sử dụng IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
        const state = commentStates.get(postId);
        if (entries[0].isIntersecting && !state.isLoading && state.hasMoreComments) {
            state.currentPage++;
            fetchComments(postId, state.currentPage, true);
            commentStates.set(postId, state);
        }
    }, {
        root: commentsList,
        threshold: 0.1
    });

    observer.observe(sentinel);
}

// Hàm tiện ích
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

function extractFileId(url) {
    const match = url.match(/\/d\/(.+?)\//);
    return match ? match[1] : '';
}

function connectUser(posterId) {
    $.ajax({
        url: `/User/Connect`,
        type: 'POST',
        data: { posterId: posterId },
        dataType: 'json',
        success: function (response) {
            if (response.success) {
                alert('Đã gửi yêu cầu kết nối thành công!');
                // Có thể cập nhật giao diện, ví dụ: đổi nút "Kết nối" thành "Đã gửi yêu cầu"
            } else {
                alert('Lỗi khi gửi yêu cầu kết nối: ' + (response.message || 'Vui lòng thử lại.'));
            }
        },
        error: function (xhr, status, error) {
            console.error('❌ Lỗi khi gửi yêu cầu kết nối:', error, xhr.status, xhr.responseText);
            alert('Đã xảy ra lỗi khi gửi yêu cầu kết nối. Vui lòng thử lại.');
        }
    });
}

function skipUser(posterId) {
    $.ajax({
        url: `/User/Skip`,
        type: 'POST',
        data: { posterId: posterId },
        dataType: 'json',
        success: function (response) {
            if (response.success) {
                alert('Đã bỏ qua người dùng.');
                // Có thể ẩn bài viết hoặc cập nhật giao diện
            } else {
                alert('Lỗi khi bỏ qua người dùng: ' + (response.message || 'Vui lòng thử lại.'));
            }
        },
        error: function (xhr, status, error) {
            console.error('❌ Lỗi khi bỏ qua người dùng:', error, xhr.status, xhr.responseText);
            alert('Đã xảy ra lỗi khi bỏ qua người dùng. Vui lòng thử lại.');
        }
    });
}