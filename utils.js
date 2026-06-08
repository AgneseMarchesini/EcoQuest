/**
 * Centralizza e definisce i middleware di sicurezza basati su JSON Web Token (JWT) 
 * per proteggere le rotte dell'applicazione. Esporta tre funzioni di controllo gerarchico: 
 * `authMiddleware` (verifica l'identità generica di un utente loggato), `authEsercenteMiddleware` 
 * (consente l'accesso solo a Esercenti e Amministratori) e `authAdminMiddleware` (accesso esclusivo per gli Amministratori).
 */
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if(!authHeader) {
        return res.status(401).json({ error: "Token mancante" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Token scaduto o non valido" });
    }
}

function authEsercenteMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if(!authHeader) {
        return res.status(401).json({ error: "Token mancante" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if(decoded.role != "Esercente" && decoded.role != "Amministratore")
            return res.status(403).json({ message: "Accesso non autorizzato. Serve un account Esercente/Amministratore." });

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Token non valido" });
    }
}

function authAdminMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if(!authHeader) {
        return res.status(401).json({ error: "Token mancante" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if(decoded.role != "Amministratore")
            return res.status(403).json({ message: "Accesso non autorizzato. Serve un account Amministratore." });

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Token non valido" });
    }
}

module.exports = {
    authMiddleware,
    authEsercenteMiddleware,
    authAdminMiddleware
}
