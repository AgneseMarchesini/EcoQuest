const mongoose = require("mongoose");
const express = require("express")
const app = express()
const routeUtenti = require("./routes/routeUtenti")

require("dotenv").config();
const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
    .then(() => console.log("Connected to the database!"))
    .catch((err) => console.log("Connection error: ", err));

app.use(express.json())
app.use("/utenti", routeUtenti)
app.listen(3000)