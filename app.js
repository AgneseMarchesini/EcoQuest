const mongoose = require("mongoose");
const express = require("express")
const path = require("path");
const cors = require("cors");
const app = express();
const routeAuth = require("./routes/routeAuth");
const routeAdmin = require("./routes/routeAdmin");
const routePOI = require("./routes/routePOI.js");
const routeHome = require("./routes/routeHome.js");
const routeMission = require("./routes/routeMission.js");

const { authMiddleware, authAdminMiddleware } = require("./utils.js")

require("dotenv").config();
const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
    .then(() => console.log("Connected to the database!"))
    .catch((err) => console.log("Connection error: ", err));

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));
app.use("/auth", routeAuth);
app.use("/admin", routeAdmin);  //, authAdminMiddleware
app.use("/poi", routePOI);
app.use("/home", routeHome);
app.use("/mission", routeMission);
app.listen(3000);
