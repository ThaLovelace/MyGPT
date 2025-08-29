import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL;

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChats, setSelectedChats] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // ---------------- fetch user ----------------
  const fetchUser = async () => {
    if (!token) {
      setLoadingUser(false);
      setIsInitialized(true);
      return;
    }

    try {
      const { data } = await axios.get("/api/user/data", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setUser(data.user);
        await fetchUserChats(data.user);
      } else {
        toast.error(data.message);
        handleLogout();
      }
    } catch {
      toast.error("Failed to verify login");
      handleLogout();
    } finally {
      setLoadingUser(false);
    }
  };

  // ---------------- fetch chats & create first chat ----------------
  const fetchUserChats = async (currentUser) => {
    if (!token || !currentUser) return;

    try {
      const { data } = await axios.get("/api/chat/get", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userChats = data.success ? data.data || [] : [];

      if (userChats.length === 0) {
        // user ใหม่ → สร้าง chat ครั้งแรก
        const { data: newChatData } = await axios.get("/api/chat/create", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (newChatData.success) {
          const chat = newChatData.data;
          setChats([chat]);
          setSelectedChats(chat);
          localStorage.setItem("selectedChatId", chat._id);
          navigate("/");
        }
      } else {
        // user เก่า → เลือก chat เดิมหรือ chat ล่าสุด
        setChats(userChats);
        const savedChatId = localStorage.getItem("selectedChatId");
        const chatToSelect =
          savedChatId && userChats.find((c) => c._id === savedChatId)
            ? userChats.find((c) => c._id === savedChatId)
            : [...userChats].sort(
                (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
              )[0];

        setSelectedChats(chatToSelect);
        localStorage.setItem("selectedChatId", chatToSelect._id);
        navigate("/");
      }
    } catch (err) {
      toast.error("Failed to load chats");
      console.error(err);
    } finally {
      setIsInitialized(true);
    }
  };

  // ---------------- create new chat ----------------
  const createNewChat = async () => {
    if (!user) return toast.error("Login to create a new chat");

    try {
      const { data } = await axios.get("/api/chat/create", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        const chat = data.data;
        setChats((prev) => [chat, ...prev]);
        setSelectedChats(chat);
        localStorage.setItem("selectedChatId", chat._id);
        navigate("/");
        toast.success("New chat created!");
      }
    } catch {
      toast.error("Failed to create new chat");
    }
  };

  // ---------------- select chat ----------------
  const selectChat = (chat) => {
    if (chat._id === selectedChats?._id) return;
    setSelectedChats(chat);
    localStorage.setItem("selectedChatId", chat._id);
    navigate("/");
  };

  // ---------------- delete chat ----------------
  const deleteChat = async (chatId) => {
    try {
      const { data } = await axios.post(
        "/api/chat/delete",
        { chatId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        const remainingChats = chats.filter((c) => c._id !== chatId);
        setChats(remainingChats);

        if (selectedChats?._id === chatId) {
          const nextChat = remainingChats.length > 0 ? remainingChats[0] : null;
          setSelectedChats(nextChat);
          if (nextChat) {
            localStorage.setItem("selectedChatId", nextChat._id);
          } else {
            localStorage.removeItem("selectedChatId");
          }
        }

        toast.success("Chat deleted");
      }
    } catch {
      toast.error("Failed to delete chat");
    }
  };

  // ---------------- logout ----------------
  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setChats([]);
    setSelectedChats(null);
    localStorage.removeItem("token");
    localStorage.removeItem("selectedChatId");
    navigate("/login");
  };

  // ---------------- theme ----------------
  useEffect(() => {
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // ---------------- restore chat on mount ----------------
  useEffect(() => {
    const savedChatId = localStorage.getItem("selectedChatId");
    if (savedChatId) setSelectedChats({ _id: savedChatId });
  }, []);

  // ---------------- fetch user on token change ----------------
  useEffect(() => {
    fetchUser();
  }, [token]);

  const value = {
    navigate,
    user,
    setUser,
    fetchUser,
    loadingUser,
    token,
    setToken,
    handleLogout,
    chats,
    setChats,
    selectedChats,
    setSelectedChats,
    selectChat,
    createNewChat,
    deleteChat,
    fetchUserChats,
    isInitialized,
    theme,
    setTheme,
    axios, // 🔹 export axios ไปใช้ตรงๆ ใน ChatBox
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
