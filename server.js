import express from "express";
import bodyParser from "body-parser";
//importing routes
import { router } from "./API_Routes/auth.js";

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api/auth', router);
app.get("/", (req, res) => {
    res.send("Building APIs");
})

app.listen(3000, () => {
    console.log(`Server is running on port ${port}`)
})
