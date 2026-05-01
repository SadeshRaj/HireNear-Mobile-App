import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/config';
import UserModal from './UserModal';

export default function BidsTab() {
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState(null);

    useEffect(() => {
        const fetchBids = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const response = await fetch(`${API_BASE_URL}/admin/bids`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (response.ok) {
                    setBids(data);
                }
            } catch (err) {
                console.error("Failed to fetch bids", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBids();
    }, []);

    if (loading) return <div className="p-8 font-medium text-slate-500 animate-pulse">Loading bids...</div>;

    return (
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Placed Bids</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 text-slate-500">
                            <th className="pb-4 font-semibold">Job Reference</th>
                            <th className="pb-4 font-semibold">Worker</th>
                            <th className="pb-4 font-semibold">Quoted Price</th>
                            <th className="pb-4 font-semibold">Est. Time</th>
                            <th className="pb-4 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bids.map(bid => (
                            <tr key={bid._id} className="border-b border-gray-50 last:border-0 hover:bg-slate-50/80 transition-colors">
                                <td className="py-4">
                                    <div className="font-bold text-slate-900">{bid.jobId?.title || 'Job Unavailable'}</div>
                                </td>
                                <td className="py-4">
                                    <button 
                                        onClick={() => bid.workerId?._id && setSelectedUserId(bid.workerId._id)}
                                        className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition-colors text-left"
                                    >
                                        {bid.workerId?.name || 'Unknown Worker'}
                                    </button>
                                </td>
                                <td className="py-4 font-bold text-slate-800">Rs. {bid.price}</td>
                                <td className="py-4 text-slate-600 text-sm font-medium">{bid.estimatedTime || 'N/A'}</td>
                                <td className="py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        bid.status === 'accepted' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                        bid.status === 'rejected' ? 'bg-red-50 text-red-600 border border-red-100' : 
                                        'bg-amber-50 text-amber-600 border border-amber-100'
                                    }`}>
                                        {bid.status.toUpperCase()}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {bids.length === 0 && <div className="text-center py-10 text-slate-500 font-medium">No bids have been placed yet.</div>}
            </div>

            {selectedUserId && <UserModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />}
        </div>
    );
}
