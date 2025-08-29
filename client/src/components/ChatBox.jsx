import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import Message from './Message';
import { assets } from '../assets/assets';
import { toast } from 'react-hot-toast';

const ChatBox = () => {
  const containerRef = useRef(null);
  const { selectedChats, theme, user, axios, token, setUser } = useAppContext();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('text');
  const [isPublished, setIsPublished] = useState(false);

  const onSubmit = async (e) => {
    try {
      e.preventDefault();
      if (!user) return toast.error('Login to send message');
      if (!selectedChats?._id) return toast.error('Please select a chat first');

      setLoading(true);
      const promptCopy = prompt;
      setPrompt('');
      setMessages(prev => [
        ...prev,
        { role: 'user', content: promptCopy, timestamp: Date.now(), isImage: mode === 'image' }
      ]);

      const { data } = await axios.post(
        `/api/message/${mode}`,
        { chatId: selectedChats._id, prompt: promptCopy, isPublished },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setMessages(prev => [...prev, data.reply]);
        // decrease credits (safe)
        setUser(prev => ({
          ...prev,
          credits: Math.max(0, prev.credits - (mode === 'image' ? 2 : 1))
        }));
      } else {
        toast.error(data.message);
        setPrompt(promptCopy);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load messages when selected chat changes
  useEffect(() => {
    if (selectedChats) {
      setMessages(selectedChats.messages);
    }
  }, [selectedChats]);

  // Auto scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, loading]);

  return (
    <div className="flex-1 flex flex-col justify-between m-5 md:m-10 xl:mx-30 max-md:mt-14 2xl:pr-40">
      
      {/* Chat Messages */}
      <div ref={containerRef} className="flex-1 mb-5 overflow-y-scroll">
        {messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center gap-5 text-primary">
            <img 
              src={theme === 'dark' ? assets.logo_full : assets.logo_full_dark} 
              alt="logo" 
              className="w-full max-w-56 sm:max-w-68" 
            />
            <p className="mt-5 text-4xl sm:text-6xl text-center text-gray-400 dark:text-white">
              Ask me anything.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <Message key={`${message.timestamp}-${index}-${Math.random()}`} message={message} />
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="loader flex items-center gap-1.5 ml-4 mt-4">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        )}
      </div>

      {/* Image publish option */}
      {mode === 'image' && (
        <label className="inline-flex items-center gap-2 mb-3 text-sm mx-auto">
          <p className="text-xs">Publish Generated Image to Community</p>
          <input 
            type="checkbox" 
            className="cursor-pointer" 
            checked={isPublished} 
            onChange={(e) => setIsPublished(e.target.checked)} 
          />
        </label>
      )}

      {/* Prompt Input */}
      <form 
        onSubmit={onSubmit} 
        className="bg-primary/20 dark:bg-[#583C79]/30 border border-primary dark:border-[#80609F]/30 rounded-full w-full max-w-2xl p-3 pl-4 mx-auto flex gap-4 items-center"
      >
        <select 
          onChange={(e) => setMode(e.target.value)} 
          value={mode}
          disabled={loading}
          className="text-sm pl-3 pr-2 outline-none rounded-md border border-gray-300 dark:border-[#80609F] bg-white dark:bg-purple-900"
        >
          <option className="dark:bg-purple-900" value="text">Text</option>
          <option className="dark:bg-purple-900" value="image">
            Image {user?.credits < 2 ? '(Not enough credits)' : '(2 credits)'}
          </option>
        </select>

        <input 
          onChange={(e) => setPrompt(e.target.value)} 
          value={prompt} 
          type="text"
          placeholder={mode === 'image' ? "Describe the image you want to generate..." : "Type your message here..."}
          className="flex-1 w-full text-sm p-2 rounded-md border border-gray-300 dark:border-[#80609F] bg-white dark:bg-[#2A2541] outline-none"
          required
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e);
            }
          }}
        />

        <button 
          type="submit" 
          disabled={loading || !prompt.trim() || (mode === 'image' && user?.credits < 2)} 
          className={`p-2 rounded-md transition-colors ${
            loading || !prompt.trim() || (mode === 'image' && user?.credits < 2)
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-purple-100 dark:hover:bg-purple-800'
          }`}
        >
          <img 
            src={loading ? assets.stop_icon : assets.send_icon} 
            className="w-8 cursor-pointer" 
            alt={loading ? "stop" : "send"}
          />
        </button>
      </form>

      {mode === 'image' && user?.credits < 2 && (
        <p className="text-center text-red-500 text-xs mt-2">
          Insufficient credits for image generation. You have {user?.credits || 0} credits.
        </p>
      )}
    </div>
  );
};

export default ChatBox;
