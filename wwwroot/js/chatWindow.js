const chatRoomId = document.getElementsByName('chatRoomId').value;
console.log('Chat Room ID:', chatRoomId);

// Hàm dọn dẹp trạng thái modal
function clearModalState() {
    console.log('Clearing modal state');
    $('body').removeClass('modal-open').css({
        'overflow': '',
        'padding-right': ''
    });
    $('.modal-backdrop').remove();
    $('#trackingModal, #trackingDetailModal, #healthHistoryModal, #createTrackingModal, #createJourneyModal').removeAttr('tabindex').css('pointer-events', 'none');
    $('.modal-dialog').css('pointer-events', 'auto');
    $('#messageInput').prop('disabled', false);
}

// Khởi tạo draggable cho cả 3 modal
if ($("#trackingModal .modal-dialog").length) {
    $("#trackingModal .modal-dialog").draggable({
        handle: ".modal-header"
    });
}
if ($("#trackingDetailModal .modal-dialog").length) {
    $("#trackingDetailModal .modal-dialog").draggable({
        handle: ".modal-header"
    });
}
if ($("#healthHistoryModal .modal-dialog").length) {
    $("#healthHistoryModal .modal-dialog").draggable({
        handle: ".modal-header"
    });
}
// Khởi tạo draggable cho createTrackingModal
if ($("#createTrackingModal .modal-dialog").length) {
    $("#createTrackingModal .modal-dialog").draggable({
        handle: ".modal-header"
    });
}
// Khởi tạo draggable cho createJourneyModal
if ($("#createJourneyModal .modal-dialog").length) {
    console.log('createJourneyModal found, initializing draggable');
    $("#createJourneyModal .modal-dialog").draggable({
        handle: ".modal-header"
    });
}


// Xử lý sự kiện mở trackingModal và lấy dữ liệu
$(document).off('click.createTracking').on('click.createTracking', '#createTracking', function () {
    console.log('Nút createTracking được click');
    try {
        clearModalState();
        const modalElement = document.getElementById('trackingModal');

        if (!modalElement) {
            console.error('trackingModal element not found');
            return;
        }
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: false,
            keyboard: true,
            focus: false
        });

        // Gọi API để lấy danh sách tracking
        $.ajax({
            url: '/PregnancyCare/GetHealthJourney',
            method: 'GET',
            data: { chatRoomId: parseInt(chatRoomId) },
            success: function (response) {
                console.log('Dữ liệu tracking:', response);
                const trackingList = $('#trackingList');
                trackingList.empty();
                if (response.success && response.data && response.data.length > 0) {
                    response.data.forEach(item => {
                        trackingList.append(`
                                        <tr>
                                            <td>${item.treatmentName || 'N/A'}</td>
                                            <td>${item.startDate ? new Date(item.startDate).toLocaleDateString('vi-VN') : 'N/A'}</td>
                                            <td>${item.dueDate ? new Date(item.dueDate).toLocaleDateString('vi-VN') : 'N/A'}</td>
                                            <td>${item.status ? 'Đang điều trị' : 'Đã điều trị'}</td>
                                            <td>
                                                <button class="btn btn-primary btn-sm view-tracking" data-tracking-id="${item.journeyId}" data-treatment-id="${item.treatmentId}">Sức khỏe định kỳ</button>
                                                <button class="btn btn-primary btn-sm view-history mt-2" data-tracking-id="${item.journeyId}">Lịch sử theo dõi</button>
                                            </td>
                                        </tr>
                                    `);
                    });
                } else {
                    trackingList.append('<tr><td colspan="5" class="text-center">Không có dữ liệu</td></tr>');
                }
                modal.show();
                clearModalState();
            },
            error: function (err) {
                console.error('Lỗi khi lấy dữ liệu tracking:', err);
                $('#trackingList').html('<tr><td colspan="5" class="text-center">Lỗi khi tải dữ liệu</td></tr>');
                modal.show();
                clearModalState();
            }
        });

        $('#messageInput').off('click.inputFocus').on('click.inputFocus', function () {
            $(this).focus();
            console.log('messageInput clicked and focused', $(this).is(':focus') ? 'in focus' : 'failed to focus');
        });
    } catch (error) {
        console.error('Lỗi khi hiển thị modal:', error);
    }
});

