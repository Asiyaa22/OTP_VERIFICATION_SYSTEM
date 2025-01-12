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
// router.get("/login", login);
// (Optional) GET logout route
router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).send("Could not log out. Please try again.");
        }
        res.clearCookie("connect.sid");
        // res.redirect("/login");
        res.send({ message: "log out success!!🏁🏁"})
        // res.render("/api/auth/register");
    });
});
router.post("/logout", logout);

// app.listen(3000, () => {
//     console.log(`Server is running on port ${port}`)
// })

export { router };