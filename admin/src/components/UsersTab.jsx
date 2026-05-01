import { useState, useEffect } from 'react';
import { Search, MessageSquare, Shield, Briefcase, User as UserIcon, X, Send, CheckCircle, ExternalLink } from 'lucide-react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../utils/config';
import UserModal from './UserModal';

export default function UsersTab() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserId, setSelectedUserId] = useState(null);

    // NEW: States for the Quick Message Modal
    const [messagingUser, setMessagingUser] = useState(null);
    const [messageText, setMessageText] = useState('');
    const [socket, setSocket] = useState(null);
    const [toast, setToast] = useState(null);

    // Fetch Users
    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();

        // NEW: Connect a background socket for silent quick messaging
        const backendUrl = API_BASE_URL.replace('/api', '');
        const newSocket = io(backendUrl);
        newSocket.emit('join', { isAdmin: true });
        setSocket(newSocket);

        return () => newSocket.disconnect();
    }, []);

    // NEW: Open the Quick Message Modal
    const handleOpenMessageModal = (e, user) => {
        e.stopPropagation(); // Prevents the User Profile modal from opening
        setMessagingUser(user);
        setMessageText('');
    };

    // NEW: Send the message silently and close the modal
    const handleSendMessage = () => {
        if (!messageText.trim() || !socket || !messagingUser) return;

        socket.emit('sendMessage', {
            senderId: null,
            receiverId: messagingUser._id,
            message: messageText.trim(),
            image: null,
            isAdmin: true
        });

        // Show a nice success toast!
        setToast(`Message sent to ${messagingUser.name.split(' ')[0]}`);
        setTimeout(() => setToast(null), 3000);

        setMessagingUser(null);
        setMessageText('');
    };

    // NEW: If they still want to see the full history, this jumps to the Support Tab
    const handleJumpToSupportTab = () => {
        window.dispatchEvent(new CustomEvent('openSupportChat', { detail: messagingUser }));
        setMessagingUser(null);
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 font-medium text-slate-500 animate-pulse">Loading users...</div>;

    return (
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 min-h-[calc(100vh-120px)] relative">

            {/* Success Toast */}
            {toast && (
                <div className="absolute top-8 right-8 bg-emerald-50 text-emerald-600 border border-emerald-200 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-lg z-50 animate-in fade-in slide-in-from-top-4">
                    <CheckCircle size={20} />
                    <span className="font-bold text-sm">{toast}</span>
                </div>
            )}

            {/* Header Controls */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-900">Manage Users</h2>
                    <p className="text-slate-500 font-medium mt-1">View and message all registered clients and workers.</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 w-72 transition-colors"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                    <thead>
                    <tr className="border-b-2 border-gray-100">
                        <th className="pb-4 font-bold text-slate-400 uppercase tracking-wider">User Details</th>
                        <th className="pb-4 font-bold text-slate-400 uppercase tracking-wider">Contact Info</th>
                        <th className="pb-4 font-bold text-slate-400 uppercase tracking-wider">Role</th>
                        <th className="pb-4 font-bold text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="pb-4 font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                    {filteredUsers.length === 0 ? (
                        <tr>
                            <td colSpan="5" className="py-8 text-center text-slate-500 font-medium">
                                No users found.
                            </td>
                        </tr>
                    ) : (
                        filteredUsers.map((user) => (
                            <tr
                                key={user._id}
                                onClick={() => setSelectedUserId(user._id)}
                                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                            >
                                <td className="py-4">
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={user.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                                            alt=""
                                            className="w-10 h-10 rounded-full border border-gray-200 object-cover bg-slate-100"
                                        />
                                        <div>
                                            <p className="font-bold text-slate-900">{user.name}</p>
                                            <p className="text-xs text-slate-500 font-medium">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4">
                                    <p className="font-medium text-slate-900">{user.email}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{user.phone}</p>
                                </td>
                                <td className="py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${user.role === 'Worker' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                            {user.role === 'Worker' ? <Briefcase size={12} /> : <UserIcon size={12} />}
                                            {user.role || 'Client'}
                                        </span>
                                </td>
                                <td className="py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${(!user.accountStatus || user.accountStatus === 'Active') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                            {(!user.accountStatus || user.accountStatus === 'Active') ? 'ACTIVE' : 'SUSPENDED'}
                                        </span>
                                </td>
                                <td className="py-4 text-right">
                                    <button
                                        onClick={(e) => handleOpenMessageModal(e, user)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-emerald-500 text-slate-700 hover:text-white rounded-xl font-bold transition-all duration-200 shadow-sm"
                                    >
                                        <MessageSquare size={16} />
                                        Message
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* THE ORIGINAL PROFILE MODAL */}
            {selectedUserId && (
                <UserModal
                    userId={selectedUserId}
                    onClose={() => setSelectedUserId(null)}
                    onUpdate={fetchUsers}
                />
            )}

            {/* THE NEW QUICK MESSAGE MODAL */}
            {messagingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-4">
                                <img src={messagingUser.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${messagingUser.name}`} alt="" className="w-12 h-12 rounded-full border border-gray-200" />
                                <div>
                                    <h3 className="text-lg font-extrabold text-slate-900">Message {messagingUser.name}</h3>
                                    <p className="text-xs font-bold text-slate-500">{messagingUser.role || 'Client'}</p>
                                </div>
                            </div>
                            <button onClick={() => setMessagingUser(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Your Message</label>
                            <textarea
                                rows="4"
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                placeholder="Type your message here..."
                                className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all resize-none text-slate-800"
                                autoFocus
                            />
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-100 bg-slate-50 flex justify-between items-center">
                            <button
                                onClick={handleJumpToSupportTab}
                                className="text-xs font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1.5 transition-colors"
                            >
                                <ExternalLink size={14} /> Open Full Chat
                            </button>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setMessagingUser(null)}
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!messageText.trim()}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${messageText.trim() ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                                >
                                    Send <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}