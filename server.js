import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { db } from "./controllers/authcontrollers.js"
//importing routes
import { router } from "./API_Routes/auth.js";

const app = express();
const port = 4000;
const PgSession = connectPgSimple(session);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");
app.use(express.static("public"));

//session
app.use(session({
    store: new PgSession({
        pool: db,
        tableName: "session",
        createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
    },
}))
app.use('/api/auth', router);
app.get("/", (req, res) => {
    // res.send("Building APIs");
    res.render("register.ejs");
});
app.listen(4000, () => {
    console.log(`Server is running on port ${port}`)
})
