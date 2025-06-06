$(document).ready(function () {
    initProfileView();
});

let currentPage = 1;
const pageSize = 5;
let isLoading = false;
let hasMorePosts = true;

// Hàm khởi tạo partial view trang cá nhân
function initProfileView() {
    // Reset trạng thái
    currentPage = 1;
    hasMorePosts = true;
    isLoading = false;
    $("#loading").empty(); // Xóa nội dung loading cũ
    $("#post-container").empty(); // Xóa bài viết cũ

    // Tải trang đầu tiên
    loadPosts(currentPage, false);
}

// Hàm gắn sự kiện click cho nút bình luận
function attachCommentButtonEvents() {
    document.querySelectorAll('button.comment-button').forEach(button => {
        button.removeEventListener('click', handleCommentButtonClick);
        button.addEventListener('click', handleCommentButtonClick);
    });
}

// Hàm xử lý click nút bình luận
function handleCommentButtonClick(event) {
    event.preventDefault();
    const button = event.target.closest('button.comment-button');
    const postId = button.getAttribute('data-post-id');
    const postElement = button.closest('.mb-4.border');

    if (!postElement) {
        console.error('Không tìm thấy phần tử bài viết');
        return;
    }

    const contentElement = postElement.querySelector('div.text-muted.mb-3');
    const content = contentElement?.innerHTML || ''; // Lấy toàn bộ nội dung HTML
    $("#commentsList").empty();

    const postData = {
        postId: postId,
        avatar: postElement.querySelector('img.rounded-circle')?.src || '/images/default-avatar.jpg',
        academicTitle: postElement.querySelector('.accademictitle')?.textContent || '',
        posterName: postElement.querySelector('.text-primary.fw-bold')?.textContent || 'Unknown',
        createdDate: postElement.querySelector('.text-muted.mb-0.small')?.textContent || '',
        content: content, // Gán nội dung HTML vào đây
        mediaList: Array.from(postElement.querySelectorAll('.media-gallery .col-6')).map(div => {
            const img = div.querySelector('img');
            const iframe = div.querySelector('iframe');
            let mediaUrl = '';
            if (img) {
                const urlMatch = img.src.match(/url=(.+)$/);
                mediaUrl = urlMatch ? decodeURIComponent(urlMatch[1]) : '';
            } else if (iframe) {
                mediaUrl = iframe.src;
            }
            return {
                mediaType: img ? 'Image' : 'Video',
                mediaUrl: mediaUrl,
                fileName: img ? img.alt : ''
            };
        }),
        numberOfLike: parseInt(postElement.querySelector('.text-muted.small[id*="post-like-count"]')?.textContent.match(/\d+/)[0]) || 0,
        numberOfComment: parseInt(postElement.querySelector('.text-muted.small.comment-count')?.textContent.match(/\d+/)[0]) || 0,
        numberOfShare: parseInt(postElement.querySelector('.text-muted.small.share-count')?.textContent.match(/\d+/)[0]) || 0
    };

    if (typeof window.openPostModal === 'function') {
        window.openPostModal(postData);
    } else {
        console.error('window.openPostModal is not defined. Ensure detailPost.js is loaded correctly.');
    }
}

// Hàm xử lý click nút thích
window.toggleLike = function (button, type, postId) {
    const icon = button.querySelector('i');
    const isLiked = button.getAttribute('data-liked') === 'true';
    const userId = document.getElementById('userId')?.value || '';

    // Đổi icon ngay lập tức để cải thiện UX
    if (isLiked) {
        icon.classList.remove('bi-heart-fill', 'text-danger');
        icon.classList.add('bi-heart');
    } else {
        icon.classList.remove('bi-heart');
        icon.classList.add('bi-heart-fill', 'text-danger');
    }

    // Gửi yêu cầu Toggle Like lên server
    $.ajax({
        url: '/Post/ToggleLikePost',
        type: 'POST',
        data: {
            postId: parseInt(postId),
            userId: parseInt(userId)
        },
        success: function (data) {
            if (data.success) {
                // Cập nhật số lượt thích
                const countElement = document.getElementById(`post-like-count-${postId}`);
                if (countElement) {
                    let count = parseInt(countElement.textContent.match(/\d+/)[0]);
                    count = isLiked ? count - 1 : count + 1;
                    countElement.textContent = `${count} lượt thích`;
                }

                // Cập nhật trạng thái mới
                button.setAttribute('data-liked', (!isLiked).toString());
            } else {
                alert("Không thể thực hiện thao tác: " + data.message);
                restoreIcon(icon, isLiked);
            }
        },
        error: function () {
            console.error('Lỗi khi gửi Like/Unlike');
            restoreIcon(icon, isLiked);
        }
    });
};