// Xử lý sự kiện click nút Sức khỏe định kỳ
$(document).off('click.viewTracking').on('click.viewTracking', '.view-tracking', function () {
    const trackingId = $(this).data('tracking-id');
    const treatmentId = $(this).data('treatment-id');

    try {
        clearModalState();
        const modalElement = document.getElementById('trackingDetailModal');
        if (!modalElement) {
            console.error('trackingDetailModal element not found');
            return;
        }
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: false,
            keyboard: true,
            focus: false
        });

        // Gọi API để lấy chi tiết tracking
        $.ajax({
            url: '/PregnancyCare/GetDetailHealthJourney',
            method: 'GET',
            data: { trackingId: trackingId, treatmentId: treatmentId },
            success: function (response) {
                const content = $('#trackingDetailContent');
                // Kiểm tra response.data là mảng và có dữ liệu
                if (response.success && Array.isArray(response.data) && response.data.length > 0) {
                    let htmlContent = '<div class="tracking-list">';
                    response.data.forEach((data, index) => {
                        htmlContent += `
                                    <div class="tracking-item mb-3 p-3 border rounded">
                                        <h6>Bản ghi ${index + 1}</h6>
                                `;
                        if (treatmentId == 1) {
                            htmlContent += `
                                        <p><strong>Tên điều trị:</strong> ${data.treatmentName || 'N/A'}</p>
                                        <p><strong>Nhật ký:</strong> ${data.notes || 'N/A'}</p>
                                        <p><strong>Tâm trạng:</strong> ${data.mood || 'N/A'}</p>
                                        <p><strong>Ngày tạo:</strong> ${data.createdDate ? new Date(data.createdDate).toLocaleDateString('vi-VN') : 'N/A'}</p>
                                    `;
                        } else if (treatmentId == 2) {
                            htmlContent += `
                                        <p><strong>Tên điều trị:</strong> ${data.treatmentName || 'N/A'}</p>
                                        <p><strong>Huyết áp:</strong> ${data.bloodPressure || 'N/A'}</p>
                                        <p><strong>Ngày dự sinh:</strong> ${data.dueDate ? new Date(data.dueDate).toLocaleDateString('vi-VN') : 'N/A'}</p>
                                        <p><strong>Tâm trạng:</strong> ${data.mood || 'N/A'}</p>
                                        <p><strong>Ngày tạo:</strong> ${data.createdDate ? new Date(data.createdDate).toLocaleDateString('vi-VN') : 'N/A'}</p>
                                        <p><strong>Tuần thai:</strong> ${data.weeksPregnant || 'N/A'}</p>
                                        <p><strong>Chu vi vòng eo:</strong> ${data.waistCircumference || 'N/A'} cm</p>
                                        <p><strong>Cân nặng:</strong> ${data.weight || 'N/A'} kg</p>
                                        <p><strong>Giới tính em bé:</strong> ${data.genderBaby === true ? 'Nam' : data.genderBaby === false ? 'Nữ' : 'Chưa xác định'}</p>
                                        <p><strong>Ghi chú:</strong> ${data.notes || 'N/A'}</p>
                                    `;
                        } else {
                            htmlContent += '<p class="text-danger">Loại điều trị không hợp lệ</p>';
                        }
                        htmlContent += '</div>';
                    });
                    htmlContent += '</div>';
                    content.html(htmlContent);
                } else {
                    content.html('<p class="text-danger">Không tìm thấy dữ liệu chi tiết</p>');
                }
                modal.show();
                clearModalState();
            },
            error: function (err) {
                console.error('Lỗi khi lấy chi tiết tracking:', err);
                $('#trackingDetailContent').html('<p class="text-danger">Lỗi khi tải dữ liệu</p>');
                modal.show();
                clearModalState();
            }
        });
    } catch (error) {
        console.error('Lỗi khi hiển thị modal chi tiết:', error);
    }
});

