function redirectToLoginIfUnauthorized(response) {
    if (response.status === 401) {
        localStorage.removeItem("token");
        alert("Sessione scaduta o accesso negato. Effettua il login.");
        window.location.href = "/auth/login";
        return true;
    }

    if (response.status === 403) {
        alert("Non hai i permessi (Esercente/Admin) per accedere a questa sezione.");
        window.location.href = '/homepage';
        return;
    }

    return false;
}

function checkPageAuth(allowedRoles = []) {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = '/auth/login';
        return false;
    }

    if (allowedRoles.length > 0) {
        try {
            const payloadBase64 = token.split('.')[1];
            const decodedPayload = JSON.parse(atob(payloadBase64));

            if (!allowedRoles.includes(decodedPayload.role)) {
                alert("Accesso negato: non hai i permessi necessari.");
                window.location.href = '/homepage'; 
                return false;
            }
        } catch (e) {
            localStorage.removeItem('token');
            window.location.href = '/auth/login';
            return false;
        }
    }
    
    return true; 
}
