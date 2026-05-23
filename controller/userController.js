import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";
 
const generateToken = (res, id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

export const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {

    if(!user.isVerified) {
      return res.status(401).json({
        message: "Please verify your email first.",
        isVerified:false,
        email: user.email
      })
    }
    generateToken(res, user._id);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } else {
    res.status(401).json({ message: "Email and password are incorrect" });
  }
});

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;


  const userExists = await User.findOne({ email });
  if (userExists) {
   res.status(400);
   throw new Error('The email is already registered')
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpire = Date.now() + 15 * 60 * 1000;

  
    try {
      const message = `Welcome to Chalo Baba , here is your registration code ${otp}`;
      await sendEmail({
        email:email,
        subject: "Account verification - Chalo Baba",
        message,
      });

      const user = await User.create({ name, email, password, otp, otpExpire });

      if (user) {

      res.status(201).json({
        success: true,
        message: `OTP has been sent to ${user.email}.Please verify your account`,
        email: user.email,
      });
    } else {
      res.status(400).json({ message: "Invaild user data" });
    }
    } catch (error) {
      await User.findByIdAndDelete(user._id);
      res
        .status(500)
        .json({ message: "Email could not be sent. Please try again." });
    }
   
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({
    email,
    otp,
    otpExpire: { $gt: Date.now() },
  });
  if (!user) {
    return res.status(400);
    throw new Error('invalid or expired OTP')
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpire = undefined;
  await user.save();


  try {
    generateToken(res, user._id);

  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    message: "Email verified successfully!",
  }); 
  } catch (tokenError) {
    res.status(500);
    throw new Error('User verified but faild to generate session . Please login')
  }
 
});

export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error("user not found");
  }
});
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.password) {
      user.password = req.body.password;
    }
    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error("user is not found");
  }
});

export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).sort({createdAt: -1});
  res.json(users);
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    if (user.isAdmin) {
      res.status(400);
      throw new Error("You can not delete admin");
    }
    await User.deleteOne({ _id: user._id });
    res.json({ message: "User has deleted" });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error("user not found");
  }
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.isAdmin = Boolean(req.body.isAdmin);
    const updatedUser = user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    res.status(404);
    throw new Error("There is no users with this email address");
  }

  const resetToken = user.getResetPasswordToken();
  user.save({ validateBeforeSave: false });

  const message = `Here is the O T P for your reset password
   :/n/n /${resetToken}`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Password reset request`,
      message,
    });
    res.status(200).json({
      success: true,
      message: `Email sent`,
    });
  } catch (error) {
    user.resetPssswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500);
    throw new Error("Email cannot be sent");
  }
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { otp, password } = req.body;
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    res.status(400);
    throw new Error("Token is invalid or has expired");
  }
  user.password = password;
  user.resetPasswordToken = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password has been changed successfully",
  });
});
