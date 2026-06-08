/**
 * Regola la visibilità degli elementi di navigazione globali dell'applicazione. Viene eseguito su 
 * ogni pagina, legge e decodifica il token JWT dal `localStorage` per identificare lo stato di login e il ruolo 
 * dell'utente (Guest, Giocatore, Esercente, Amministratore). In base a questo, mostra o nasconde selettivamente 
 * i link del menu (tramite classi CSS specifiche come `.admin-only` o `.guest-only`) e gestisce l'evento di logout.
 */

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    
    let isLoggedIn = false;
    let isAdmin = false;
    let isEsercente = false;

    if(token) {
        try {
            const payloadBase64 = token.split('.')[1];
            const decodedJson = atob(payloadBase64);
            const decoded = JSON.parse(decodedJson);
            
            isLoggedIn = true;
            isAdmin = (decoded.role === "Amministratore");
            isEsercente = (decoded.role === "Esercente")
        } catch (error) {
            console.error("Errore nel parsing del token:", error);
            localStorage.removeItem("token"); 
        }
    }

    const guestLinks = document.querySelectorAll(".guest-only");
    const userLinks = document.querySelectorAll(".user-only");
    const esercenteLinks = document.querySelectorAll(".esercente-only");
    const adminLinks = document.querySelectorAll(".admin-only");
    const playerLinks = document.querySelectorAll(".player-only");

    guestLinks.forEach(el => el.style.display = "none");
    userLinks.forEach(el => el.style.display = "none");
    esercenteLinks.forEach(el => el.style.display = "none");
    adminLinks.forEach(el => el.style.display = "none");
    playerLinks.forEach(el => el.style.display = "none");
    
    if(isLoggedIn) {
        userLinks.forEach(el => el.style.display = "block")
        if(isAdmin) {
            adminLinks.forEach(el => el.style.display = "block");
        } else if(isEsercente) {
            esercenteLinks.forEach(el => el.style.display = "block");
        } else {
            playerLinks.forEach(el => el.style.display = "block");
        }
    } else {
        guestLinks.forEach(el => el.style.display = "block");
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