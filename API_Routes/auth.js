//API code
import express from "express";
import { sendOTP, verifyOTP } from "../controllers/authcontrollers.js"
//importing actual functionality from controllers/authControllers.js

const router = express.Router();

//Defining API routes

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
// router.post("/set-password", setPassword);
// router.post("/login", login);

export { router };