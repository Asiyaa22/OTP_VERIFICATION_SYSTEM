//API code
import express from "express";
import { register, sendOTP, verifyOTP, login, logout } from "../controllers/authcontrollers.js"
//importing actual functionality from controllers/authControllers.js

const router = express.Router();

//Defining API routes

router.post("/register", register);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/login", login);
router.get("/login", login);
router.post("/logout", logout);

// app.listen(3000, () => {
//     console.log(`Server is running on port ${port}`)
// })

export { router };