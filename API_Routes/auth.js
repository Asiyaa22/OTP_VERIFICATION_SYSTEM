//API code
import express from "express";
import { register, sendOTP, verifyOTP, login } from "../controllers/authcontrollers.js"
//importing actual functionality from controllers/authControllers.js

const router = express.Router();

//Defining API routes

router.post("/register", register);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/login", login);

export { router };