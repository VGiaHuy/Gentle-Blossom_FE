document.addEventListener('DOMContentLoaded', function () {
    // Khởi tạo Quill editor
    var quill = new Quill('#editor', {
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

    // Tích hợp Emoji Mart
    const emojiPickerBtn = document.getElementById('emojiPickerBtn');
    const emojiPicker = document.createElement('div');
    emojiPicker.id = 'emojiPicker';
    emojiPicker.style.display = 'none';
    emojiPicker.style.position = 'absolute';
    emojiPicker.style.zIndex = '1060';
    emojiPicker.style.backgroundColor = '#fff';
    emojiPicker.style.border = '1px solid #0dcaf0';
    emojiPicker.style.borderRadius = '8px';
    emojiPicker.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    document.body.appendChild(emojiPicker);

    // Khởi tạo Emoji Mart
    const picker = new EmojiMart.Picker({
        data: async () => {
            const response = await fetch('https://cdn.jsdelivr.net/npm/@emoji-mart/data@latest');
            return response.json();
        },
        onEmojiSelect: (emoji) => {
            const range = quill.getSelection(true);
            quill.insertText(range.index, emoji.native);
            emojiPicker.style.display = 'none';
        },
        perLine: 6
    });
    emojiPicker.appendChild(picker);

    // Xử lý sự kiện click nút Emoji
    emojiPickerBtn.addEventListener('click', (e) => {
        const rect = emojiPickerBtn.getBoundingClientRect();
        const pickerHeight = emojiPicker.offsetHeight || 330;
        const pickerWidth = emojiPicker.offsetWidth || 400;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Tính vị trí top (phía trên nút)
        let top = rect.top - pickerHeight + window.scrollY;
        // Tính vị trí left
        let left = rect.left + window.scrollX;
        // Đảm bảo không tràn ra ngoài màn hình
        if (top < 0) {
            top = rect.bottom + window.scrollY; // Hiển thị phía dưới nếu tràn lên trên
        }
        if (left + pickerWidth > windowWidth) {
            left = windowWidth - pickerWidth - 10; // Đẩy sang trái nếu tràn phải
        }
        if (left < 0) {
            left = 10; // Đảm bảo không tràn trái
        }

        emojiPicker.style.top = `${top}px`;
        emojiPicker.style.left = `${left}px`;
        emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
    });

    // Đóng emoji picker khi click ra ngoài
    document.addEventListener('click', (e) => {
        if (!emojiPicker.contains(e.target) && e.target !== emojiPickerBtn) {
            emojiPicker.style.display = 'none';
        }
    });

    // Xử lý xem trước media
    const mediaInput = document.getElementById('mediaFiles');
    const mediaPreview = document.getElementById('mediaPreview');

    mediaInput.addEventListener('change', function () {
        mediaPreview.innerHTML = ''; // Xóa preview cũ
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

        const formData = new FormData(this);
        formData.set('Content', quill.root.innerHTML); // Lấy nội dung từ Quill

        fetch('/Post/Create', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Hiển thị thông báo thành công
                    document.getElementById('successMessage').textContent = 'Bài viết đã được đăng thành công!';
                    document.getElementById('successModal').classList.remove('d-none');
                    setTimeout(() => document.getElementById('successModal').classList.add('d-none'), 3000);

                    // Đóng modal và làm mới trang
                    bootstrap.Modal.getInstance(document.getElementById('createPostModal')).hide();
                    location.reload(); // Có thể thay bằng AJAX để thêm bài viết động
                } else {
                    // Hiển thị thông báo lỗi
                    document.getElementById('errorMessage').textContent = data.message || 'Đã có lỗi xảy ra khi đăng bài!';
                    document.getElementById('errorModal').classList.remove('d-none');
                    setTimeout(() => document.getElementById('errorModal').classList.add('d-none'), 3000);
                }
            })
            .catch(error => {
                // Hiển thị thông báo lỗi
                document.getElementById('errorMessage').textContent = 'Lỗi kết nối, vui lòng thử lại!';
                document.getElementById('errorModal').classList.remove('d-none');
                setTimeout(() => document.getElementById('errorModal').classList.add('d-none'), 3000);
            });
    });
});