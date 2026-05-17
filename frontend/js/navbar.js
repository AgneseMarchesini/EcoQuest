document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    
    let isLoggedIn = false;
    let isAdmin = false;

    if(token) {
        try {
            const payloadBase64 = token.split('.')[1];
            const decodedJson = atob(payloadBase64);
            const decoded = JSON.parse(decodedJson);
            
            isLoggedIn = true;
            isAdmin = (decoded.role === "Amministratore");
        } catch (error) {
            console.error("Errore nel parsing del token:", error);
            localStorage.removeItem("token"); 
        }
    }

    const guestLinks = document.querySelectorAll(".guest-only");
    const userLinks = document.querySelectorAll(".user-only");
    const adminLinks = document.querySelectorAll(".admin-only");

    if(isLoggedIn) {
        guestLinks.forEach(el => el.style.display = "none");
        userLinks.forEach(el => el.style.display = "block");
        
        if(isAdmin) {
            adminLinks.forEach(el => el.style.display = "block");
        } else {
            adminLinks.forEach(el => el.style.display = "none");
        }
    } else {
        guestLinks.forEach(el => el.style.display = "block");
        userLinks.forEach(el => el.style.display = "none");
        adminLinks.forEach(el => el.style.display = "none");
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if(logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("token");
            window.location.href = "/auth/login"; 
        });
    }
});