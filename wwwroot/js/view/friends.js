const SpecializationExpert = {
    Obstetrics: "Sản khoa",
    Psychology: "Tâm lý học"
};

document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch("/Friends/GetAllExperts");
    const json = await response.json();
    if (!json.success) {
        showErrorModal("Không thể tải danh sách chuyên gia: " + json.message);
        return;
    }

    const experts = json.data;

    const obContainer = document.getElementById("obExpertList");
    const psyContainer = document.getElementById("psyExpertList");

    experts.forEach(expert => {
        const card = createExpertCard(expert);
        if (expert.specialization === SpecializationExpert.Obstetrics) {
            obContainer.appendChild(card);
        } else if (expert.specialization === SpecializationExpert.Psychology) {
            psyContainer.appendChild(card);
        }
    });
});

function createExpertCard(expert) {
    const col = document.createElement("div");
    col.className = "col";

    // Tạo nút nhắn tin nếu user có quyền
    const messageButtonHtml = window.userRole
        ? `<button class="btn btn-sm btn-outline-info" onclick="sendMessage(${expert.expertId})">
                <i class="bi bi-chat-dots me-1"></i>Nhắn tin
           </button>`
        : ''; // nếu không có quyền thì chuỗi rỗng

    col.innerHTML = `
        <div class="card shadow border-0 rounded-4 h-100">
            <div class="card-body p-4 d-flex flex-column justify-content-between">
                <div class="d-flex align-items-center mb-3">
                    <img src="/Post/ProxyImage?url=${encodeURIComponent(expert.avatarUrl)}" class="rounded-circle me-3" style="width: 60px; height: 60px;" alt="Avatar" />
                    <div>
                        <h6 class="mb-1 fw-bold text-primary">${expert.fullName}</h6>
                        <h3 class="small mb-0 text-success">${expert.academicTitle}</h3>
                        <p class="text-muted small mb-0">${expert.position} - ${expert.specialization}</p>
                        <p class="small mb-0 fw-bold" style="color:#d6a001 ">${expert.organization}</p>
                    </div>
                </div>
                <div class="d-flex gap-2 mt-3">
                    ${messageButtonHtml}
                    <button class="btn btn-sm btn-outline-success" onclick="viewProfile(${expert.expertId})">
                        <i class="bi bi-eye me-1"></i>Xem hồ sơ
                    </button>
                </div>
            </div>
        </div>
    `;
    return col;
}


function sendMessage(expertId) {
    fetch(`/Friends/SendMessage?expertId=${expertId}`, { method: "POST" })
        .then(res => res.json())
        .then(json => {
            if (json.success) {
                window.location.href = "/Chat/Index?chatRoomId=" + json.data;
            } else {
                showErrorModal("Gửi tin nhắn thất bại: " + json.message);
            }
        })
        .catch(() => showErrorModal("Có lỗi xảy ra khi gửi tin nhắn."));
}

function viewProfile(expertId) {
    fetch(`/Friends/GetExpertById?expertId=${expertId}`)
        .then(res => res.json())
        .then(json => {
            if (!json.success) {
                showErrorModal("Không thể tải hồ sơ: " + json.message);
                return;
            }

            const expert = json.data;

            document.getElementById("modalAvatar").src = `/Post/ProxyImage?url=${encodeURIComponent(expert.avatarUrl)}`;
            document.getElementById("modalFullName").textContent = expert.fullName;
            document.getElementById("modalAcademicTitle").textContent = expert.academicTitle;
            document.getElementById("modalPosition").textContent = expert.position;
            document.getElementById("modalSpecialization").textContent = expert.specialization;
            document.getElementById("modalOrganization").textContent = expert.organization;
            document.getElementById("modalDescription").textContent = expert.description || "Không có mô tả.";

            new bootstrap.Modal(document.getElementById("expertModal")).show();
        })
        .catch(() => showErrorModal("Có lỗi xảy ra khi tải thông tin chuyên gia."));
}