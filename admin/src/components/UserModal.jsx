import { useState, useEffect } from 'react';
import { X, Mail, Phone, MapPin, Clock, Trash2, Power } from 'lucide-react';
import { API_BASE_URL } from '../utils/config';

export default function UserModal({ userId, onClose, onUpdate }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUser = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setUser(data);
            } else {
                setError(data.msg || 'Failed to load user details');
            }
        } catch (err) {
            setError('Failed to load user details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) fetchUser();
    }, [userId]);

    const handleStatusToggle = async () => {
        const currentStatus = user.accountStatus || 'Active';
        const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
        if (!window.confirm(`Are you sure you want to ${newStatus === 'Suspended' ? 'SUSPEND' : 'ACTIVATE'} this user account?`)) return;
        
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ accountStatus: newStatus })
            });
            if (response.ok) {
                if (onUpdate) onUpdate();
                fetchUser();
            } else {
                alert('Failed to update status');
            }
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('CRITICAL ACTION: Are you sure you want to completely delete this user? This cannot be undone.')) return;
        
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                if (onUpdate) onUpdate();
                onClose();
            } else {
                alert('Failed to delete user');
            }
        } catch (err) {
            console.error("Failed to delete user", err);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
                    <h3 className="font-bold text-xl text-slate-900">User Profile</h3>
                    <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    {loading ? (
                        <div className="py-10 text-center text-slate-400 font-medium animate-pulse">Loading profile...</div>
                    ) : error ? (
                        <div className="py-10 text-center text-red-500 font-medium">{error}</div>
                    ) : user ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-5">
                                <img 
                                    src={user.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} 
                                    alt={user.name} 
                                    className="w-20 h-20 rounded-full border-4 border-emerald-50 shadow-sm"
                                />
                                <div>
                                    <h2 className="text-2xl font-extrabold text-slate-900">{user.name}</h2>
                                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${user.role === 'Worker' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="space-y-4 pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Mail className="w-5 h-5 text-emerald-500" />
                                    <span className="font-medium">{user.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Phone className="w-5 h-5 text-emerald-500" />
                                    <span className="font-medium">{user.phone}</span>
                                </div>
                                {user.location?.address && (
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <MapPin className="w-5 h-5 text-emerald-500" />
                                        <span className="font-medium">{user.location.address}</span>
                                    </div>
                                )}
                            </div>

                            {user.role === 'Worker' && (
                                <div className="pt-4 border-t border-gray-50">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Worker Details</h4>
                                    {user.bio && <p className="text-slate-600 text-sm mb-4 leading-relaxed">{user.bio}</p>}
                                    
                                    {user.skills && user.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {user.skills.map((skill, i) => (
                                                <span key={i} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-sm text-slate-500 font-medium">
                                <div className="flex flex-col gap-1">
                                    <span>Account: <span className={(!user.accountStatus || user.accountStatus === 'Active') ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'}>{(user.accountStatus || 'Active').toUpperCase()}</span></span>
                                    {user.role === 'Worker' && (
                                        <span>Status: <span className="text-blue-500 font-bold">{user.status}</span></span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock size={16} /> Joined {new Date(user.createdAt).toLocaleDateString()}
                                </div>
                            </div>

                            {/* Admin Controls */}
                            <div className="pt-6 border-t border-gray-100 flex flex-col gap-3">
                                <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-1">Admin Controls</h4>
                                
                                <button 
                                    onClick={handleStatusToggle}
                                    className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold transition-colors ${
                                        (!user.accountStatus || user.accountStatus === 'Active')
                                            ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' 
                                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                    }`}
                                >
                                    <Power size={18} />
                                    {(!user.accountStatus || user.accountStatus === 'Active') ? 'Suspend Account' : 'Reactivate Account'}
                                </button>

                                <button 
                                    onClick={handleDelete}
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-colors"
                                >
                                    <Trash2 size={18} />
                                    Delete User Permanently
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