// Hàm phục hồi icon nếu bị lỗi
function restoreIcon(icon, wasLiked) {
    icon.classList.remove('bi-heart', 'bi-heart-fill', 'text-danger');
    icon.classList.add(wasLiked ? 'bi-heart-fill' : 'bi-heart');
    if (wasLiked) {
        icon.classList.add('text-danger');
    }
}

// Hàm cập nhật trạng thái biểu tượng Like sau khi nạp partial view
function initializeLikeButtons(container) {
    const likeButtons = container.querySelectorAll('.like-button');
    likeButtons.forEach(button => {
        const icon = button.querySelector('i');
        const isLiked = button.getAttribute('data-liked') === 'true';
        icon.classList.remove('bi-heart', 'bi-heart-fill', 'text-danger');
        icon.classList.add(isLiked ? 'bi-heart-fill' : 'bi-heart');
        if (isLiked) {
            icon.classList.add('text-danger');
        }
    });
}

// Hàm tải bài viết
function loadPosts(page, append = false) {
    if (isLoading || !hasMorePosts) {
        if (!hasMorePosts) {
            $("#loading").html("<div class='text-center text-muted py-3'>Không còn bài viết nào!</div>");
        }
        return;
    }

    isLoading = true;
    $("#loading").html("<div class='text-center py-3'><i class='bi bi-spinner spinner-border'></i> Loading...</div>").show();

    $.ajax({
        url: "/Post/GetAllPost",
        type: "GET",
        data: {
            page: page,
            pageSize: pageSize
        },
        success: function (data, xhr) {
            if (data.includes("Không còn bài viết nào!") || xhr.status === 204) {
                hasMorePosts = false;
                $("#loading").html("<div class='text-center text-muted py-3'>Không còn bài viết nào!</div>");
                isLoading = false;
                return;
            }

            if (data.includes("Error")) {
                $("#loading").html(`<div class='text-center text-danger py-3'>${data}</div>`);
                isLoading = false;
                return;
            }

            const $content = $(data);
            if (append) {
                $content.hide().appendTo("#post-container").fadeIn(500);
            } else {
                $("#post-container").html($content);
            }

            initializeLazyIframes(document.getElementById("post-container"));
            attachCommentButtonEvents();
            initializeLikeButtons(document.getElementById("post-container"));

            currentPage++;
            isLoading = false;
            $("#loading").hide();
        },
        error: function (xhr, status, error) {
            if (xhr.status === 0 || status === "error") {
                hasMorePosts = false;
                $("#loading").html("<div class='text-center text-muted py-3'>Không còn bài viết nào!</div>");
                isLoading = false;
                return;
            }

            let errorMsg = "Error loading posts. Please try again.";
            if (xhr.status === 404) {
                errorMsg = "No posts found for this user.";
            } else if (xhr.status === 500) {
                errorMsg = xhr.responseText || "Server error. Please try again later.";
            }

            $("#loading").html(`<div class='text-center text-danger py-3'>${errorMsg}</div>`);
            isLoading = false;
        }
    });
}

// Hàm khởi tạo lazy loading cho iframe
function initializeLazyIframes(container) {
    const iframes = container.querySelectorAll("iframe[data-src]");
    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const iframe = entry.target;
                    if (iframe.dataset.src) {
                        iframe.src = iframe.dataset.src;
                        observer.unobserve(iframe);
                    }
                }
            });
        });

        iframes.forEach((iframe) => observer.observe(iframe));
    } else {
        iframes.forEach((iframe) => {
            if (iframe.dataset.src) {
                iframe.src = iframe.dataset.src;
            }
        });
    }
}

// Gắn sự kiện scroll
$(window).off("scroll.profile").on("scroll.profile", _.debounce(function () {
    if ($(window).scrollTop() + $(window).height() >= $(document).height() - 100) {
        if (!isLoading && hasMorePosts) {
            loadPosts(currentPage, true);
        }
    }
}, 200));