import imagekit from "../configs/imageKit.js"
import openai from "../configs/openai.js"
import Chat from "../models/Chat.js"
import User from "../models/User.js"
import axios from "axios"

// Text-based AI Chat Message Controller
export const textMessageController = async (req, res) => {
    try {
        const userId = req.user._id

        // Check credits
        if(req.user.credits < 1){
            return res.json({success: false, message: "You don't have enough credits to use this feature"})
        }

        const {chatId, prompt} = req.body

        const chat = await Chat.findOne({userId, _id: chatId})
        chat.messages.push({role: "user", content: prompt, timestamp: Date.now(), isImage: false})

        const { choices } = await openai.chat.completions.create({
            model: "gemini-2.0-flash", // ✅ แก้จาก gemini-2.0-flash
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        const reply = {...choices[0].message, timestamp: Date.now(), isImage: false}
        res.json({success: true, reply})

        chat.messages.push(reply)
        await chat.save()
        await User.updateOne({_id: userId}, {$inc: {credits: -1}})


    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

// Image Generation Message Controller
export const imageMessageController = async (req, res) => {
  try {
    const userId = req.user._id;

    // เช็คเครดิต
    if (req.user.credits < 2) {
      return res.json({
        success: false,
        message: "You don't have enough credits to use this feature",
      });
    }

    const { prompt, chatId, isPublished } = req.body;

    if (!prompt || !chatId) {
      return res.json({
        success: false,
        message: "Prompt and chatId are required",
      });
    }

    // หา Chat ของผู้ใช้
    const chat = await Chat.findOne({ userId, _id: chatId });
    if (!chat) {
      return res.json({
        success: false,
        message: "Chat not found",
      });
    }

    // บันทึกข้อความผู้ใช้ลง chat
    chat.messages.push({
      role: "user",
      content: prompt,
      timestamp: Date.now(),
      isImage: false,
    });

    // Encode prompt สำหรับ URL
    const encodePrompt = encodeURIComponent(prompt);
    const timestamp = Date.now();

    // สร้าง URL สำหรับ ImageKit AI Generate
    const generatedImageUrl = `${process.env.IMAGEKIT_URL_ENDPOINT}/ik-genimg-prompt-${encodePrompt}/mygpt/${timestamp}.png?tr=w-800,h-800`;

    // ดึงภาพจาก ImageKit
    const aiImageResponse = await axios.get(generatedImageUrl, {
      responseType: "arraybuffer",
      timeout: 30000, // 30 วินาที
    });

    // แปลงเป็น Base64
    const base64Image = `data:image/png;base64,${Buffer.from(
      aiImageResponse.data,
      "binary"
    ).toString("base64")}`;

    // อัปโหลดไปที่ ImageKit Media Library
    const uploadResponse = await imagekit.upload({
      file: base64Image,
      fileName: `generated_${timestamp}.png`,
      folder: "mygpt",
      useUniqueFileName: true,
    });

    // สร้างข้อความตอบกลับ
    const reply = {
      role: "assistant",
      content: uploadResponse.url,
      timestamp: Date.now(),
      isImage: true,
      isPublished: isPublished || false,
    };

    // เพิ่มข้อความตอบกลับใน chat และบันทึก
    chat.messages.push(reply);
    await chat.save();

    // ลดเครดิตผู้ใช้
    await User.updateOne({ _id: userId }, { $inc: { credits: -2 } });

    // ส่ง response
    res.json({
      success: true,
      reply,
      remainingCredits: req.user.credits - 2,
    });
  } catch (error) {
    console.error("Image generation error:", error);

    // ส่ง error message
    res.json({
      success: false,
      message:
        error.response?.status === 503
          ? "Image generation service is currently unavailable. Please try again later."
          : error.message,
    });
  }
};

// API to get published images
export const getPublishedImages = async (req, res) => {
  try {
    const publishedImageMessages = await Chat.aggregate([
      { $unwind: { path: "$messages", preserveNullAndEmptyArrays: false } },
      {
        $match: {
          "messages.isImage": true,
          "messages.isPublished": true
        }
      },
      {
        $project: {
          _id: 0,
          imageUrl: "$messages.content",
          userName: "$userName" // 🔹 แก้ typo
        }
      },
      { $sort: { "_id": -1 } } // 🔹 เรียงล่าสุดขึ้นก่อน
    ]);

    res.json({ success: true, images: publishedImageMessages });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
