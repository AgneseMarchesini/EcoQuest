/**
 * È il punto di ingresso (entry point) principale dell'applicazione backend Express. 
 * Stabilisce la connessione con il database MongoDB tramite Mongoose, configura i middleware essenziali 
 * e registra i router principali.
 */

const mongoose = require("mongoose");
const express = require("express")
const path = require("path");
const cors = require("cors");
const app = express();
const routeAuth = require("./routes/routeAuth");
const routeAdmin = require("./routes/routeAdmin");
const routeEsercente = require("./routes/routeEsercente");
const routePOI = require("./routes/routePOI.js");
const routeHome = require("./routes/routeHome.js");
const routeMission = require("./routes/routeMission.js");
const routeCoupon = require("./routes/routeCoupon.js");
const routeUser = require("./routes/routeUser.js");

const { authMiddleware, authEsercenteMiddleware, authAdminMiddleware } = require("./utils.js")

require("dotenv").config();
const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
    .then(() => console.log("Connected to the database!"))
    .catch((err) => console.log("Connection error: ", err));

app.get("/", (req, res) => {
    res.redirect("/homepage");
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));
app.use("/homepage", routeHome);
app.use("/auth", routeAuth);
app.use("/admin", routeAdmin); 
app.use("/esercente", routeEsercente); 
app.use("/poi", routePOI);
app.use("/missioni", routeMission);
app.use("/coupon", routeCoupon);
app.use("/user", routeUser);
app.listen(3000);
