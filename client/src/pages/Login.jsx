import React, { useState } from 'react'
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-hot-toast';

const Login = () => {
    const [state, setState] = useState("login");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    const { axios, setToken } = useAppContext(); // ❌ เอา navigate ออก ไม่ใช้ที่นี่

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isLoading) return;
        setIsLoading(true);

        const url = state === "login" ? '/api/user/login' : '/api/user/register';

        try {
            console.log(`🔐 Attempting ${state}...`);
            
            const payload = state === "login" 
                ? { email: email.trim(), password }
                : { name: name.trim(), email: email.trim(), password };

            const { data } = await axios.post(url, payload);
            
            if (data.success) {
                console.log('✅ Authentication successful');
                
                // ✅ เก็บ token
                setToken(data.token);
                localStorage.setItem('token', data.token);
                
                toast.success(`${state === "login" ? "Login" : "Registration"} successful!`);
                
                // Clear form
                setName("");
                setEmail("");
                setPassword("");

                // ❌ ไม่ต้อง navigate หรือสร้าง chat ที่นี่
                // ปล่อยให้ AppContext เป็นคน fetchChats และเลือกแชทล่าสุดเอง
            } else {
                toast.error(data.message || "Authentication failed");
            }
        } catch (error) {
            console.error('Authentication error:', error);
            
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else if (error.response?.status === 429) {
                toast.error("Too many requests. Please try again later.");
            } else if (error.response?.status >= 500) {
                toast.error("Server error. Please try again later.");
            } else {
                toast.error("Login failed. Please check your credentials.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 m-auto items-start p-8 py-12 w-80 sm:w-[352px] text-gray-500 rounded-lg shadow-xl border border-gray-200 bg-white">
            <p className="text-2xl font-medium m-auto">
                <span className="text-purple-700">User</span> {state === "login" ? "Login" : "Sign Up"}
            </p>

            {state === "register" && (
                <div className="w-full">
                    <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
                    <input
                        id="name"
                        name="name"
                        autoComplete="name"
                        onChange={(e) => setName(e.target.value)}
                        value={name}
                        placeholder="Enter your full name"
                        className="border border-gray-200 rounded w-full p-2 mt-1 outline-purple-700"
                        type="text"
                        required
                        disabled={isLoading}
                    />
                </div>
            )}

            <div className="w-full">
                <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                <input
                    id="email"
                    name="email"
                    autoComplete="email"
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                    placeholder="Enter your email"
                    className="border border-gray-200 rounded w-full p-2 mt-1 outline-purple-700"
                    type="email"
                    required
                    disabled={isLoading}
                />
            </div>

            <div className="w-full">
                <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
                <input
                    id="password"
                    name="password"
                    autoComplete={state === "login" ? "current-password" : "new-password"}
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                    placeholder={state === "register" ? "Create password (min 6 chars)" : "Enter your password"}
                    className="border border-gray-200 rounded w-full p-2 mt-1 outline-purple-700"
                    type="password"
                    required
                    disabled={isLoading}
                />
            </div>

            {state === "register" ? (
                <p className="text-sm">
                    Already have account?{' '}
                    <span 
                        onClick={() => !isLoading && setState("login")} 
                        className={`text-purple-700 cursor-pointer hover:text-purple-800 ${isLoading ? 'opacity-50' : ''}`}
                    >
                        click here
                    </span>
                </p>
            ) : (
                <p className="text-sm">
                    Create an account?{' '}
                    <span 
                        onClick={() => !isLoading && setState("register")} 
                        className={`text-purple-700 cursor-pointer hover:text-purple-800 ${isLoading ? 'opacity-50' : ''}`}
                    >
                        click here
                    </span>
                </p>
            )}

            <button 
                type='submit' 
                disabled={isLoading}
                className={`w-full py-3 rounded-md transition-all text-white font-medium ${
                    isLoading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-purple-700 hover:bg-purple-800 cursor-pointer'
                }`}
            >
                {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {state === "register" ? "Creating Account..." : "Signing In..."}
                    </div>
                ) : (
                    state === "register" ? "Create Account" : "Login"
                )}
            </button>
        </form>
    );
};

export default Login;
