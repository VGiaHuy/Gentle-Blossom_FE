var initCreatePostModal = function () {
    if (document.getElementById('editor') == null) return;

    // Dọn dẹp trước khi khởi tạo lại
    cleanupCreatePostModal();

    // Khởi tạo Quill
    if (!window.quill) {
        window.quill = new Quill('#editor', {
            theme: 'snow',
            placeholder: 'Bạn đang nghĩ gì?',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ]
            }
        });
    }

    // Tích hợp Emoji Mart
    if (!document.getElementById('emojiPicker')) {
        const emojiPickerBtn = document.getElementById('emojiPickerBtn');
        const emojiPicker = document.createElement('div');
        emojiPicker.id = 'emojiPicker';
        emojiPicker.classList.add('emoji-picker');

        emojiPicker.style.display = 'none';
        emojiPicker.style.position = 'absolute';
        emojiPicker.style.zIndex = '1060';
        emojiPicker.style.backgroundColor = '#fff';
        emojiPicker.style.border = '1px solid #0dcaf0';
        emojiPicker.style.borderRadius = '8px';
        emojiPicker.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
        document.body.appendChild(emojiPicker);

        const picker = new EmojiMart.Picker({
            data: async () => {
                const response = await fetch('https://cdn.jsdelivr.net/npm/@emoji-mart/data@latest');
                return response.json();
            },
            onEmojiSelect: (emoji) => {
                const range = window.quill.getSelection(true);
                window.quill.insertText(range.index, emoji.native);
                emojiPicker.style.display = 'none';
            },
            perLine: 6
        });
        emojiPicker.appendChild(picker);

        emojiPickerBtn.addEventListener('click', (e) => {
            const rect = emojiPickerBtn.getBoundingClientRect();
            const pickerHeight = emojiPicker.offsetHeight || 330;
            const pickerWidth = emojiPicker.offsetWidth || 400;
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

            emojiPicker.style.top = `${top}px`;
            emojiPicker.style.left = `${left}px`;
            emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
        });

        document.addEventListener('click', (e) => {
            if (!emojiPicker.contains(e.target) && e.target !== emojiPickerBtn) {
                emojiPicker.style.display = 'none';
            }
        });
    }

    // Xử lý xem trước media
    const mediaInput = document.getElementById('mediaFiles');
    const mediaPreview = document.getElementById('mediaPreview');

    mediaInput.addEventListener('change', function () {
        mediaPreview.innerHTML = '';
        const files = this.files;

        for (let file of files) {
            const fileType = file.type.split('/')[0];
            const url = URL.createObjectURL(file);
            const col = document.createElement('div');
            col.className = 'col-4 position-relative';

            if (fileType === 'image') {
                const img = document.createElement('img');
                img.src = url;
                img.className = 'img-fluid rounded-3';
                img.style.maxHeight = '120px';
                col.appendChild(img);
            } else if (fileType === 'video') {
                const video = document.createElement('video');
                video.src = url;
                video.controls = true;
                video.className = 'img-fluid rounded-3';
                video.style.maxHeight = '120px';
                col.appendChild(video);
            }

            // Nút xóa media
            const removeBtn = document.createElement('button');
            removeBtn.className = 'btn btn-danger btn-sm rounded-circle position-absolute top-0 end-0';
            removeBtn.innerHTML = '<i class="bi bi-x"></i>';
            removeBtn.onclick = () => col.remove();
            col.appendChild(removeBtn);

            mediaPreview.appendChild(col);
        }
    });

    // Xử lý submit form
    document.getElementById('postForm').addEventListener('submit', function (e) {
        e.preventDefault();

        // Lấy nội dung từ Quill editor
        const contentHTML = quill.root.innerHTML.trim();

        // Kiểm tra nếu nội dung rỗng hoặc chỉ là thẻ <p><br></p> (quill mặc định khi rỗng)
        if (contentHTML === '' || contentHTML === '<p><br></p>') {
            showErrorModal('Vui lòng điền nội dung bài viết!', 3000);
            return;
        }

        const formData = new FormData(this);
        const createPostModal = document.getElementById('createPostModal');
        const loadingSpinner = document.getElementById('loadingSpinner');
        formData.set('Content', quill.root.innerHTML);

        // Lưu trữ nút gửi và nội dung ban đầu
        const submitButton = this.querySelector('button[type="submit"]');
        const originalButtonContent = submitButton.innerHTML;

        // Thay đổi nút thành trạng thái loading
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="bi bi-arrow-repeat spin me-2"></i>Đang đăng...';

        fetch('/Post/CreatePost', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showSuccessModal(data.message, 3000);
                    setTimeout(function () {
                        window.location.reload();
                    }, 2000);
                } else {
                    showErrorModal(data.message, 3000);
                }

                // Đóng modal với hiệu ứng
                if (createPostModal && bootstrap?.Modal) {
                    const modalInstance = bootstrap.Modal.getInstance(createPostModal);
                    if (modalInstance) {
                        createPostModal.classList.add('hide');
                        setTimeout(() => {
                            modalInstance.hide();
                            createPostModal.classList.remove('hide');
                        }, 300);
                    }
                }
            })
            .catch(error => {
                showErrorModal('Lỗi kết nối, vui lòng thử lại!', 3000);
            })
            .finally(() => {
                // Khôi phục nút về trạng thái ban đầu
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonContent;
            });
    });
};

var cleanupCreatePostModal = function () {
    // Xóa emojiPicker nếu tồn tại
    const emojiPicker = document.getElementById('emojiPicker');
    if (emojiPicker) {
        emojiPicker.remove(); // Loại bỏ emojiPicker khỏi DOM
    }

    // Xóa sự kiện click của emojiPickerBtn
    const emojiPickerBtn = document.getElementById('emojiPickerBtn');
    if (emojiPickerBtn) {
        emojiPickerBtn.replaceWith(emojiPickerBtn.cloneNode(true)); // Tạo lại nút để xóa sự kiện cũ
    }

    // Xóa Quill instance nếu cần
    if (window.quill) {
        window.quill = null; // Đặt lại Quill để tránh xung đột
    }
};

// Khi load lần đầu vẫn cần init
document.addEventListener('DOMContentLoaded', function () {
    initCreatePostModal();
});