function redirectToLoginIfUnauthorized(response) {
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        window.location.href = "/auth/login";
        return true;
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
                window.location.href = '/home/homepage'; 
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
