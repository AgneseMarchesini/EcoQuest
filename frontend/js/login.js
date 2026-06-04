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