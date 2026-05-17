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

        console.log("STATUS:", response.status);
        console.log("OK:", response.ok);
        console.log("RAW TEXT:", await response.clone().text());

        const data = await response.json();

        console.log("response.ok:", response.ok);
        console.log("data:", data);

        if (!response.ok) {
            showError(data.message || "Errore di login");
            return;
        }

        // login ok
        localStorage.setItem("token", data.token);

        window.location.href = "/get_missions.html";

    } catch (err) {
        console.log("CATCH:", err.message);
        showError("Errore di connessione");
    }
});