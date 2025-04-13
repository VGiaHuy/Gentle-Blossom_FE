$(function () {
    $(document).on("click", ".nav-link-custom, .dropdown-item[data-view], a[data-view]", function (e) {
        e.preventDefault();

        const viewName = $(this).data("view");
        if (!viewName) {
            console.log("Không tìm thấy data-view!");
            return;
        }

        // Xử lý URL: Nếu viewName chứa '/', dùng nguyên URL, ngược lại thêm '/Index'
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
            },
            error: function (xhr, status, error) {
                console.log("Lỗi AJAX gọi view: ", xhr.status, error);
                $("#main-content").html(`<div class='text-danger p-3'>Lỗi: ${xhr.status} - ${error}</div>`);
            }
        });
    });
});
