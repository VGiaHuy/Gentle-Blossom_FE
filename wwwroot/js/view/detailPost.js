document.addEventListener('DOMContentLoaded', function () {
    // Khởi tạo Quill Editor
    let quill = null;
    const commentEditor = document.querySelector('#commentEditor');
    if (commentEditor) {
        try {
            quill = new Quill('#commentEditor', {
                theme: 'snow',
                placeholder: 'Viết bình luận...',
                modules: {
                    toolbar: false
                }
            });
            console.log('✅ Quill editor initialized');
        } catch (error) {
            console.error('❌ Lỗi khi khởi tạo Quill:', error);
        }
    } else {
        console.warn('⚠ Không tìm thấy #commentEditor');
    }

    // Tích hợp EmojiMart
    if (!document.querySelector('#emojiPicker')) {
        const emojiPickerBtn = document.querySelector('#emojiPickerCmtBtn');
        const emojiPicker = document.createElement('div');
        emojiPicker.id = 'emojiPicker';
        emojiPicker.className = 'emoji-picker';
        emojiPicker.style.display = 'none';
        emojiPicker.style.position = 'absolute';
        emojiPicker.style.zIndex = '5000';
        emojiPicker.style.backgroundColor = '#fff';
        emojiPicker.style.border = '1px solid #0dcaf0';
        emojiPicker.style.borderRadius = '8px';
        emojiPicker.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
        emojiPicker.style.padding = '8px';
        emojiPicker.style.width = '300px';
        emojiPicker.style.maxHeight = '330px';
        document.body.appendChild(emojiPicker);

        try {
            const picker = new EmojiMart.Picker({
                data: async () => {
                    try {
                        const response = await fetch('https://cdn.jsdelivr.net/npm/@emoji-mart/data@latest');
                        if (!response.ok) throw new Error(`Failed to fetch emoji data: ${response.status}`);
                        const data = await response.json();
                        console.log('✅ Emoji data loaded successfully');
                        if (!data || typeof data !== 'object') throw new Error('Invalid emoji data');
                        return data;
                    } catch (error) {
                        console.error('❌ Lỗi khi tải dữ liệu emoji:', error);
                        return {};
                    }
                },
                onEmojiSelect: (emoji) => {
                    console.log('✅ Emoji selected:', emoji);
                    if (quill) {
                        quill.focus();
                        const emojiText = emoji?.native || '';
                        if (emojiText) {
                            const range = quill.getSelection(true);
                            if (range) {
                                quill.insertText(range.index, emojiText);
                                quill.setSelection(range.index + emojiText.length);
                            } else {
                                const length = quill.getLength();
                                quill.insertText(length, emojiText);
                                quill.setSelection(length + emojiText.length);
                            }
                            console.log('✅ Emoji inserted:', emojiText);
                            emojiPicker.style.display = 'none';
                        } else {
                            console.warn('⚠ Emoji native không hợp lệ:', emoji);
                        }
                    } else {
                        console.warn('⚠ Quill không được khởi tạo');
                    }
                },
                perLine: 6,
                previewPosition: 'none'
            });
            emojiPicker.appendChild(picker);
            console.log('✅ EmojiMart picker initialized');

            if (emojiPickerBtn) {
                emojiPickerBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopImmediatePropagation(); // Ngăn sự kiện lan truyền

                    const rect = emojiPickerBtn.getBoundingClientRect();
                    const pickerHeight = emojiPicker.offsetHeight || 330;
                    const pickerWidth = emojiPicker.offsetWidth || 300;
                    const windowWidth = window.innerWidth;
                    const windowHeight = window.innerHeight;

                    let top = rect.bottom + window.scrollY;
                    let left = rect.left + window.scrollX;

                    if (top + pickerHeight > windowHeight + window.scrollY) {
                        top = rect.top - pickerHeight + window.scrollY;
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
                    console.log('✅ Emoji picker toggled, display:', emojiPicker.style.display);
                });

                document.addEventListener('click', (e) => {
                    if (!emojiPicker.contains(e.target) && e.target !== emojiPickerBtn) {
                        emojiPicker.style.display = 'none';
                        console.log('✅ Emoji picker hidden');
                    }
                });
            } else {
                console.warn('⚠ Không tìm thấy #emojiPickerBtn');
            }
        } catch (error) {
            console.error('❌ Lỗi khi khởi tạo EmojiMart:', error);
        }
    }

    // Xử lý ảnh bình luận
    let commentImage = null;
    const commentImageInput = document.getElementById('commentImage');
    const commentImagePreview = document.getElementById('commentImagePreview');
    if (commentImageInput && commentImagePreview) {
        commentImageInput.addEventListener('change', function () {
            commentImagePreview.innerHTML = '';
            const file = this.files[0];
            if (file) {
                const fileType = file.type.split('/')[0];
                if (fileType !== 'image') {
                    console.warn('Chỉ hỗ trợ ảnh cho bình luận');
                    this.value = '';
                    return;
                }
                commentImage = file;
                const url = URL.createObjectURL(file);
                const col = document.createElement('div');
                col.className = 'col-4 position-relative';
                const img = document.createElement('img');
                img.src = url;
                img.className = 'img-fluid rounded-3';
                img.style.maxHeight = '100px';
                col.appendChild(img);
                const removeBtn = document.createElement('button');
                removeBtn.className = 'btn btn-danger btn-sm rounded-circle position-absolute top-0 end-0';
                removeBtn.innerHTML = '<i class="bi bi-x"></i>';
                removeBtn.onclick = () => {
                    col.remove();
                    commentImage = null;
                    commentImageInput.value = '';
                };
                col.appendChild(removeBtn);
                commentImagePreview.appendChild(col);
            }
        });
    } else {
        console.warn('Không tìm thấy #commentImage hoặc #commentImagePreview.');
    }

    // Gửi bình luận
    document.getElementById('submitComment')?.addEventListener('click', function () {
        if (!quill) {
            console.error('Quill editor không được khởi tạo, không thể gửi bình luận');
            return;
        }
        const content = quill.root.innerHTML;
        if (content.trim() === '<p><br></p>' && !commentImage) {
            console.warn('Nội dung bình luận trống và không có ảnh.');
            return;
        }

        // Thu thập dữ liệu từ form
        const formData = new FormData();
        const posterId = document.getElementById('userCmtId').value;

        formData.append('PostId', currentPost?.postId || 0); // ID bài viết
        formData.append('PosterId', posterId || ''); // ID người đăng (giả sử bạn có `currentUser`)
        formData.append('ParentCommentId', null); // ID bình luận cha (nếu là trả lời)
        formData.append('Content', content); // Nội dung bình luận
        if (commentImage) {
            // Kiểm tra định dạng file (hình ảnh hoặc video)
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
            if (!allowedTypes.includes(commentImage.type)) {
                showErrorModal('Chỉ chấp nhận hình ảnh hoặc video!', 3000);
                return;
            }
            formData.append('MediaFile', commentImage); // Chỉ gửi một file
        }
        formData.append('CommentDate', new Date().toISOString().split('T')[0]); // Ngày bình luận

        // Gửi dữ liệu qua AJAX
        $.ajax({
            url: '/Post/CreateComment',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (data) {
                if (data.success) {
                    quill.setContents([]);
                    document.getElementById('commentImage').value = '';
                    commentImage = null;
                    if (commentImagePreview) {
                        commentImagePreview.innerHTML = '';
                    }
                    fetchComments(currentPost?.postId);
                    updateCommentCount(currentPost?.postId, 1);
                    showSuccessModal(data.message, 3000);
                } else {
                    showErrorModal(data.message, 3000);
                }
            },
            error: function (xhr, status, error) {
                console.error('Lỗi khi gửi bình luận:', error);
                showErrorModal('Lỗi khi gửi bình luận', 3000);
            }
        });
    });

    let currentPost = null;

    // Định nghĩa window.openPostModal
    window.openPostModal = function (postData) {
        currentPost = postData;
        const modalElement = document.getElementById('postDetailModal');
        if (!modalElement) {
            console.error('Không tìm thấy phần tử modal #postDetailModal');
            return;
        }

        try {
            const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement, {
                backdrop: true,
                keyboard: true
            });

            document.getElementById('postAvatar').src = postData.avatar || '/images/default-avatar.jpg';
            document.getElementById('postAcademicTitle').textContent = postData.academicTitle || '';
            document.getElementById('postAcademicTitle').style.display = postData.academicTitle ? 'block' : 'none';
            document.getElementById('postPosterName').textContent = postData.posterName || 'Unknown';
            document.getElementById('postCreatedDate').textContent = postData.createdDate || '';
            // Kiểm tra và render nội dung HTML
            const postTextContent = document.getElementById('postTextContent');
            if (postTextContent) {
                postTextContent.innerHTML = postData.content && typeof postData.content === 'string' ? postData.content : '';
            } else {
                console.warn('Không tìm thấy #postTextContent');
            }
            document.getElementById('postLikeCount').textContent = `${postData.numberOfLike || 0} lượt thích`;
            document.getElementById('postCommentCount').textContent = `${postData.numberOfComment || 0} bình luận`;
            document.getElementById('postShareCount').textContent = `${postData.numberOfShare || 0} lượt chia sẻ`;

            const mediaGallery = document.getElementById('postMediaGallery');
            mediaGallery.innerHTML = '';
            if (postData.mediaList && postData.mediaList.length > 0) {
                postData.mediaList.forEach(media => {
                    const div = document.createElement('div');
                    div.className = 'col-6 col-md-4';
                    if (media.mediaType.toLowerCase() === 'image' && isValidUrl(media.mediaUrl)) {
                        div.innerHTML = `
                        <img src="/Post/ProxyImage?url=${encodeURIComponent(media.mediaUrl)}"
                             alt="${media.fileName || ''}"
                             class="img-fluid rounded"
                             style="max-height: 200px; object-fit: cover;"
                             loading="lazy"
                             onerror="this.onerror=null; this.src='/images/fallback-image.jpg';" />
                    `;
                    } else if (media.mediaType.toLowerCase() === 'video') {
                        div.innerHTML = `
                        <iframe src="https://drive.google.com/file/d/${extractFileId(media.mediaUrl)}/preview?t=${Date.now()}"
                                class="img-fluid rounded"
                                style="max-height: 200px; width: 100%; border: 1px solid #dee2e6;"
                                allowfullscreen>
                        </iframe>
                    `;
                    }
                    mediaGallery.appendChild(div);
                });
            }

            fetchComments(postData.postId);
            modal.show();
        } catch (error) {
            console.error('Lỗi khi khởi tạo modal:', error);
        }
    };

    // Lấy bình luận qua AJAX
    function fetchComments(postId) {
        $.ajax({
            url: `/Post/GetComments?postId=${postId}`,
            type: 'GET',
            dataType: 'json',
            data: postId,
            success: function (data) {
                console.log(data)
                const commentsList = document.getElementById('commentsList');
                commentsList.innerHTML = '';
                data.data.forEach(comment => {
                    let commentHtml = `
                        <div class="d-flex align-items-start mb-2">
                            <img src="${comment.userAvatar || '/images/default-avatar.jpg'}" alt="Avatar" class="rounded-circle me-2" style="width: 35px; height: 35px;">
                            <div class="flex-grow-1">
                                <p class="mb-0"><strong>${comment.fullName}:</strong> ${comment.content}</p>
                    `;
                    if (comment.mediaUrl && comment.mediaType.toLowerCase() === 'image') {
                        commentHtml += `
                            <div class="mt-2">
                                <img src="/Post/ProxyImage?url=${encodeURIComponent(comment.mediaUrl)}"
                                     alt="${comment.fileName || ''}"
                                     class="img-fluid rounded"
                                     style="max-height: 100px; object-fit: cover;"
                                     loading="lazy"
                                     onerror="this.onerror=null; this.src='/images/fallback-image.jpg';" />
                            </div>
                        `;
                    }
                    commentHtml += `
                                <small class="text-muted">${comment.commentDate}</small>
                                <div class="d-flex gap-2 mt-1">
                                    <button class="btn btn-link p-0 text-muted small" style="text-decoration: none;">
                                        <i class="bi bi-reply me-1"></i>Trả lời
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    commentsList.insertAdjacentHTML('beforeend', commentHtml);
                });
            },
            error: function (xhr, status, error) {
                console.error('Lỗi khi lấy bình luận:', error);
            }
        });
    }

    // Tập trung vào ô nhập bình luận
    window.focusCommentInput = function () {
        if (quill) {
            quill.focus();
        }
    };

    // Hàm tiện ích
    function isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    function extractFileId(url) {
        const match = url.match(/\/d\/(.+?)\//);
        return match ? match[1] : '';
    }

    function updateCommentCount(postId, delta) {
        const commentCount = document.getElementById('postCommentCount');
        let count = parseInt(commentCount.textContent.match(/\d+/)[0]);
        count += delta;
        commentCount.textContent = `${count} bình luận`;
        currentPost.numberOfComment = count;
    }
});