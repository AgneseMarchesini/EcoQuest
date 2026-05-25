function redirectToLoginIfUnauthorized(response) {
    if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/auth/login";
        return true;
    }

    return false;
}
