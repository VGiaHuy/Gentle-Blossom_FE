$(document).ready(function () {
    initProfileView();

    // Nút Thêm hồ sơ thai kỳ
    $('#addPeriodicHealth').on('click', function () {
        $('#addNewPeriodicHealthModal').modal('show');
    });

    // Nút Thêm nhật ký tâm lý
    $('#addPsychologyDiary').on('click', function () {
        $('#addNewPsychologyDiaryModal').modal('show');
    });
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

// Hàm xóa bài viết
function deletePost(postId) {
    const id = parseInt(postId);

    fetch(`/Post/DeletePost?postId=${id}`, {
        method: 'DELETE',
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Phản hồi từ server không thành công');
            }
            return response.json(); // Phân tích JSON từ phản hồi
        })
        .then(data => {
            if (data.success) {
                showSuccessModal('Bài viết đã được xóa thành công');
                console.log(`post-${postId}`);
                document.getElementById(`post-${postId}`)?.remove();
            } else {
                showErrorModal(data.message || 'Có lỗi xảy ra khi xóa bài viết');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showErrorModal(error);
        });
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

    const userId = $("#post-container").data("user-id");
    if (!userId) {
        console.error("Error: userId is null or undefined");
        $("#loading").html("<div class='text-center text-danger py-3'>User not authenticated.</div>");
        isLoading = false;
        return;
    }

    isLoading = true;
    $("#loading").html("<div class='text-center py-3'><i class='bi bi-spinner spinner-border'></i> Loading...</div>").show();

    $.ajax({
        url: "/Post/GetPostsOfUserById",
        method: "GET",
        data: {
            userId: userId,
            page: page,
            pageSize: pageSize
        },
        timeout: 5000,
        success: function (data, textStatus, xhr) {
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


// Thêm sự kiện cho nút editUserProfile
$(document).ready(function () {
    $('#editUserProfile').on('click', function () {
        $('#editUserModal').modal('show');
    });
});

function submitUserForm() {
    // Kiểm tra form hợp lệ
    const form = document.getElementById('editUserForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Tạo FormData để chứa dữ liệu form và file
    const formData = new FormData();
    formData.append('UserId', $('#userId').val());
    formData.append('FullName', $('#fullName').val());
    formData.append('BirthDate', $('#birthDate').val());
    formData.append('PhoneNumber', $('#phoneNumber').val());
    formData.append('Email', $('#email').val());
    formData.append('Gender', $('input[name="gender"]:checked').val() === '1' ? 'true' : 'false'); // Đảm bảo gửi boolean dưới dạng chuỗi    
    formData.append('UserTypeId', $('#userTypeId').val());

    // Thêm file ảnh nếu có
    const avatarInput = document.getElementById('avatar');
    if (avatarInput.files.length > 0) {
        formData.append('Avatar', avatarInput.files[0]);
    }

    // Lưu trữ nút gửi và nội dung ban đầu
    const submitButton = document.getElementById('saveChangeInfo');

    // Thay đổi nút thành trạng thái loading
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="bi bi-arrow-repeat spin me-2"></i>Đang xử lý...';

    // Gửi yêu cầu AJAX
    $.ajax({
        url: '/UserProfile/UpdateUserProfile',
        type: 'POST',
        data: formData,
        processData: false, // Ngăn jQuery xử lý FormData
        contentType: false, // Để trình duyệt tự đặt content type multipart/form-data
        success: function (response) {
            showSuccessModal('Cập nhật thông tin thành công!', 3000);
            $('#editUserModal').modal('hide');
            location.reload(true);
        },
        error: function (xhr, status, error) {
            showErrorModal('Đã có lỗi xảy ra: ' + xhr.responseJSON?.message, 3000);
        }
    });
}

// Tùy chọn: Xem trước ảnh đại diện
$(document).ready(function () {
    $('#avatar').on('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                $('#avatarPreview').attr('src', e.target.result).show();
            };
            reader.readAsDataURL(file);
        } else {
            $('#avatarPreview').hide();
        }
    });
});


document.addEventListener('DOMContentLoaded', function () {
    // Lấy fullName từ window.appData
    const fullName = window.appData ? window.appData.fullName : '';

    // Xử lý nút "Xem thêm" cho Thai sản
    const viewMoreThaiSanButton = document.getElementById('viewMoreThaiSan');
    if (viewMoreThaiSanButton) {
        viewMoreThaiSanButton.addEventListener('click', function () {
            const list = document.getElementById('periodicHealthList');
            let otherJourneys;
            try {
                otherJourneys = JSON.parse(list.getAttribute('data-other-journeys') || '[]');
                console.log('Parsed ThaiSan otherJourneys:', otherJourneys);
            } catch (e) {
                console.error('Error parsing ThaiSan otherJourneys:', e);
                return;
            }

            if (!Array.isArray(otherJourneys)) {
                console.error('ThaiSan otherJourneys is not an array:', otherJourneys);
                return;
            }

            otherJourneys.forEach(journey => {
                if (!journey || !journey.journeyId) {
                    console.warn('Invalid ThaiSan journey:', journey);
                    return;
                }
                const li = document.createElement('li');
                li.className = 'list-group-item py-3 journey-item';
                li.style.cursor = 'pointer';
                li.setAttribute('data-journey-id', journey.journeyId);
                li.setAttribute('data-treatment-id', journey.treatmentId);
                li.setAttribute('data-bs-toggle', 'modal');
                li.setAttribute('data-bs-target', '#periodicHealthDetailsModal');
                li.innerHTML = `
                    <strong>Hành trình <span style="color:#198754">${journey.journeyName}</span> của <span style="color:#d63384">${fullName}</span></strong>
                    <p class="mb-0">Mã hành trình: ${journey.journeyId}</p>
                    <p class="mb-0">Ngày bắt đầu: ${journey.startDate ? new Date(journey.startDate).toLocaleDateString('vi-VN') : 'Không xác định'}</p>
                    <p class="mb-0">Ngày dự sinh: ${journey.dueDate ? new Date(journey.dueDate).toLocaleDateString('vi-VN') : 'Không xác định'}</p>
                    <p class="mb-0">Ngày kết thúc: ${journey.endDate ? new Date(journey.endDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</p>
                    <p class="mb-0">Trạng thái: ${journey.status ? 'Đã hoàn thành' : 'Đang diễn ra'}</p>
                `;
                list.appendChild(li);
            });

            this.style.display = 'none'; // Ẩn nút
        });
    }

    // Xử lý nút "Xem thêm" cho Tâm lý
    const viewMoreTamLyButton = document.getElementById('viewMoreTamLy');
    if (viewMoreTamLyButton) {
        viewMoreTamLyButton.addEventListener('click', function () {
            const list = document.getElementById('psychologyDiaryList');
            let otherJourneys;
            try {
                otherJourneys = JSON.parse(list.getAttribute('data-other-journeys') || '[]');
                console.log('Parsed TamLy otherJourneys:', otherJourneys);
            } catch (e) {
                console.error('Error parsing TamLy otherJourneys:', e);
                return;
            }

            if (!Array.isArray(otherJourneys)) {
                console.error('TamLy otherJourneys is not an array:', otherJourneys);
                return;
            }

            otherJourneys.forEach(journey => {
                if (!journey || !journey.journeyId) {
                    console.warn('Invalid TamLy journey:', journey);
                    return;
                }
                const li = document.createElement('li');
                li.className = 'list-group-item py-3 journey-item';
                li.style.cursor = 'pointer';
                li.setAttribute('data-journey-id', journey.journeyId);
                li.setAttribute('data-treatment-id', journey.treatmentId);
                li.setAttribute('data-bs-toggle', 'modal');
                li.setAttribute('data-bs-target', '#psychologyDiaryDetailsModal');
                li.innerHTML = `
                    <strong>Hành trình <span style="color:#198754">${journey.journeyName}</span> của <span style="color:#d63384">${fullName}</span></strong>
                    <p class="mb-0">Mã hành trình: ${journey.journeyId}</p>
                    <p class="mb-0">Ngày bắt đầu: ${journey.startDate ? new Date(journey.startDate).toLocaleDateString('vi-VN') : 'Không xác định'}</p>
                    <p class="mb-0">Ngày kết thúc: ${journey.endDate ? new Date(journey.endDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</p>
                    <p class="mb-0">Trạng thái: ${journey.status ? 'Đã hoàn thành' : 'Đang diễn ra'}</p>
                `;
                list.appendChild(li);
            });

            this.style.display = 'none'; // Ẩn nút
        });
    }

    // Sử dụng event delegation để xử lý click vào journey-item
    document.getElementById('periodicHealthList').addEventListener('click', function (e) {
        const item = e.target.closest('.journey-item');
        if (item) {
            const journeyId = item.getAttribute('data-journey-id');
            const treatmentId = item.getAttribute('data-treatment-id');

            if (treatmentId === '2') {
                const detailsList = document.getElementById('periodicHealthDetailsList');
                detailsList.innerHTML = '<li class="list-group-item">Đang tải...</li>';

                // Gán journeyId vào nút trước khi mở modal
                const completeButton = document.getElementById('completePeriodicHealth');
                const addButton = document.getElementById('addPeriodicHealth');
                if (completeButton && addButton) {
                    completeButton.setAttribute('data-journey-id', journeyId);
                    addButton.setAttribute('data-journey-id', journeyId);
                    console.log('Assigned journeyId to buttons:', { journeyId });
                } else {
                    console.error('Button not found:', { completeButton, addButton });
                }

                fetch(`/PregnancyCare/GetPeriodicDetails?journeyId=${journeyId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
                    .then(response => response.json())
                    .then(data => {
                        detailsList.innerHTML = '';
                        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                            data.data.forEach(health => {
                                const li = document.createElement('li');
                                li.className = 'list-group-item py-3';
                                li.innerHTML = `
                                <strong>Theo dõi thai sản (ID: ${health.healthId})</strong>
                                <p class="mb-0">Tuần thai: ${health.weeksPregnant}</p>
                                <p class="mb-0">Huyết áp: ${health.bloodPressure}</p>
                                <p class="mb-0">Vòng bụng: ${health.waistCircumference} cm</p>
                                <p class="mb-0">Cân nặng: ${health.weight} kg</p>
                                <p class="mb-0">Tâm trạng: ${health.mood}</p>
                                <p class="mb-0">Giới tính bé: ${health.genderBaby === null ? 'Chưa xác định' : health.genderBaby ? 'Bé trai' : 'Bé gái'}</p>
                                <p class="mb-0">Ghi chú: ${health.notes || 'Không có'}</p>
                                <p class="mb-0">Ngày tạo: ${new Date(health.createdDate).toLocaleDateString('vi-VN')}</p>
                            `;
                                detailsList.appendChild(li);
                            });
                        } else {
                            detailsList.innerHTML = '<li class="list-group-item">Không có lịch sử theo dõi</li>';
                        }
                        document.getElementById('addPeriodicHealth').setAttribute('data-journey-id', journeyId);
                    })
                    .catch(error => {
                        console.error('Error fetching PeriodicHealths:', error);
                        detailsList.innerHTML = '<li class="list-group-item">Lỗi khi tải dữ liệu</li>';
                    });
            }
        }
    });

    document.getElementById('psychologyDiaryList').addEventListener('click', function (e) {
        const item = e.target.closest('.journey-item');
        if (item) {
            const journeyId = item.getAttribute('data-journey-id');
            const treatmentId = item.getAttribute('data-treatment-id');

            if (treatmentId === '1') {
                const detailsList = document.getElementById('psychologyDiaryDetailsList');
                detailsList.innerHTML = '<li class="list-group-item">Đang tải...</li>';

                // Gán journeyId vào nút trước khi mở modal
                const completeButton = document.getElementById('completePsychologyDiary');
                const addButton = document.getElementById('addPsychologyDiary');
                if (completeButton && addButton) {
                    completeButton.setAttribute('data-journey-id', journeyId);
                    addButton.setAttribute('data-journey-id', journeyId);
                    console.log('Assigned journeyId to buttons:', { journeyId });
                } else {
                    console.error('Button not found:', { completeButton, addButton });
                }

                fetch(`/PregnancyCare/GetPsychologyDiaryDetails?journeyId=${journeyId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
                    .then(response => response.json())
                    .then(data => {
                        detailsList.innerHTML = '';
                        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                            data.data.forEach(diary => {
                                const li = document.createElement('li');
                                li.className = 'list-group-item py-3';
                                li.innerHTML = `
                                <strong>Nhật ký tâm lý (ID: ${diary.diaryId})</strong>
                                <p class="mb-0">Tâm trạng: ${diary.mood}</p>
                                <p class="mb-0">Nội dung: ${diary.content || 'Không có'}</p>
                                <p class="mb-0">Ngày tạo: ${new Date(diary.createdDate).toLocaleDateString('vi-VN')}</p>
                            `;
                                detailsList.appendChild(li);
                            });
                        } else {
                            detailsList.innerHTML = '<li class="list-group-item">Không có lịch sử theo dõi</li>';
                        }
                        document.getElementById('addPsychologyDiary').setAttribute('data-journey-id', journeyId);
                    })
                    .catch(error => {
                        console.error('Error fetching PsychologyDiaries:', error);
                        detailsList.innerHTML = '<li class="list-group-item">Lỗi khi tải dữ liệu</li>';
                    });
            }
        }
    });

    // Xử lý nút "Thêm mới" trong modal chi tiết
    document.getElementById('addPeriodicHealth').addEventListener('click', function () {
        const journeyId = this.getAttribute('data-journey-id');
        document.getElementById('periodicJourneyId').value = journeyId;
    });

    document.getElementById('addPsychologyDiary').addEventListener('click', function () {
        const journeyId = this.getAttribute('data-journey-id');
        document.getElementById('diaryJourneyId').value = journeyId;
    });

    // Xử lý lưu thông tin thai kỳ
    document.getElementById('savePeriodicHealth').addEventListener('click', function () {
        const form = document.getElementById('periodicHealthForm');
        const formData = new FormData(form);

        fetch('/PregnancyCare/CreatePeriodic', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    bootstrap.Modal.getInstance(document.getElementById('periodicHealthModal')).hide();
                    showSuccessModal('Lưu thông tin thai kỳ thành công!');
                } else {
                    showErrorModal('Có lỗi xảy ra khi lưu thông tin.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showErrorModal('Có lỗi xảy ra khi lưu thông tin.');
            });
    });

    // Xử lý lưu nhật ký tâm lý
    document.getElementById('savePsychologyDiary').addEventListener('click', function () {
        const form = document.getElementById('psychologyDiaryForm');
        const formData = new FormData(form);

        fetch('/PregnancyCare/CreatePsychologyDiary', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    bootstrap.Modal.getInstance(document.getElementById('psychologyDiaryModal')).hide();
                    showSuccessModal('Lưu nhật ký tâm lý thành công!');
                } else {
                    showErrorModal('Có lỗi xảy ra khi lưu nhật ký.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showErrorModal('Có lỗi xảy ra khi lưu nhật ký.');
            });
    });

    // Xử lý nút "Hoàn thành" trong modal chi tiết
    document.getElementById('completePeriodicHealth').addEventListener('click', function () {
        const journeyId = this.getAttribute('data-journey-id');

        $.ajax({
            url: '/PregnancyCare/CompleteJourney',
            type: 'POST',
            data: { journeyId: journeyId },
            success: function (data) {
                if (data.success) {
                    bootstrap.Modal.getInstance(document.getElementById('periodicHealthDetailsModal')).hide();
                    window.location.reload();
                } else {
                    showErrorModal(data.message || 'Có lỗi xảy ra khi hoàn thành hành trình.');
                }
            },
            error: function (xhr, status, error) {
                console.error('Error completing PeriodicHealth journey:', error);
                showErrorModal('Có lỗi xảy ra khi hoàn thành hành trình: ' + error);
            }
        });
    });

    document.getElementById('completePsychologyDiary').addEventListener('click', function () {
        const journeyId = this.getAttribute('data-journey-id');

        $.ajax({
            url: '/PregnancyCare/CompleteJourney',
            type: 'POST',
            data: { journeyId: journeyId },
            success: function (data) {
                if (data.success) {
                    bootstrap.Modal.getInstance(document.getElementById('psychologyDiaryDetailsModal')).hide();
                    window.location.reload();
                } else {
                    showErrorModal(data.message || 'Có lỗi xảy ra khi hoàn thành hành trình.');
                }
            },
            error: function (xhr, status, error) {
                console.error('Error completing PeriodicHealth journey:', error);
                showErrorModal('Có lỗi xảy ra khi hoàn thành hành trình: ' + error);
            }
        });
    });
});

document.getElementById('saveNewPeriodicHealth').addEventListener('click', function () {
    const form = document.getElementById('addNewPeriodicHealthForm');
    const formData = new FormData(form);
    formData.append('treatmentId', 2);

    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }

    $.ajax({
        url: '/PregnancyCare/CreateNewJourneyWithData',
        type: 'POST',
        data: formData,
        processData: false,       // Bắt buộc khi dùng FormData
        contentType: false,       // Bắt buộc khi dùng FormData
        success: function (response) {
            showSuccessModal('Thêm hồ sơ thành công!');
            $('#addNewPeriodicHealth').modal('hide');
            form.reset();
        },
        error: function (xhr) {
            showErrorModal('Lỗi khi lưu hồ sơ: ' + xhr.responseText);
        }
    });
});


document.getElementById('saveNewPsychologyDiary').addEventListener('click', function () {
    const form = document.getElementById('addNewPsychologyDiaryForm');
    const formData = new FormData(form);
    formData.append('treatmentId', 1);

    $.ajax({
        url: '/PregnancyCare/CreateNewJourneyWithData',
        type: 'POST',
        data: formData,
        processData: false,       // Bắt buộc khi dùng FormData
        contentType: false,       // Bắt buộc khi dùng FormData
        success: function (response) {
            showSuccessModal('Thêm nhật ký thành công!');
            $('#addNewPsychologyDiary').modal('hide');
        },
        error: function (xhr) {
            showErrorModal('Lỗi khi lưu nhật ký: ' + xhr.responseText);
        }
    });
});