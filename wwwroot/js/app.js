$(function () {
    $(document).on("click", ".nav-link-custom, .dropdown-item[data-view], a[data-view]", function (e) {
        e.preventDefault();

        const viewName = $(this).data("view");
        if (!viewName) {
            console.log("Không tìm thấy data-view!");
            return;
        }

        const url = viewName.includes("/") ? `/${viewName}` : `/${viewName}/Index`;

        $.ajax({
            url: url,
            method: "GET",
            cache: true,
            beforeSend: function () {
                $("#main-content").html("<div class='text-center p-3'><i class='bi bi-spinner fs-3'></i> Đang tải...</div>");
            },
            success: function (html) {
                $("#main-content").html(html);
                window.scrollTo({ top: 0, behavior: 'smooth' }); // cuộn lên đầu

                // Cập nhật URL trên thanh địa chỉ
                history.pushState(null, '', url);

                // Dọn dẹp khi rời khỏi UserProfile
                if (!url.includes("UserProfile") && typeof cleanupCreatePostModal === "function") {
                    cleanupCreatePostModal();
                }
                // Gọi hàm initView_CreatePost nếu tồn tại
                if (typeof initView_CreatePost === "function") {
                    initView_CreatePost();
                }
                // Khởi chạy các script của partial view
                if (url.includes("UserProfile")) {
                    $(window).off("scroll.profile");
                    if (typeof initProfileView === "function") {
                        initProfileView();
                    }
                }

            },
            error: function (xhr, status, error) {
                $("#main-content").html(`<div class='text-danger p-3'>Lỗi: ${xhr.status} - ${error}</div>`);
            }
        });
    });

    window.onpopstate = function () {
        const url = location.pathname;

        $.ajax({
            url: url,
            method: "GET",
            beforeSend: function () {
                $("#main-content").html("<div class='text-center p-3'><i class='bi bi-spinner fs-3'></i> Đang tải...</div>");
            },
            success: function (html) {
                $("#main-content").html(html);

                if (url.includes("UserProfile") && typeof initProfileView === "function") {
                    initProfileView();
                }
            },
            error: function (xhr) {
                $("#main-content").html(`<div class='text-danger p-3'>Lỗi: ${xhr.status} - Không thể tải trang.</div>`);
            }
        });
    };
});