// Xử lý sự kiện click nút Xem lịch sử
$(document).off('click.viewHistory').on('click.viewHistory', '.view-history', function () {
    const trackingId = $(this).data('tracking-id');
    console.log('Nút view-history được click, trackingId:', trackingId);
    try {
        clearModalState();
        const modalElement = document.getElementById('healthHistoryModal');
        if (!modalElement) {
            console.error('healthHistoryModal element not found');
            return;
        }
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: false,
            keyboard: true,
            focus: false
        });

        // Lưu journeyId vào data của modal
        $(modalElement).data('journeyId', trackingId);

        // Gọi API để lấy lịch sử theo dõi
        $.ajax({
            url: '/PregnancyCare/GetHealthHistory',
            method: 'GET',
            data: { trackingId: trackingId },
            success: function (response) {
                console.log('Dữ liệu lịch sử theo dõi:', response);
                const content = $('#healthHistoryContent');
                if (response.success && Array.isArray(response.data) && response.data.length > 0) {
                    let htmlContent = '<div class="history-list">';
                    response.data.forEach((data, index) => {
                        htmlContent += `
                                        <div class="history-item mb-3 p-3 border rounded">
                                            <h6>Bản ghi ${index + 1}</h6>
                                            <p><strong>Chuyên gia:</strong> ${data.expertName || 'N/A'}</p>
                                            <p><strong>Trạng thái:</strong> ${data.status ? 'Đang theo dõi' : 'Đã hoàn thành'}</p>
                                            <p><strong>Ghi chú:</strong> ${data.notes || 'N/A'}</p>
                                            <p><strong>Ngày tạo:</strong> ${data.createdDate ? new Date(data.createdDate).toLocaleDateString('vi-VN') : 'N/A'}</p>
                                        </div>
                                    `;
                    });
                    htmlContent += '</div>';
                    content.html(htmlContent);
                } else {
                    content.html('<p class="text-danger">Không tìm thấy dữ liệu lịch sử</p>');
                }
                modal.show();
                clearModalState();
            },
            error: function (err) {
                console.error('Lỗi khi lấy dữ liệu lịch sử:', err);
                $('#healthHistoryContent').html('<p class="text-danger">Lỗi khi tải dữ liệu</p>');
                modal.show();
                clearModalState();
            }
        });
    } catch (error) {
        console.error('Lỗi khi hiển thị modal lịch sử:', error);
    }
});

// Xử lý sự kiện click nút Tạo phiếu theo dõi
$(document).off('click.createTrackingTicket').on('click.createTrackingTicket', '#healthHistoryModal .create-tracking-ticket', function () {
    console.log('Nút Tạo phiếu theo dõi được click');
    try {
        clearModalState();
        const modalElement = document.getElementById('createTrackingModal');
        if (!modalElement) {
            console.error('createTrackingModal element not found');
            return;
        }
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: false,
            keyboard: true,
            focus: false
        });

        // Lấy journeyId từ healthHistoryModal
        const journeyId = $('#healthHistoryModal').data('journeyId');
        console.log('JourneyId cho phiếu theo dõi:', journeyId);

        modal.show();
        clearModalState();

        // Xử lý submit form
        $('#createTrackingForm').off('submit').on('submit', function (e) {
            e.preventDefault();
            const formData = {
                status: $('#trackingStatus').val() === 'true',
                notes: $('#trackingNotes').val(),
                journeyId: journeyId
            };
            console.log('Dữ liệu form:', formData);

            // Gửi dữ liệu qua API
            $.ajax({
                url: '/PregnancyCare/CreateHealthTracking',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(formData),
                success: function (response) {
                    console.log('Tạo phiếu theo dõi thành công:', response);
                    if (response.success) {
                        alert('Tạo phiếu theo dõi thành công!');
                        modal.hide();
                        clearModalState();
                        // Tải lại danh sách lịch sử
                        $('#healthHistoryModal .create-tracking-ticket').trigger('click.viewHistory');
                    } else {
                        alert('Lỗi: ' + response.message);
                    }
                },
                error: function (err) {
                    console.error('Lỗi khi tạo phiếu theo dõi:', err);
                    alert('Lỗi khi lưu dữ liệu');
                }
            });
        });
    } catch (error) {
        console.error('Lỗi khi hiển thị modal tạo phiếu:', error);
    }
});

