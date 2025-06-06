$(document).ready(function () {
    console.log('Script thông báo được khởi tạo');

    let notificationPage = 1;
    const notificationPageSize = 20;
    let notificationIsLoading = false;
    let notificationHasMore = true;
    const userId = $('#userId').val(); // Lấy userId từ input ẩn

    // Hàm điều chỉnh vị trí badge
    function adjustBadgePosition() {
        console.log('Điều chỉnh vị trí badge');
        const button = $('#notifications');
        const badge = $('#notification-count').parent();
        const buttonOffset = button.offset();
        const buttonWidth = button.outerWidth();
        const buttonHeight = button.outerHeight();

        badge.css({
            top: buttonOffset.top + buttonHeight / 2,
            left: buttonOffset.left + buttonWidth,
        });
    } transform: 'translate(-50%, -50%)' // Thay translate-middle


    // Gọi điều chỉnh vị trí badge khi trang load và khi resize
    adjustBadgePosition();
    $(window).on('resize', function () {
        console.log('Resize cửa sổ, điều chỉnh vị trí badge');
        adjustBadgePosition();
    });

    // load dữ liệu
    loadNotifications(false)

    // Hàm lấy danh sách thông báo từ controller
    function loadNotifications(append = true) {
        if (notificationIsLoading || !notificationHasMore || !userId) {
            console.log('Tải thông báo bị hủy', { isLoading: notificationIsLoading, hasMore: notificationHasMore, userId });
            return;
        }
        notificationIsLoading = true;

        $.ajax({
            url: '/Notification/GetNotification',
            method: 'GET',
            data: { userId: userId, page: notificationPage, pageSize: notificationPageSize },
            dataType: 'json',
            success: function (response) {
                console.log('data', response.data);

                if (!response.success) {
                    console.error('Lỗi từ API:', response.message);
                    $('#notification-list').append('<div class="text-danger p-2">Lỗi khi tải thông báo</div>');
                    notificationIsLoading = false;
                    return;
                }

                const data = response.data;
                const notifications = data.notifications; // List<NotificationDTO>
                const totalCount = data.totalCount; // Tổng số thông báo

                const list = $('#notification-list');
                const count = $('#notification-count');

                if (!append) {
                    list.empty(); // Xóa danh sách cũ nếu không thêm vào
                    notificationPage = 1; // Reset trang
                    notificationHasMore = true;
                }

                // Cập nhật số lượng thông báo
                count.text(totalCount);

                if (notifications.length === 0) {
                    if (notificationPage === 1) {
                        list.append('<div class="text-muted p-2">Không có thông báo mới</div>');
                        console.log('Không có thông báo mới');
                    }
                    notificationHasMore = false;
                    notificationIsLoading = false;
                    return;
                }

                // Thêm từng thông báo vào modal
                notifications.forEach(notification => {
                    const isUnseen = notification.isSeen === false;
                    const createAt = notification.createAt ? new Date(notification.createAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '';
                    const notificationItem = `
                        <div class="p-2 border rounded mb-1${isUnseen ? ' bg-light fw-bold' : ''}">
                            <a class="text-decoration-none text-dark" href="#" data-notification-id="${notification.notificationId}">
                                <p class="mb-0">${notification.content}</p>
                                ${createAt ? `<small class="text-muted">${createAt}</small>` : ''}
                            </a>
                        </div>`;
                    list.append(notificationItem);
                });

                // Tăng số trang nếu tải thành công
                if (notifications.length < notificationPageSize) {
                    notificationHasMore = false; // Không còn thông báo để tải
                } else {
                    notificationPage++;
                }
                notificationIsLoading = false;
            },
            error: function (xhr, status, error) {
                console.error('Lỗi khi gọi API:', error);
                $('#notification-list').append('<div class="text-danger p-2">Lỗi khi tải thông báo</div>');
                notificationIsLoading = false;
            }
        });
    }

    // Tải thông báo khi modal được mở
    $('#notificationModal').on('show.bs.modal', function () {
        loadNotifications(false); // Tải lại từ trang đầu tiên
    });

    // Xử lý sự kiện cuộn để tải thêm thông báo
    $('#notification-list').on('scroll', function () {
        console.log('Sự kiện cuộn được kích hoạt');
        const list = $(this);
        if (list.scrollTop() + list.innerHeight() >= list[0].scrollHeight - 10) {
            console.log('Cuộn đến cuối, tải thêm thông báo');
            loadNotifications(true); // Tải thêm thông báo
        }
    });

    // Xử lý sự kiện click vào thông báo
    $('#notification-list').on('click', 'a[data-notification-id]', function (e) {
        e.preventDefault();
        const notificationId = $(this).data('notification-id');
        console.log('Nhấn vào thông báo với ID:', notificationId);

        // Gọi AJAX tới controller khi nhấn vào thông báo
        $.ajax({
            url: `/api/notifications/${notificationId}`,
            method: 'POST',
            dataType: 'json',
            success: function (response) {
                console.log('Thông báo được xử lý:', response);
                // Làm mới danh sách thông báo
                loadNotifications(false);
            },
            error: function (xhr, status, error) {
                console.error('Lỗi khi xử lý thông báo:', error);
            }
        });
    });

    // Tự động làm mới thông báo mỗi 30 giây (chỉ khi modal đang mở)
    setInterval(() => {
        if ($('#notificationModal').hasClass('show')) {
            console.log('Tự động làm mới thông báo vì modal đang mở');
            loadNotifications(false);
        } else {
            console.log('Bỏ qua làm mới vì modal không mở');
        }
    }, 30000);

    // Định vị modal ngay bên dưới nút thông báo
    $('#notificationModal').on('shown.bs.modal', function () {
        const button = $('#notifications');
        const modalDialog = $(this).find('.modal-dialog');
        const buttonOffset = button.offset();
        const buttonHeight = button.outerHeight();
        modalDialog.css({
            top: buttonOffset.top + buttonHeight,
            left: buttonOffset.left + button.outerWidth() - modalDialog.outerWidth(),
            right: 'auto'
        });
    });

    // Đóng modal khi nhấn ra bên ngoài
    $(document).on('click', function (e) {
        if ($('#notificationModal').hasClass('show') &&
            !$(e.target).closest('.modal-content').length &&
            !$(e.target).closest('#notifications').length) {
            $('#notificationModal').modal('hide');
        } else {
            console.log('Click bên trong modal-content hoặc nút thông báo, giữ modal mở');
        }
    });
});