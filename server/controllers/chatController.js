import mongoose from "mongoose"
import Chat from "../models/Chat.js"

// Create new chat
export const createChat = async (req, res) => {
    try {
        const userId = req.user._id

        const chatData = {
            userId,
            messages: [],
            name: "New Chat",
            userName: req.user.name
        }

        const newChat = await Chat.create(chatData)
        res.status(201).json({ success: true, data: newChat })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Get all chats
export const getChat = async (req, res) => {
    try {
        const userId = req.user._id
        const chats = await Chat.find({ userId }).sort({ updatedAt: -1 })

        res.status(200).json({ success: true, data: chats })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Delete chat
export const deleteChat = async (req, res) => {
    try {
        const userId = req.user._id
        const { chatId } = req.body

        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({ success: false, message: "Invalid chat ID" })
        }

        const result = await Chat.deleteOne({ _id: chatId, userId })
        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: "Chat not found" })
        }

        res.status(200).json({ success: true, message: "Chat deleted" })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}