// Xử lý sự kiện click nút Tạo mới
$(document).off('click.createNewJourney').on('click.createNewJourney', '#createNewJourney', function () {
    console.log('Nút Tạo mới được click');
    try {
        clearModalState();
        const modalElement = document.getElementById('createJourneyModal');
        if (!modalElement) {
            console.error('createJourneyModal element not found');
            return;
        }
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: false,
            keyboard: true,
            focus: false
        });
        modal.show();
        clearModalState();

        // Xử lý submit form
        $('#createJourneyForm').off('submit').on('submit', function (e) {
            e.preventDefault();
            const formData = {
                dueDate: $('#dueDate').val(),
                monitoringStatus: $('#monitoringStatus').val() === 'true',
                notes: $('#journeyNotes').val() || null,
            };
            console.log('Dữ liệu form:', formData);

            // Gửi dữ liệu qua API
            $.ajax({
                url: '/PregnancyCare/CreateHealthJourney', // Thay bằng URL API thực tế
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(formData),
                success: function (response) {
                    console.log('Tạo hành trình mới thành công:', response);
                    if (response.success) {
                        alert('Tạo hành trình mới thành công!');
                        modal.hide();
                        clearModalState();
                        // Tùy chọn: Tải lại danh sách tracking
                        $('#createTracking').trigger('click.createTracking');
                    } else {
                        alert('Lỗi: ' + response.message);
                    }
                },
                error: function (err) {
                    console.error('Lỗi khi tạo hành trình mới:', err);
                    alert('Lỗi khi lưu dữ liệu');
                }
            });
        });
    } catch (error) {
        console.error('Lỗi khi hiển thị modal tạo hành trình:', error);
    }
});


// Dọn dẹp trạng thái khi modal đóng
$(document).off('hidden.bs.modal.trackingModal').on('hidden.bs.modal.trackingModal', '#trackingModal, #trackingDetailModal', function () {
    clearModalState();
});

// Hiển thị modal chi tiết phòng chat
$(document).off('click.detailInfoChatRoom').on('click.detailInfoChatRoom', '#detailInfoChatRoom', function () {
    console.log('Nút detailInfoChatRoom được click');
    $('#chatRoomModal').modal('show');
});

$(document).off('hidden.bs.modal.trackingModal').on('hidden.bs.modal.trackingModal', '#trackingModal, #trackingDetailModal, #healthHistoryModal', function () {
    clearModalState();
});

// Cập nhật sự kiện ẩn modal để bao gồm createTrackingModal
$(document).off('hidden.bs.modal.trackingModal').on('hidden.bs.modal.trackingModal', '#trackingModal, #trackingDetailModal, #healthHistoryModal, #createTrackingModal, #createJourneyModal', function () {
    console.log('Modal hidden');
    clearModalState();
});


// Sao chép ChatCode
$(document).off('click.coppyChatCode').on('click.coppyChatCode', '#coppyChatCode', function () {
    console.log('Nút coppyChatCode được click');
    const chatCodeElement = document.getElementById('chatCodeInfo');
    if (!chatCodeElement) {
        console.error('Không tìm thấy phần tử chatCode');
        alert('Không tìm thấy mã phòng!');
        return;
    }
    const chatCode = chatCodeElement.textContent.trim();
    console.log('ChatCode:', chatCode);
    if (!chatCode) {
        console.error('Mã phòng trống');
        alert('Mã phòng trống!');
        return;
    }
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(chatCode).then(() => {
            alert('Đã sao chép mã phòng!');
        }).catch(err => {
            console.error('Lỗi sao chép:', err);
            alert('Không thể sao chép mã phòng!');
        });
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = chatCode;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            alert('Đã sao chép mã phòng!');
        } catch (err) {
            console.error('Lỗi sao chép fallback:', err);
            alert('Không thể sao chép mã phòng!');
        }
        document.body.removeChild(textArea);
    }
});