import EmailVerification from "../models/emailVerificationSchema.js";
import { getUserAgentData } from "../utils/helperFunctions.js";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";
import { throwError } from "../utils/helperFunctions.js";
import { hash } from "bcrypt";
import Users from "../models/usersSchema.js";
import path from "path";
import { __uploads, __dirname } from "../config.js";
import { body, validationResult } from "express-validator";

import fs from "fs/promises";
import ejs from "ejs";

const TRANSPORTER_EMAIL = process.env.TRANSPORTER_EMAIL || "";
const TRANSPORTER_PASSWORD = process.env.TRANSPORTER_PASSWORD || "";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: TRANSPORTER_EMAIL,
    pass: TRANSPORTER_PASSWORD,
  },
});

const register = async (req, res, next) => {
  try {
    const { email } = req.body;

    const cookieVal = randomBytes(20).toString("hex");
    res.cookie("emailVerificationCookie", cookieVal, {
      maxAge: 3 * 60 * 1000,
      httpOnly: true,
      signed: true,
      secure: false,
    });

    const verification = new EmailVerification({
      cookie: cookieVal,
      email: email,
      verificationCode: randomBytes(3).toString("hex"),
      userAgent: getUserAgentData(req),
      submittedData: req.body,
    });
    await verification.save();
    await sendVerificationEmail(email, verification.verificationCode);
    res.status(201).json({
      message: "Please check your email for verification.",
    });
  } catch (err) {
    next(err);
  }
};

async function verifyCode(req, res, next) {
  try {
    await body("verificationCode").isString().notEmpty().run(req);
    if (!validationResult(req).isEmpty())
      throwError("Invalid verification code", 400);
    const { verificationCode } = req.body;
    const cookie = req.signedCookies.emailVerificationCookie;
    if (!cookie || !verificationCode)
      throwError("Invalid verification code", 400);

    console.log(cookie);
    const verificationRecord = await EmailVerification.findOne({
      cookie: cookie,
      isVerified: false,
    });

    if (!verificationRecord) throwError("Verification record not found", 404);

    const isValidCode =
      verificationRecord.verificationCode === verificationCode;
    const isExpired = Date.now() - verificationRecord.createdAt > 3 * 60 * 1000;

    if (!isValidCode || isExpired)
      throwError("Invalid or expired verification code", 400);

    const folderName = randomBytes(20).toString("hex") + Date.now();
    const userBody = {
      user_id: randomBytes(20).toString("hex") + Date.now(),
      userTag: verificationRecord.submittedData.userTag,
      password: await hash(verificationRecord.submittedData.password, 10),
      firstName: verificationRecord.submittedData.firstName,
      lastName: verificationRecord.submittedData.lastName,
      userTag: verificationRecord.submittedData.userTag,
      folder: folderName,

      generalInfo: {
        gender: verificationRecord.submittedData.gender,
        dateOfBirth: verificationRecord.submittedData.birthDate,
        livesIn: verificationRecord.submittedData.country,
        phoneNumber: verificationRecord.submittedData.number,
        email: verificationRecord.submittedData.email,
      },
    };
    const newUser = new Users(userBody);

    await Promise.all([
      newUser.save(),
      EmailVerification.updateOne(
        { cookie: cookie, isVerified: false },
        { $set: { isVerified: true } }
      ),
      fs.mkdir(path.join(__uploads, `/profiles/${folderName}`), {
        recursive: true,
      }),
    ]);

    return res
      .status(201)
      .json({ message: "Email verified and user registered successfully" });
  } catch (error) {
    next(error);
  }
}

async function sendVerificationEmail(
  userEmail,
  verificationCode,
  user = "user"
) {
  try {
    const html = await ejs.renderFile(
      path.join(__dirname, "/views/verificationEmail.ejs"),
      { user, verificationCode }
    );
    const mailOptions = {
      from: TRANSPORTER_EMAIL,
      to: userEmail,
      subject: "Email Verification Code",
      text: "",
      html: html,
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    throwError(err?.message, err?.status);
  }
}

async function logout(req, res, next) {
  try {
    req.session.destroy();
    res.clearCookie("connect.sid");
    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    next(err);
  }
}

export { register, verifyCode, logout };
