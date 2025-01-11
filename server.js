import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
//importing routes
import { router } from "./API_Routes/auth.js";

const app = express();
const port = 4000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");
app.use('/api/auth', router);
app.use(express.static("public"));
app.get("/", (req, res) => {
    // res.send("Building APIs");
    res.render("register.ejs");
});
app.listen(4000, () => {
    console.log(`Server is running on port ${port}`)
})
