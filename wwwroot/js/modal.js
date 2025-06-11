function showSuccessModal(message, duration = 3000) {
    const modal = document.getElementById("successModal");
    document.getElementById("successMessage").innerText = message;
    modal.classList.remove("d-none");
    setTimeout(() => modal.classList.add("d-none"), duration);
}

function showErrorModal(message, duration = 3000) {
    const modal = document.getElementById("errorModal");
    document.getElementById("errorMessage").innerText = message;
    modal.classList.remove("d-none");
    setTimeout(() => modal.classList.add("d-none"), duration);
}

function showInfoModal(message, duration = 3000) {
    const modal = document.getElementById("infoModal");
    document.getElementById("infoMessage").innerText = message;
    modal.classList.remove("d-none");
    setTimeout(() => modal.classList.add("d-none"), duration);
}
