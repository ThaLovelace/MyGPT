import User from "../models/User.js";
import jwt from 'jsonwebtoken';

// Generate JWT
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// API to register User
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // ตรวจสอบว่า user มีอยู่แล้วหรือไม่
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: "User already exists" 
      });
    }

    // ✅ ส่ง plain password ให้ model hash เอง (model มี pre-save hook)
    const user = await User.create({
      name,
      email,
      password // model จะ hash ให้เองผ่าน pre-save hook
    });

    // ✅ สร้าง token ด้วย user._id
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        credits: user.credits
      }
    });

  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// API to Login User
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 🔍 ค้นหา user จาก email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    // 🔑 ใช้ method ที่สร้างไว้ใน model
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    // 🎟️ สร้าง JWT token
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        credits: user.credits
      }
    });

  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// API to get User data
export const getUser = async (req, res) => {
  try {
    // 👤 req.user จาก auth middleware
    const user = req.user;
    
    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        credits: user.credits
      }
    });
    
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};