const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const {
  signupSchema,
  signinSchema,
  acceptCodeSchema,
  passwordSchema,
  acceptforgotCodeSchema,
} = require("../middleware/validator");

const { doHash, dohashValidation, hmacProcess } = require("../utills/hashing");
const { transport } = require("../middleware/sendmail");


// =============== SIGNUP ===============
exports.signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const { error } = signupSchema.validate({ name, email, password });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await doHash(password, 12);

    const codevalue = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        verified: false,
        verificationCode: codevalue,
        verificationCodeValidation: expiry,
      },
    });

    await transport.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: email,
      subject: "Verification code",
      html: `<h1>${codevalue}</h1>`,
    });

    res.status(201).json({
      success: true,
      message: "Signup successful. OTP sent to your email.",
      email: newUser.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


// =============== VERIFY OTP ===============
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.verified) return res.status(400).json({ success: false, message: "User already verified" });

    if (
      user.verificationCode !== otp ||
      !user.verificationCodeValidation ||
      user.verificationCodeValidation < new Date()
    ) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    await prisma.user.update({
      where: { email },
      data: { verified: true, verificationCode: null, verificationCodeValidation: null },
    });

    const token = jwt.sign(
  {
    userId: existingUser.id,
    name: existingUser.name,
    email: existingUser.email,
    verified: existingUser.verified,
    role: existingUser.role, // ✅ read role directly from DB
  },
  process.env.Secret_Token,
  { expiresIn: "8h" }
);


    res.json({
      success: true,
      message: "OTP verified successfully. You are now logged in.",
      token,
      user: { name: user.name, email: user.email, photoUrl: user.photoUrl || null },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


// =============== SIGNIN ===============
exports.signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { error } = signinSchema.validate({ email, password });
    if (error) return res.status(401).json({ success: false, message: error.details[0].message });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (!existingUser) {
      return res.status(401).json({ success: false, message: "This user does not exist. Please sign up." });
    }

    const isValid = await dohashValidation(password, existingUser.password);
    if (!isValid) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign(
  {
    userId: existingUser.id,
    name: existingUser.name,
    email: existingUser.email,
    verified: existingUser.verified,
    role: existingUser.role, // ✅ read role directly from DB
  },
  process.env.Secret_Token,
  { expiresIn: "8h" }
);

    res
      .cookie("Authorization", "Bearer " + token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        maxAge: 8 * 3600000,
      })
      .json({
        success: true,
        token,
        user: { name: existingUser.name, email: existingUser.email, photoUrl: existingUser.photoUrl || "/default-avatar.png" },
        message: "Logged in successfully",
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


// =============== SIGNOUT ===============
exports.signout = async (req, res) => {
  try {
    return res.cookie("Authorization").status(200).json({ success: true, message: "logged out successfully" });
  } catch (err) {
    return res.status(401).json({ message: err });
  }
};


// =============== SEND VERIFICATION CODE (Resend) ===============
exports.sendVarificationcode = async (req, res) => {
  const { email } = req.body;
  try {
    const existinguser = await prisma.user.findUnique({ where: { email } });
    if (!existinguser) return res.status(404).json({ success: false, message: "This user does not exist. Please sign up." });

    if (existinguser.verified) return res.status(400).json({ message: "User already verified" });

    const codevalue = Math.floor(100000 + Math.random() * 900000).toString();

    let info = await transport.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: existinguser.email,
      subject: "Verification code",
      html: `<h1>${codevalue}</h1>`,
    });

    if (info.accepted[0] === existinguser.email) {
      const hashedcodevalue = hmacProcess(codevalue, process.env.HMAC_VARIFICATION_CODE_SECRET);
      await prisma.user.update({
        where: { email },
        data: { verificationCode: hashedcodevalue, verificationCodeValidation: new Date() },
      });
      return res.status(200).json({ success: true, message: "Verification code sent successfully" });
    }
    return res.status(400).json({ success: false, message: "Code send failed!" });
  } catch (err) {
    return res.status(401).json({ message: err });
  }
};


// =============== VERIFY RESENT CODE ===============
exports.varifyVarificationCode = async (req, res) => {
  const { email, varificationCode } = req.body;
  if (!email || !varificationCode) return res.json({ message: "Kindly add email and varificationCode" });

  try {
    const { error } = acceptCodeSchema.validate({ email, varificationCode });
    if (error) return res.status(401).json({ success: false, message: error.details[0] });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ success: false, message: "This user does not exist. Please sign up." });
    if (user.verified) return res.status(400).json({ message: "User already verified" });

    if (!user.verificationCode || !user.verificationCodeValidation) {
      return res.status(401).json({ message: "Code not sent earlier, please resend" });
    }
    if (Date.now() - user.verificationCodeValidation.getTime() > 5 * 60 * 1000) {
      return res.status(401).json({ message: "The code is expired!" });
    }

    const hashedcodevalue = hmacProcess(varificationCode.toString(), process.env.HMAC_VARIFICATION_CODE_SECRET);
    if (hashedcodevalue === user.verificationCode) {
      await prisma.user.update({
        where: { email },
        data: { verified: true, verificationCode: null, verificationCodeValidation: null },
      });
      return res.status(201).json({ success: true, message: "Your verification is done!" });
    }
  } catch (err) {
    console.log(err);
  }
};


