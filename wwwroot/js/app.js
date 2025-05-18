
//$(function () {
//    function loadScript(scriptUrl, callback) {
//        $.getScript(scriptUrl)
//            .done(function () {
//                if (callback) callback();
//            })
//            .fail(function () {
//                console.error(`Failed to load script: ${scriptUrl}`);
//            });
//    }

//    $(document).on("click", ".nav-link-custom, .dropdown-item[data-view], a[data-view]", function (e) {
//        e.preventDefault();

//        const viewName = $(this).data("view");
//        if (!viewName) {
//            console.log("Không tìm thấy data-view!");
//            return;
//        }

//        const url = viewName.includes("/") ? `/${viewName}` : `/${viewName}/Index`;

//        $.ajax({
//            url: url,
//            method: "GET",
//            cache: true,
//            beforeSend: function () {
//                $("#main-content").html("<div class='text-center p-3'><i class='bi bi-spinner fs-3'></i> Đang tải...</div>");
//                $("#main-content script").remove();
//            },
//            success: function (html) {
//                $("#main-content").html(html);
//                window.scrollTo({ top: 0, behavior: 'smooth' }); // cuộn lên đầu

//                // Cập nhật URL trên thanh địa chỉ
//                history.pushState(null, '', url);

//                // Tải script tương ứng với view
//                if (viewName === "Home") {
//                    loadScript("/wwwroot/js/view/home.js", function () {
//                        initViewHome();
//                    });
//                } else if (viewName === "UserProfile") {
//                    loadScript("/wwwroot/js/view/userProfile.js", function () {
//                        initViewUserProfile();
//                    });
//                }
//            },
//            error: function (xhr, status, error) {
//                $("#main-content").html(`<div class='text-danger p-3'>Lỗi: ${xhr.status} - ${error}</div>`);
//            }
//        });
//    });

//    window.onpopstate = function () {
//        const url = location.pathname;

//        $.ajax({
//            url: url,
//            method: "GET",
//            beforeSend: function () {
//                $("#main-content").html("<div class='text-center p-3'><i class='bi bi-spinner fs-3'></i> Đang tải...</div>");
//            },
//            success: function (html) {
//                $("#main-content").html(html);

//                // Tải script tương ứng với view
//                if (viewName === "Home") {
//                    loadScript("/js/view/home.js", function () {
//                        initViewHome();
//                    });
//                } else if (viewName === "UserProfile") {
//                    loadScript("/js/view/userProfile.js", function () {
//                        initViewUserProfile();
//                    });
//                }
//            },
//            error: function (xhr) {
//                $("#main-content").html(`<div class='text-danger p-3'>Lỗi: ${xhr.status} - Không thể tải trang.</div>`);
//            }
//        });
//    };
//});
