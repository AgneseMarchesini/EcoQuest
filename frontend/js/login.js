/**
 * Gestisce la logica lato client per l'accesso alla piattaforma. Intercetta l'invio del form di 
 * login, valida la presenza dei dati (email e password) e invia una richiesta POST all'endpoint `/auth/login`. 
 * In caso di successo, estrae il token JWT e il ruolo dell'utente dalla risposta del server, li memorizza in 
 * modo persistente nel `localStorage` del browser e reindirizza l'utente alla homepage.
 */

function showError(message) {
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.innerText = message;
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
        showError("Compila tutti i campi");
        return;
    }

    try {
        const response = await fetch("/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role); 

            window.location.href = '/homepage';
        } else {
            showError(data.message || "Errore di login");
            return;
        }

    } catch (err) {
        console.log("CATCH:", err.message);
        showError("Errore di connessione");
    }
});