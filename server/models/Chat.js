import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  isImage: { type: Boolean, required: true },
  isPublished: { type: Boolean, default: false },
  role: { type: String, enum: ["user", "assistant", "system"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ChatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  name: { type: String, required: true },
  messages: [MessageSchema]
}, { timestamps: true });

const Chat = mongoose.model("Chat", ChatSchema);

export default Chat;
