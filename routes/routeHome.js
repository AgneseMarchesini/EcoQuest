const express = require("express");
const router = express.Router();
const path = require('path');

router.get("/homepage", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/view_map.html"));
});

module.exports = router;
