function showSuccessModal(message) {
    const modal = document.getElementById("successModal");
    document.getElementById("successMessage").innerText = message;
    modal.classList.remove("d-none");
    setTimeout(() => modal.classList.add("d-none"), 3000);
}

function showErrorModal(message) {
    const modal = document.getElementById("errorModal");
    document.getElementById("errorMessage").innerText = message;
    modal.classList.remove("d-none");
    setTimeout(() => modal.classList.add("d-none"), 3000);
}
