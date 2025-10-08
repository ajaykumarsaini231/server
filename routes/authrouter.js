const express = require("express")
const authcontroller = require("../controllers/authcontroller")
const { identifier } = require("../middleware/indentifier")
const router = express.Router()

router.post("/signup", authcontroller.signup)
router.post("/verify-otp", authcontroller.verifyOtp)
router.post("/signin",  authcontroller.signin)
router.post("/signout",identifier, authcontroller.signout)
router.post("/sendVarificationcode",  authcontroller.sendVarificationcode)
router.patch("/varifycode",identifier , authcontroller.varifyVarificationCode)
router.patch('/change-password',identifier,authcontroller.ChangePassword)
router.patch('/forgot-password-code', authcontroller.sendforgetcode)
router.patch('/forgot-password-code-validation', authcontroller.varifyforgotCode)
router.patch("/update-profile", identifier, authcontroller.updateProfile);
router.get("/verify", identifier, authcontroller.verify);
router.post("/resend-otp", authcontroller.resendSignupOtp);


// router.get("/sign", authcontroller.hash)
module.exports = router;