import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  console.log("🔍 === AUTH MIDDLEWARE DEBUG ===");
  console.log("🔍 Headers:", JSON.stringify(req.headers, null, 2));
  console.log("🔍 Authorization header:", req.headers.authorization);
  
  let token;

  // ✅ ตรวจสอบว่า header มี Authorization และขึ้นต้นด้วย "Bearer"
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // ดึง token จริงออกมา
      token = req.headers.authorization.split(" ")[1];
      console.log("🔍 Extracted token:", token ? token.substring(0, 20) + "..." : "null");

      // ✅ ตรวจสอบว่ามี JWT_SECRET
      if (!process.env.JWT_SECRET) {
        console.log("❌ JWT_SECRET is missing!");
        return res.status(500).json({ 
          success: false, 
          message: "JWT_SECRET is not configured" 
        });
      }
      
      console.log("🔍 JWT_SECRET exists:", process.env.JWT_SECRET ? "Yes" : "No");

      // ✅ verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("🔍 Decoded token:", decoded);

      // ✅ หาผู้ใช้จาก id ที่เก็บใน token
      const user = await User.findById(decoded.id).select("-password");
      console.log("🔍 Found user:", user ? user.email : "Not found");

      if (!user) {
        console.log("❌ User not found in database");
        return res.status(401).json({ 
          success: false, 
          message: "Not authorized, user not found" 
        });
      }

      // ✅ แนบ user เข้า req เพื่อส่งต่อไปยัง controller
      req.user = user;
      console.log("✅ Authentication successful for:", user.email);
      return next();

    } catch (error) {
      console.error("❌ Auth error:", error.message);
      
      let message = "Not authorized, token failed";
      if (error.name === "TokenExpiredError") {
        message = "Token expired";
      } else if (error.name === "JsonWebTokenError") {
        message = "Invalid token";
      }
      
      return res.status(401).json({ 
        success: false, 
        message,
        debug: error.message 
      });
    }
  } else {
    console.log("❌ No valid Authorization header");
    return res.status(401).json({ 
      success: false, 
      message: "Not authorized, no token" 
    });
  }
};