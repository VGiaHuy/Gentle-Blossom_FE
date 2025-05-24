document.addEventListener('DOMContentLoaded', function () {
    console.log('detailPost.js loaded'); // Debug: Xác nhận script tải

    // Khởi tạo Quill editor
    let quill = new Quill('#commentEditor', {
        theme: 'snow',
        modules: {
            toolbar: [['emoji'], ['image']],
            'emoji-toolbar': true,
            'emoji-textarea': false,
            'emoji-shortname': true
        },
        placeholder: 'Viết bình luận...'
    });

    // Khởi tạo emoji-mart picker
    const pickerOptions = {
        onEmojiSelect: (emoji) => {
            const range = quill.getSelection();
            if (range) {
                quill.insertText(range.index, emoji.native);
            }
        }
    };
    const picker = new EmojiMart.Picker(pickerOptions);
    const emojiButton = document.querySelector('.ql-emoji');
    if (emojiButton) {
        emojiButton.appendChild(picker);
    } else {
        console.warn('Không tìm thấy nút emoji trong toolbar');
    }

    // Giới hạn chỉ một ảnh
    let commentImage = null;
    const commentImageInput = document.getElementById('commentImage');
    if (commentImageInput) {
        commentImageInput.addEventListener('change', function (e) {
            if (e.target.files.length > 0) {
                commentImage = e.target.files[0];
                const reader = new FileReader();
                reader.onload = function (event) {
                    const range = quill.getSelection();
                    if (range) {
                        quill.insertEmbed(range.index, 'image', event.target.result);
                    }
                };
                reader.readAsDataURL(commentImage);
            }
        });
    }

    // Lưu dữ liệu bài viết hiện tại
    let currentPost = null;

    // Mở modal và điền dữ liệu
    function openPostModal(postData) {
        console.log('openPostModal called with postData:', postData);

        currentPost = postData;
        const modalElement = document.getElementById('postDetailModal');
        if (!modalElement) {
            console.error('Không tìm thấy phần tử modal #postDetailModal');
            return;
        }

        try {
            const modal = new bootstrap.Modal(modalElement, {
                backdrop: true,
                keyboard: true
            });

            document.getElementById('postAvatar').src = postData.avatar || '/images/default-avatar.jpg';
            document.getElementById('postAcademicTitle').textContent = postData.academicTitle || '';
            document.getElementById('postAcademicTitle').style.display = postData.academicTitle ? 'block' : 'none';
            document.getElementById('postPosterName').textContent = postData.posterName || 'Unknown';
            document.getElementById('postCreatedDate').textContent = postData.createdDate || '';
            document.getElementById('postTextContent').innerHTML = postData.content || '';
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
            updateLikeButton(postData.postId);
            modal.show();
        } catch (error) {
            console.error('Lỗi khi khởi tạo modal:', error);
        }
    }

    // Lấy bình luận qua AJAX
    function fetchComments(postId) {
        $.ajax({
            url: `/Post/GetComments?postId=${postId}`,
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                const commentsList = document.getElementById('commentsList');
                commentsList.innerHTML = '';
                data.forEach(comment => {
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

    // Gửi bình luận
    document.getElementById('submitComment')?.addEventListener('click', function () {
        const content = quill.root.innerHTML;
        if (content.trim() === '<p><br></p>' && !commentImage) return;

        const formData = new FormData();
        formData.append('postId', currentPost.postId);
        formData.append('commentContent', content);
        if (commentImage) {
            formData.append('commentImage', commentImage);
        }

        $.ajax({
            url: '/Post/AddComment',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (data) {
                if (data.success) {
                    quill.setContents([]);
                    document.getElementById('commentImage').value = '';
                    commentImage = null;
                    fetchComments(currentPost.postId);
                    updateCommentCount(currentPost.postId, 1);
                }
            },
            error: function (xhr, status, error) {
                console.error('Lỗi khi gửi bình luận:', error);
            }
        });
    });

    // Chuyển đổi trạng thái thích
    window.toggleLike = function (button, type, id) {
        const isLiked = button.getAttribute('data-liked') === 'true';
        $.ajax({
            url: '/Post/ToggleLike',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ postId: id }),
            success: function (data) {
                if (data.success) {
                    const countElement = document.getElementById(`postLikeCount`);
                    let count = parseInt(countElement.textContent.match(/\d+/)[0]);
                    count = isLiked ? count - 1 : count + 1;
                    countElement.textContent = `${count} lượt thích`;
                    button.setAttribute('data-liked', (!isLiked).toString());
                    button.querySelector('i').className = isLiked ? 'bi bi-heart me-1' : 'bi bi-heart-fill me-1';
                    if (type === 'post') {
                        currentPost.numberOfLike = count;
                        updateLikeButton(id);
                    }
                }
            },
            error: function (xhr, status, error) {
                console.error('Lỗi khi thích:', error);
            }
        });
    };

    // Cập nhật trạng thái nút thích
    function updateLikeButton(postId) {
        const button = document.getElementById('likeButton');
        $.ajax({
            url: `/Post/IsLiked?postId=${postId}`,
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                button.setAttribute('data-liked', data.isLiked);
                button.setAttribute('data-post-id', postId);
                button.querySelector('i').className = data.isLiked ? 'bi bi-heart-fill me-1' : 'bi bi-heart me-1';
            },
            error: function (xhr, status, error) {
                console.error('Lỗi khi kiểm tra trạng thái thích:', error);
            }
        });
    }

    // Chia sẻ bài viết
    window.sharePost = function () {
        $.ajax({
            url: '/Post/Share',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ postId: currentPost.postId }),
            success: function (data) {
                if (data.success) {
                    const shareCount = document.getElementById('postShareCount');
                    let count = parseInt(shareCount.textContent.match(/\d+/)[0]);
                    shareCount.textContent = `${count + 1} lượt chia sẻ`;
                    currentPost.numberOfShare = count + 1;
                    alert('Bài viết đã được chia sẻ!');
                }
            },
            error: function (xhr, status, error) {
                console.error('Lỗi khi chia sẻ:', error);
            }
        });
    };

    // Lưu vào yêu thích
    window.bookmarkPost = function () {
        $.ajax({
            url: '/Post/Bookmark',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ postId: currentPost.postId }),
            success: function (data) {
                if (data.success) {
                    alert('Bài viết đã được lưu vào yêu thích!');
                }
            },
            error: function (xhr, status, error) {
                console.error('Lỗi khi lưu yêu thích:', error);
            }
        });
    };

    // Lưu bài viết
    window.savePost = function () {
        $.ajax({
            url: '/Post/Save',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ postId: currentPost.postId }),
            success: function (data) {
                if (data.success) {
                    alert('Bài viết đã được lưu!');
                }
            },
            error: function (xhr, status, error) {
                console.error('Lỗi khi lưu bài viết:', error);
            }
        });
    };

    // Tắt thông báo
    window.muteNotifications = function () {
        $.ajax({
            url: '/Post/MuteNotifications',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ postId: currentPost.postId }),
            success: function (data) {
                if (data.success) {
                    alert('Đã tắt thông báo cho bài viết này!');
                }
            },
            error: function (xhr, status, error) {
                console.error('Lỗi khi tắt thông báo:', error);
            }
        });
    };

    // Báo cáo bài viết
    window.reportPost = function () {
        $.ajax({
            url: '/Post/Report',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ postId: currentPost.postId }),
            success: function (data) {
                if (data.success) {
                    alert('Bài viết đã được báo cáo!');
                }
            },
            error: function (xhr, status, error) {
                console.error('Lỗi khi báo cáo:', error);
            }
        });
    };

    // Tập trung vào ô nhập bình luận
    window.focusCommentInput = function () {
        quill.focus();
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

    // Gắn sự kiện click cho nút bình luận
    document.addEventListener('click', function (event) {
        const button = event.target.closest('button.comment-button');
        if (!button) {
            console.log('No comment-button found for click');
            return;
        }

        console.log('Comment button clicked:', button);
        event.preventDefault();

        const postId = button.getAttribute('data-post-id');
        const postElement = button.closest('.mb-4.border');
        if (!postElement) {
            console.error('Không tìm thấy phần tử bài viết');
            return;
        }

        // Kiểm tra tất cả thẻ <p> trong bài viết
        const contentElements = postElement.querySelectorAll('p');
        contentElements.forEach((el, index) => {
        });

        // Lấy thẻ <p> thứ ba (chứa nội dung thực tế)
        const contentElement = contentElements[2]; // Chọn thẻ chứa nội dung
        let content = contentElement?.innerHTML || '';

        // Kiểm tra nếu content rỗng, thử các thẻ <p> khác
        if (!content && contentElements.length > 0) {
            for (let i = 0; i < contentElements.length; i++) {
                if (contentElements[i].innerHTML.trim() && !contentElements[i].classList.contains('mb-0')) {
                    content = contentElements[i].innerHTML;
                    break;
                }
            }
        }

        const postData = {
            postId: postId,
            avatar: postElement.querySelector('img.rounded-circle')?.src || '/images/default-avatar.jpg',
            academicTitle: postElement.querySelector('.accademictitle')?.textContent || '',
            posterName: postElement.querySelector('.text-primary.fw-bold')?.textContent || 'Unknown',
            createdDate: postElement.querySelector('.text-muted.mb-0.small')?.textContent || '',
            content: content,
            mediaList: Array.from(postElement.querySelectorAll('.media-gallery .col-6')).map(div => {
                const img = div.querySelector('img');
                const iframe = div.querySelector('iframe');
                let mediaUrl = '';
                if (img) {
                    // Lấy URL gốc bằng cách xóa phần proxy và giải mã
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

        console.log('Calling openPostModal with postData:', postData);
        openPostModal(postData);
    });
});