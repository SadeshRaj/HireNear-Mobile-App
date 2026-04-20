import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock } from 'lucide-react';
import { API_BASE_URL } from '../utils/config';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.user && data.user.role === 'Admin') {
                    console.log("Admin Login Success");

                    // Store the JWT token and user data in local storage
                    localStorage.setItem('adminToken', data.token);
                    localStorage.setItem('adminData', JSON.stringify(data.user));

                    navigate('/dashboard');
                } else {
                    setError('Access denied. Admin privileges required.');
                }
            } else {
                // Utilizing the custom UI error state instead of standard alerts
                setError(data.msg || 'Invalid credentials');
            }
        } catch (err) {
            console.error("Login Error:", err);
            setError('Could not connect to the server. Check your network or API URL.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] p-4">
            <div className="bg-white max-w-md w-full rounded-[32px] shadow-sm border border-gray-100 p-8">
                <div className="flex justify-center mb-6">
                    <div className="bg-slate-900 p-4 rounded-2xl shadow-md">
                        <ShieldCheck size={40} className="text-emerald-400" />
                    </div>
                </div>

                <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-2 tracking-tight">HireNear Admin</h2>
                <p className="text-slate-500 text-center mb-8 font-medium">Secure portal access</p>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-5 text-sm text-center font-medium border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="email"
                            className="block w-full pl-11 pr-4 py-4 bg-[#F8F9FB] border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                            placeholder="Admin Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="password"
                            className="block w-full pl-11 pr-4 py-4 bg-[#F8F9FB] border-transparent rounded-2xl text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-slate-900 text-white font-bold rounded-2xl py-4 mt-4 hover:bg-slate-800 transition-colors shadow-md"
                    >
                        Access Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
}