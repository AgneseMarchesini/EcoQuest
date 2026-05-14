const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "Token mancante" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Token non valido" });
    }
}

function authAdminMiddleware(req, res, next) { // DA MODIFICAREEEEEEE
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "Token mancante" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(decoded.role != "Amministratore")
            return res.status(403).json({ message: "Accesso non autorizzato" });

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Token non valido" });
    }
}

module.exports = {
    authMiddleware,
    authAdminMiddleware
}