// =============== CHANGE PASSWORD ===============
exports.ChangePassword = async (req, res) => {
  const { userId } = req.user;
  const { oldpassword, newpassword } = req.body;

  try {
    const { error } = passwordSchema.validate({ oldpassword, newpassword });
    if (error) return res.status(401).json({ success: false, message: error.details[0] });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(401).json({ success: false, message: "This user does not exist" });

    const result = await dohashValidation(oldpassword, user.password);
    if (!result) return res.status(401).json({ success: false, message: "Incorrect password" });

    const hashnewPassword = await doHash(newpassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashnewPassword } });

    return res.status(200).json({ success: true, message: "Password updated" });
  } catch (error) {
    console.log(error);
  }
};


// =============== FORGOT PASSWORD SEND CODE ===============
exports.sendforgetcode = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ success: false, message: "This user does not exist. Please sign up." });

    const codevalue = Math.floor(100000 + Math.random() * 900000).toString();
    let info = await transport.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: user.email,
      subject: "Forgot Password Code",
      html: `<h1>${codevalue}</h1>`,
    });

    if (info.accepted[0] === user.email) {
      const hashedcodevalue = hmacProcess(codevalue, process.env.HMAC_VARIFICATION_CODE_SECRET);
      await prisma.user.update({
        where: { email },
        data: { forgotPasswordCode: hashedcodevalue, forgotPasswordCodevalidation: new Date() },
      });
      return res.status(200).json({ success: true, message: "Forgot password code sent successfully" });
    }
    return res.status(400).json({ success: false, message: "Code send failed!" });
  } catch (err) {
    return res.status(401).json({ message: err });
  }
};


// =============== VERIFY FORGOT PASSWORD + RESET ===============
exports.varifyforgotCode = async (req, res) => {
  const { email, varificationCode, newpassword } = req.body;

  try {
    const { error } = acceptforgotCodeSchema.validate({ email, varificationCode, newpassword });
    if (error) return res.status(401).json({ success: false, message: error.details[0] });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ success: false, message: "This user does not exist" });

    if (!user.forgotPasswordCode || !user.forgotPasswordCodevalidation) {
      return res.status(401).json({ message: "Code not sent earlier, please resend" });
    }
    if (Date.now() - user.forgotPasswordCodevalidation.getTime() > 5 * 60 * 1000) {
      return res.status(401).json({ message: "The code is expired!" });
    }

    const hashedcodevalue = hmacProcess(varificationCode.toString(), process.env.HMAC_VARIFICATION_CODE_SECRET);
    if (hashedcodevalue === user.forgotPasswordCode) {
      const hashnewPassword = await doHash(newpassword, 12);
      await prisma.user.update({
        where: { email },
        data: { password: hashnewPassword, verified: true, forgotPasswordCode: null, forgotPasswordCodevalidation: null },
      });
      return res.status(201).json({ success: true, message: "Your password reset!" });
    }
  } catch (err) {
    console.log(err);
  }
};


// =============== UPLOAD PHOTO ===============
exports.uploadPhoto = async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const fileUrl = `/uploads/${req.file.filename}`;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { photoUrl: fileUrl },
    });

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, message: "Photo uploaded successfully", photoUrl: user.photoUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name },
    });

    res.status(200).json({
      success: true,
      message: "Name updated successfully",
      user: { name: updatedUser.name },
    });
  } catch (error) {
    console.error("❌ Error updating name:", error);
    res.status(500).json({ message: "Failed to update name" });
  }
};

exports.verify = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, message: "No token" });

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.Secret_Token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) return res.status(401).json({ success: false, message: "User not found" });

    return res.json({ success: true, user });
  } catch (err) {
    console.error("❌ Verify failed:", err);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
