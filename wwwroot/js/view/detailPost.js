document.addEventListener('DOMContentLoaded', function () {
    let quill = null;
    let modalContentClickHandler = null;

    $('#postDetailModal').on('shown.bs.modal', function () {
        // Khởi tạo Quill
        const commentEditor = document.querySelector('#commentEditor');
        if (commentEditor) {
            try {
                // Xóa instance Quill cũ nếu có
                if (quill) {
                    quill = null;
                }
                // Khởi tạo Quill mới
                quill = new Quill('#commentEditor', {
                    theme: 'snow',
                    placeholder: 'Viết bình luận...',
                    modules: { toolbar: false }
                });
                // Xóa nội dung cũ khi mở modal
                quill.setText('');
                console.log('✅ Quill editor initialized for postDetailModal');
            } catch (error) {
                console.error('❌ Lỗi khi khởi tạo Quill:', error);
            }
        } else {
            console.warn('⚠ Không tìm thấy #commentEditor');
        }

        // Khởi tạo Emoji Picker
        initializeEmojiPicker();
    });

    $('#postDetailModal').on('hidden.bs.modal', function () {
        // Dọn dẹp bảng Emoji
        const emojiPicker = document.querySelector('#emojiPickerComment');
        if (emojiPicker) {
            emojiPicker.remove();
            console.log('✅ Removed emojiPickerComment');
        }
        // Xóa sự kiện click cũ trên modal-content
        const modalContent = document.querySelector('#postDetailModal .modal-content');
        if (modalContent && modalContentClickHandler) {
            modalContent.removeEventListener('click', modalContentClickHandler);
            modalContentClickHandler = null;
            console.log('✅ Removed modal-content click handler');
        }
    });

    function initializeEmojiPicker() {
        const emojiPickerBtn = document.querySelector('#emojiPickerCmtBtn');
        if (!emojiPickerBtn) {
            console.warn('⚠ Không tìm thấy #emojiPickerCmtBtn');
            return;
        }

        // Tạo hoặc tái tạo bảng Emoji
        let emojiPicker = document.querySelector('#emojiPickerComment');
        if (!emojiPicker) {
            emojiPicker = document.createElement('div');
            emojiPicker.id = 'emojiPickerComment';
            emojiPicker.className = 'emoji-picker';
            emojiPicker.style.display = 'none';
            emojiPicker.style.position = 'absolute';
            emojiPicker.style.zIndex = '1060';
            emojiPicker.style.backgroundColor = 'transparent';
            emojiPicker.style.boxShadow = 'none';
            emojiPicker.style.border = 'none';
            emojiPicker.style.padding = '8px';
            emojiPicker.style.width = '300px';
            emojiPicker.style.maxHeight = '330px';
            emojiPicker.style.overflowY = 'auto';
            document.querySelector('#postDetailModal .modal-content').appendChild(emojiPicker);

            try {
                const picker = new EmojiMart.Picker({
                    data: async () => {
                        try {
                            const response = await fetch('https://cdn.jsdelivr.net/npm/@emoji-mart/data@latest');
                            if (!response.ok) throw new Error(`Failed to fetch emoji data: ${response.status}`);
                            return await response.json();
                        } catch (error) {
                            console.error('❌ Lỗi khi tải dữ liệu emoji:', error);
                            return {};
                        }
                    },
                    onEmojiSelect: (emoji) => {
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
                                    quill.insertText(length - 1, emojiText); // Trừ 1 để không chèn sau ký tự newline mặc định
                                    quill.setSelection(length + emojiText.length - 1);
                                }
                                emojiPicker.style.display = 'none';
                                console.log('✅ Emoji inserted in postDetailModal:', emojiText);
                            }
                        } else {
                            console.warn('⚠ Quill không được khởi tạo');
                        }
                    },
                    perLine: 6,
                    previewPosition: 'none'
                });
                emojiPicker.appendChild(picker);
                console.log('✅ EmojiMart picker initialized for postDetailModal');
            } catch (error) {
                console.error('❌ Lỗi khi khởi tạo EmojiMart:', error);
                return;
            }
        }

        // Xóa sự kiện click cũ trên nút Emoji
        const newEmojiPickerBtn = emojiPickerBtn.cloneNode(true);
        emojiPickerBtn.parentNode.replaceChild(newEmojiPickerBtn, emojiPickerBtn);

        // Gắn sự kiện click mới
        newEmojiPickerBtn.addEventListener('click', (e) => {
            console.log('✅ Clicked emoji button in postDetailModal');
            e.preventDefault();
            e.stopImmediatePropagation();
            const rect = newEmojiPickerBtn.getBoundingClientRect();
            const modalRect = document.querySelector('#postDetailModal .modal-content').getBoundingClientRect();
            const pickerWidth = emojiPicker.offsetWidth || 300;
            const pickerHeight = emojiPicker.offsetHeight || 330;

            // Đặt bảng Emoji luôn bên phải nút
            let left = rect.right + 5 - modalRect.left; // Bên phải nút, cách 5px
            let top = rect.top - modalRect.top; // Thẳng hàng với đỉnh nút

            // Nếu vượt quá mép phải modal, điều chỉnh để không bị cắt
            if (left + pickerWidth > modalRect.right - modalRect.left) {
                left = (modalRect.right - modalRect.left) - pickerWidth - 5;
            }
            // Đảm bảo bảng Emoji nằm trong modal
            if (left < 0) {
                left = 5;
            }
            if (top + pickerHeight > modalRect.height) {
                top = modalRect.height - pickerHeight - 5;
            }
            if (top < 0) {
                top = 5;
            }

            emojiPicker.style.top = `${top}px`;
            emojiPicker.style.left = `${left}px`;
            emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
            console.log('✅ Emoji picker toggled in postDetailModal, display:', emojiPicker.style.display, 'top:', top, 'left:', left);
        });

        // Gắn sự kiện click để ẩn bảng Emoji
        const modalContent = document.querySelector('#postDetailModal .modal-content');
        modalContentClickHandler = (e) => {
            if (!emojiPicker.contains(e.target) && e.target !== newEmojiPickerBtn) {
                emojiPicker.style.display = 'none';
                console.log('✅ Emoji picker hidden in postDetailModal');
            }
        };
        modalContent.addEventListener('click', modalContentClickHandler);
    }

    // Thêm CSS để xử lý placeholder
    const style = document.createElement('style');
    style.textContent = `
        .ql-editor:empty::before {
            content: attr(data-placeholder);
            color: #6c757d;
            pointer-events: none;
        }
        .ql-editor:not(:empty)::before {
            display: none;
        }
    `;
    document.head.appendChild(style);

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

    // Biến quản lý phân trang
    let currentPage = 1;
    let isLoading = false;
    let hasMoreComments = true;
    let currentPostId = null;
    let currentPost = null;

    // Hàm lấy bình luận với phân trang
    function fetchComments(postId, page = 1, append = false) {
        if (isLoading || !hasMoreComments) {
            console.log('🚫 Không tải thêm: isLoading=', isLoading, 'hasMoreComments=', hasMoreComments);
            return;
        }

        isLoading = true;
        const loadingSpinner = document.getElementById('loadingSpinner');
        if (loadingSpinner) {
            loadingSpinner.style.display = 'block';
        } else {
            console.warn('⚠ Không tìm thấy #loadingSpinner');
        }

        $.ajax({
            url: `/Post/GetComments?postId=${postId}&page=${page}`,
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                const commentsList = document.getElementById('commentsList');
                if (!commentsList) {
                    console.error('❌ Không tìm thấy #commentsList');
                    isLoading = false;
                    if (loadingSpinner) loadingSpinner.style.display = 'none';
                    return;
                }

                // Chỉ xóa nội dung nếu không append
                if (!append) {
                    commentsList.innerHTML = '<div id="loadingSpinner" class="text-center" style="display: none;"><div class="spinner-border spinner-border-sm text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div></div><div id="sentinel" style="height: 20px;"></div>';
                }

                if (data.success && data.data && data.data.length > 0) {
                    data.data.forEach(comment => {
                        let commentHtml = `
                        <div class="d-flex align-items-start mb-2">
                            <img src="${comment.posterAvatar || '/images/default-avatar.jpg'}" alt="Avatar" class="rounded-circle me-2" style="width: 35px; height: 35px;">
                            <div class="flex-grow-1">
                                <p class="mb-0"><strong>${comment.fullName}</strong> ${comment.content}</p>
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
                        // Thêm bình luận trước sentinel
                        const sentinel = document.getElementById('sentinel');
                        if (sentinel) {
                            sentinel.insertAdjacentHTML('beforebegin', commentHtml);
                        } else {
                            commentsList.insertAdjacentHTML('beforeend', commentHtml);
                        }
                    });

                    // Cập nhật hasMore từ API response
                    hasMoreComments = data.hasMore !== undefined ? data.hasMore : false;

                    // Đảm bảo sentinel ở cuối danh sách
                    const sentinel = document.getElementById('sentinel');
                    if (sentinel) {
                        commentsList.appendChild(sentinel);
                    } else {
                        console.warn('⚠ Không tìm thấy #sentinel, tạo mới');
                        const newSentinel = document.createElement('div');
                        newSentinel.id = 'sentinel';
                        newSentinel.style.height = '20px';
                        commentsList.appendChild(newSentinel);
                    }
                } else {
                    hasMoreComments = false;
                    console.log('🚫 Không có thêm bình luận hoặc dữ liệu trống');
                }

                isLoading = false;
                if (loadingSpinner) loadingSpinner.style.display = 'none';
            },
            error: function (xhr, status, error) {
                console.error('❌ Lỗi khi lấy bình luận:', error, xhr.status, xhr.responseText);
                isLoading = false;
                if (loadingSpinner) loadingSpinner.style.display = 'none';
            }
        });
    }

    // Hàm khởi tạo để theo dõi cuộn và tải bình luận
    function initCommentsObserver(postId) {
        currentPostId = postId;
        currentPage = 1;
        hasMoreComments = true;

        const commentsList = document.getElementById('commentsList');
        if (!commentsList) {
            console.error('❌ Không tìm thấy #commentsList');
            return;
        }

        // Tải bình luận đầu tiên
        fetchComments(postId, 1, false);

        // Sử dụng sự kiện scroll để phát hiện cuộn đến cuối
        commentsList.addEventListener('scroll', () => {
            const scrollTop = commentsList.scrollTop;
            const scrollHeight = commentsList.scrollHeight;
            const clientHeight = commentsList.clientHeight;
            const distanceToBottom = scrollHeight - (scrollTop + clientHeight);

            if (distanceToBottom < 200 && !isLoading && hasMoreComments) {
                currentPage++;
                fetchComments(currentPostId, currentPage, true);
            }
        });
    }

    // Sửa hàm openPostModal để đợi modal hiển thị
    window.openPostModal = function (postData) {
        currentPost = postData;
        const modalElement = document.getElementById('postDetailModal');
        if (!modalElement) {
            console.error('❌ Không tìm thấy phần tử modal #postDetailModal');
            return;
        }

        try {
            const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement, {
                backdrop: true,
                keyboard: true
            });

            // Cập nhật nội dung modal
            document.getElementById('postAvatar').src = postData.avatar || '/images/default-avatar.jpg';
            document.getElementById('postAcademicTitle').textContent = postData.academicTitle || '';
            document.getElementById('postAcademicTitle').style.display = postData.academicTitle ? 'block' : 'none';
            document.getElementById('postPosterName').textContent = postData.posterName || 'Unknown';
            document.getElementById('postCreatedDate').textContent = postData.createdDate || '';
            const postTextContent = document.getElementById('postTextContent');
            if (postTextContent) {
                postTextContent.innerHTML = postData.content && typeof postData.content === 'string' ? postData.content : '';
            } else {
                console.warn('⚠ Không tìm thấy #postTextContent');
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

            // Đợi modal hiển thị hoàn toàn trước khi khởi tạo observer
            modalElement.addEventListener('shown.bs.modal', function handler() {
                console.log('✅ Modal đã hiển thị, khởi tạo scroll listener');
                initCommentsObserver(postData.postId);
                modalElement.removeEventListener('shown.bs.modal', handler);
            }, { once: true });

            modal.show();
        } catch (error) {
            console.error('❌ Lỗi khi khởi tạo modal:', error);
        }
    };

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