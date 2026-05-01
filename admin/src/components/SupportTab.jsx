import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../utils/config';
import { io } from 'socket.io-client';
import { Search, Send, Image as ImageIcon, Check, CheckCheck, User as UserIcon } from 'lucide-react';
import UserModal from './UserModal';

export default function SupportTab() {
    const [chatList, setChatList] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [socket, setSocket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showProfile, setShowProfile] = useState(false);

    const messagesEndRef = useRef(null);
    const selectedChatRef = useRef(null);

    useEffect(() => {
        selectedChatRef.current = selectedChat;
    }, [selectedChat]);

    const fetchChatList = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_BASE_URL}/support/admin/list`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setChatList(data);
        } catch (err) {
            console.error("Failed to fetch chat list", err);
        } finally {
            setLoading(false);
        }
    };

    // IDEA 2: Listen for requests from the User Profile to open a specific chat
    useEffect(() => {
        const handleOpenSpecificChat = (e) => {
            const user = e.detail;

            // Create a temporary synthetic chat object matching the /list structure
            const newChatObj = {
                user: user,
                lastMessage: 'Start a conversation...',
                timestamp: new Date().toISOString(),
                unread: 0
            };

            // Safely push them to the sidebar list if they haven't messaged before
            setChatList(prev => {
                const exists = prev.find(c => c.user._id === user._id);
                if (!exists) return [newChatObj, ...prev];
                return prev;
            });

            // Automatically open their specific history
            loadChatHistory(newChatObj);
        };

        window.addEventListener('openSupportChat', handleOpenSpecificChat);
        return () => window.removeEventListener('openSupportChat', handleOpenSpecificChat);
    }, []);

    useEffect(() => {
        fetchChatList();

        const backendUrl = API_BASE_URL.replace('/api', '');
        const newSocket = io(backendUrl);
        setSocket(newSocket);

        newSocket.emit('join', { isAdmin: true });

        newSocket.on('receiveMessage', (msg) => {
            const currentSelected = selectedChatRef.current;

            setMessages(prev => {
                if (currentSelected) {
                    const isForActiveChat =
                        (!msg.isAdmin && msg.senderId === currentSelected.user._id) ||
                        (msg.isAdmin && msg.receiverId === currentSelected.user._id);

                    if (isForActiveChat) {
                        return [...prev, msg];
                    }
                }
                return prev;
            });

            fetchChatList();
        });

        return () => newSocket.disconnect();
    }, []);

    const loadChatHistory = async (chat) => {
        try {
            setSelectedChat(chat);
            const token = localStorage.getItem('adminToken');

            const res = await fetch(`${API_BASE_URL}/support/history/${chat.user._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setMessages(data);

            await fetch(`${API_BASE_URL}/support/read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId: chat.user._id, isAdmin: true })
            });
            fetchChatList();

        } catch (err) {
            console.error("Failed to load chat history", err);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = () => {
        if (!inputText.trim() || !socket || !selectedChat) return;

        socket.emit('sendMessage', {
            senderId: null,
            receiverId: selectedChat.user._id,
            message: inputText.trim(),
            image: null,
            isAdmin: true
        });

        setInputText('');
    };

    const sendImage = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Img = event.target.result;
                socket.emit('sendMessage', {
                    senderId: null,
                    receiverId: selectedChat.user._id,
                    message: '',
                    image: base64Img,
                    isAdmin: true
                });
            };
            reader.readAsDataURL(file);
        };
        input.click();
    };

    if (loading) return <div className="p-8 font-medium text-slate-500 animate-pulse">Loading support...</div>;

    return (
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 flex overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>

            {/* Sidebar List */}
            <div className="w-1/3 border-r border-gray-100 flex flex-col bg-slate-50">
                <div className="p-6 bg-white border-b border-gray-100">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Customer Support</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder="Search users..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {chatList.length === 0 && (
                        <div className="p-8 text-center text-slate-400 font-medium">No active chats.</div>
                    )}
                    {chatList.map((chat) => (
                        <div
                            key={chat.user._id}
                            onClick={() => loadChatHistory(chat)}
                            className={`flex items-center p-4 border-b border-gray-100 cursor-pointer transition-colors ${selectedChat?.user._id === chat.user._id ? 'bg-blue-50/50' : 'hover:bg-white'}`}
                        >
                            <img src={chat.user.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${chat.user.name}`} alt="" className="w-12 h-12 rounded-full border border-gray-200" />
                            <div className="ml-4 flex-1 overflow-hidden">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="font-bold text-slate-900 truncate">{chat.user.name}</h4>
                                    <span className="text-xs font-semibold text-slate-400">{new Date(chat.timestamp).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-slate-500 truncate">{chat.lastMessage}</p>
                                    {chat.unread > 0 && (
                                        <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">
                                            {chat.unread}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedChat ? (
                    <>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center shadow-sm z-10">
                            <div className="flex items-center gap-4">
                                <img src={selectedChat.user.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedChat.user.name}`} alt="" className="w-12 h-12 rounded-full border-2 border-blue-50" />
                                <div>
                                    <h3 className="font-extrabold text-lg text-slate-900">{selectedChat.user.name}</h3>
                                    <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">Online</span>
                                </div>
                            </div>
                            <button onClick={() => setShowProfile(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold transition-colors">
                                <UserIcon size={16} /> View Profile
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-[#F8F9FB]">
                            {messages.map((msg, idx) => {
                                const isAdmin = msg.isAdmin;
                                return (
                                    <div key={idx} className={`flex mb-4 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] ${isAdmin ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' : 'bg-white border border-gray-100 text-slate-800 rounded-2xl rounded-tl-sm shadow-sm'} px-5 py-3`}>
                                            {msg.message && <p className="text-sm font-medium leading-relaxed">{msg.message}</p>}
                                            {msg.image && <img src={msg.image} alt="Upload" className="max-w-full rounded-xl mt-2 border border-black/10" />}
                                            <div className={`text-[10px] mt-2 flex items-center justify-end ${isAdmin ? 'text-blue-200' : 'text-slate-400'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {isAdmin && (msg.read ? <CheckCheck size={12} className="ml-1" /> : <Check size={12} className="ml-1" />)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-3">
                            <button onClick={sendImage} className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors">
                                <ImageIcon size={20} />
                            </button>
                            <input
                                type="text"
                                placeholder="Write a reply..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                className="flex-1 bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors text-slate-800"
                            />
                            <button onClick={sendMessage} className={`p-3 rounded-xl transition-colors ${inputText.trim() ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' : 'bg-slate-100 text-slate-400'}`}>
                                <Send size={20} className="ml-0.5" />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Send size={40} className="text-slate-300 ml-2" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Support Center</h3>
                        <p className="font-medium">Select a conversation from the sidebar to start chatting.</p>
                    </div>
                )}
            </div>

            {showProfile && selectedChat && (
                <UserModal userId={selectedChat.user._id} onClose={() => setShowProfile(false)} />
            )}
        </div>
    );
}