import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/config';
import UserModal from './UserModal';

export default function UsersTab() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState(null);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
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
    }, []);

    if (loading) return <div className="p-8 font-medium text-slate-500 animate-pulse">Loading users...</div>;

    return (
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Users & Workers Directory</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 text-slate-500">
                            <th className="pb-4 font-semibold">User Details</th>
                            <th className="pb-4 font-semibold">Contact Info</th>
                            <th className="pb-4 font-semibold">Role</th>
                            <th className="pb-4 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr 
                                key={user._id} 
                                onClick={() => setSelectedUserId(user._id)}
                                className="border-b border-gray-50 last:border-0 hover:bg-slate-50/80 transition-colors cursor-pointer"
                            >
                                <td className="py-4 flex items-center gap-4">
                                    <img src={user.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} alt={user.name} className="w-10 h-10 rounded-full border border-gray-200" />
                                    <div>
                                        <div className="font-bold text-slate-900">{user.name}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">Joined {new Date(user.createdAt).toLocaleDateString()}</div>
                                    </div>
                                </td>
                                <td className="py-4">
                                    <div className="text-slate-900 font-medium">{user.email}</div>
                                    <div className="text-slate-500 text-xs mt-0.5">{user.phone}</div>
                                </td>
                                <td className="py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === 'Worker' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-purple-50 text-purple-600 border border-purple-100'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${(!user.accountStatus || user.accountStatus === 'Active') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                        {(!user.accountStatus || user.accountStatus === 'Active') ? 'ACTIVE' : 'SUSPENDED'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && <div className="text-center py-10 text-slate-500 font-medium">No users found.</div>}
            </div>

            {selectedUserId && (
                <UserModal 
                    userId={selectedUserId} 
                    onClose={() => setSelectedUserId(null)} 
                    onUpdate={fetchUsers} 
                />
            )}
        </div>
    );
}
