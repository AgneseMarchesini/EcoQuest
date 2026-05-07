const mongoose = require("mongoose");
const express = require("express")
const cors = require("cors");
const app = express();
const routeAuth = require("./routes/routeAuth");
const path = require("path");

require("dotenv").config();
const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
    .then(() => console.log("Connected to the database!"))
    .catch((err) => console.log("Connection error: ", err));

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));
app.use("/auth", routeAuth);
app.listen(3000);