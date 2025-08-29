import React, { useEffect, useRef, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import Message from './Message'
import { assets } from '../assets/assets'
import { toast } from 'react-hot-toast'

const ChatBox = () => {
  const containerRef = useRef(null);

  const { selectedChats, theme, sendMessage, user } = useAppContext();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('text');
  const [isPublished, setIsPublished] = useState(false);

  // 🔧 แก้ปัญหา: Implement onSubmit function
  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim() || loading) return;
    
    // Check credits for image generation
    if (mode === 'image' && user?.credits < 2) {
      toast.error("You don't have enough credits for image generation");
      return;
    }

    const messageContent = prompt.trim();
    setPrompt(''); // Clear input immediately
    setLoading(true);

    try {
      console.log(`📤 Sending ${mode} message:`, messageContent);
      
      // Add user message to UI immediately
      const userMessage = {
        role: "user",
        content: messageContent,
        timestamp: Date.now(),
        isImage: false
      };
      
      setMessages(prev => [...prev, userMessage]);

      // Send to backend
      const result = await sendMessage(messageContent, mode === 'image');
      
      if (result?.reply) {
        // Add AI response to messages
        setMessages(prev => [...prev, result.reply]);
        
        if (mode === 'image') {
          toast.success('Image generated successfully!');
        }
      }
      
    } catch (error) {
      console.error('Send message failed:', error);
      
      // Remove user message on error
      setMessages(prev => prev.slice(0, -1));
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(`Failed to ${mode === 'image' ? 'generate image' : 'send message'}`);
      }
      
      // Restore prompt on error
      setPrompt(messageContent);
    } finally {
      setLoading(false);
    }
  };

  // Update messages when selected chat changes
  useEffect(() => {
    if (selectedChats && selectedChats.messages) {
      console.log('💬 Loading chat messages:', selectedChats.messages.length);
      setMessages(selectedChats.messages);
    } else {
      setMessages([]);
    }
  }, [selectedChats]);

  // Auto scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  // Show loading or empty state
  if (!selectedChats) {
    return (
      <div className='flex-1 flex flex-col justify-center items-center m-5 md:m-10 xl:mx-30 max-md:mt-14 2xl:pr-40'>
        <div className='text-center text-gray-500'>
          <p className='text-xl mb-2'>No chat selected</p>
          <p className='text-sm'>Select a chat from the sidebar or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex-1 flex flex-col justify-between m-5 md:m-10 xl:mx-30 max-md:mt-14 2xl:pr-40'>
      
      {/* Chat Messages */}
      <div ref={containerRef} className='flex-1 mb-5 overflow-y-scroll'>
        
        {messages.length === 0 && (
          <div className='h-full flex flex-col items-center justify-center gap-5 text-primary'>
            <img 
              src={theme === 'dark' ? assets.logo_full : assets.logo_full_dark} 
              alt="logo" 
              className='w-full max-w-56 sm:max-w-68' 
            />
            <p className='mt-5 text-4xl sm:text-6xl text-center text-gray-400 dark:text-white'>
              Ask me anything.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <Message key={`${message.timestamp}-${index}`} message={message} />
        ))}

        {/* Three Dots Loading */}
        {loading && (
          <div className='loader flex items-center gap-1.5 ml-4 mt-4'>
            <div className='w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce'></div>
            <div className='w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce' style={{animationDelay: '0.1s'}}></div>
            <div className='w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce' style={{animationDelay: '0.2s'}}></div>
          </div>
        )}

      </div>

      {/* Image publish option */}
      {mode === 'image' && (
        <label className='inline-flex items-center gap-2 mb-3 text-sm mx-auto'>
          <p className='text-xs'>Publish Generated Image to Community</p>
          <input 
            type="checkbox" 
            className='cursor-pointer' 
            checked={isPublished} 
            onChange={(e) => setIsPublished(e.target.checked)} 
          />
        </label>
      )}

      {/* Prompt Input Box */}
      <form 
        onSubmit={onSubmit} 
        className='bg-primary/20 dark:bg-[#583C79]/30 border border-primary dark:border-[#80609F]/30 rounded-full w-full max-w-2xl p-3 pl-4 mx-auto flex gap-4 items-center'
      >
        {/* Mode Select */}
        <select 
          onChange={(e) => setMode(e.target.value)} 
          value={mode}
          disabled={loading}
          className='text-sm pl-3 pr-2 outline-none rounded-md border border-gray-300 dark:border-[#80609F] bg-white dark:bg-purple-900'
        >
          <option className='dark:bg-purple-900' value="text">Text</option>
          <option className='dark:bg-purple-900' value="image">
            Image {user?.credits < 2 ? '(Not enough credits)' : '(2 credits)'}
          </option>
        </select>

        {/* Prompt Input */}
        <input 
          onChange={(e) => setPrompt(e.target.value)} 
          value={prompt} 
          type="text"
          placeholder={mode === 'image' ? "Describe the image you want to generate..." : "Type your message here..."}
          className='flex-1 w-full text-sm p-2 rounded-md border border-gray-300 dark:border-[#80609F] bg-white dark:bg-[#2A2541] outline-none'
          required
          disabled={loading}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e);
            }
          }}
        />

        {/* Submit Button */}
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
            className='w-8 cursor-pointer' 
            alt={loading ? "stop" : "send"}
          />
        </button>
      </form>

      {/* Credits warning */}
      {mode === 'image' && user?.credits < 2 && (
        <p className="text-center text-red-500 text-xs mt-2">
          Insufficient credits for image generation. You have {user?.credits || 0} credits.
        </p>
      )}

    </div>
  )
}

export default ChatBox