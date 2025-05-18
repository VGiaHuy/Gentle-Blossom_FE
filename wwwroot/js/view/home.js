function initViewHome() {
    //initCreatePostModal();
    initProfileView();
}

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
        method: "GET",
        data: {
            page: page,
            pageSize: pageSize
        },
        timeout: 5000,
        success: function (data, textStatus, xhr) {
            // Kiểm tra nếu không còn bài viết
            if (data.includes("Không còn bài viết nào!") || xhr.status === 204) {
                hasMorePosts = false;
                $("#loading").html("<div class='text-center text-muted py-3'>Không còn bài viết nào!</div>");
                isLoading = false;
                return;
            }

            // Kiểm tra lỗi từ server
            if (data.includes("Error")) {
                $("#loading").html(`<div class='text-center text-danger py-3'>${data}</div>`);
                isLoading = false;
                return;
            }

            // Thêm nội dung vào container
            const $content = $(data);
            if (append) {
                $content.hide().appendTo("#post-container").fadeIn(500);
            } else {
                $("#post-container").html($content);
            }

            // Khởi tạo lazy loading cho iframe
            initializeLazyIframes(document.getElementById("post-container"));

            currentPage++;
            isLoading = false;
            $("#loading").hide();
        },
        error: function (xhr, status, error) {
            // Xử lý lỗi HTTP2 hoặc status 0
            if (xhr.status === 0 || status === "error") {
                hasMorePosts = false; // Ngăn gọi tiếp
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

// Tải trang đầu tiên khi document ready
$(document).ready(function () {
    initProfileView();
});