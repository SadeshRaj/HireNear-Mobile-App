import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/config';
import UserModal from './UserModal';

export default function TransactionsTab() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState(null);

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const response = await fetch(`${API_BASE_URL}/admin/invoices`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (response.ok) {
                    setInvoices(data);
                }
            } catch (err) {
                console.error("Failed to fetch invoices", err);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoices();
    }, []);

    if (loading) return <div className="p-8 font-medium text-slate-500 animate-pulse">Loading transactions...</div>;

    return (
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Payment Transactions</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 text-slate-500">
                            <th className="pb-4 font-semibold">Client</th>
                            <th className="pb-4 font-semibold">Worker</th>
                            <th className="pb-4 font-semibold">Amount</th>
                            <th className="pb-4 font-semibold">Slip</th>
                            <th className="pb-4 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map(inv => (
                            <tr key={inv._id} className="border-b border-gray-50 last:border-0 hover:bg-slate-50/80 transition-colors">
                                <td className="py-4">
                                    <button 
                                        onClick={() => inv.clientId?._id && setSelectedUserId(inv.clientId._id)}
                                        className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition-colors text-left"
                                    >
                                        {inv.clientId?.name || 'Unknown Client'}
                                    </button>
                                </td>
                                <td className="py-4">
                                    <button 
                                        onClick={() => inv.workerId?._id && setSelectedUserId(inv.workerId._id)}
                                        className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition-colors text-left"
                                    >
                                        {inv.workerId?.name || 'Unknown Worker'}
                                    </button>
                                </td>
                                <td className="py-4 font-bold text-slate-800">Rs. {inv.totalAmount}</td>
                                <td className="py-4">
                                    {inv.paymentSlipUrl ? (
                                        <a href={inv.paymentSlipUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline font-medium">View Slip</a>
                                    ) : (
                                        <span className="text-slate-400">N/A</span>
                                    )}
                                </td>
                                <td className="py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                        inv.status === 'verifying' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 
                                        'bg-gray-50 text-gray-600 border border-gray-200'
                                    }`}>
                                        {inv.status.toUpperCase()}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {invoices.length === 0 && <div className="text-center py-10 text-slate-500 font-medium">No transactions found.</div>}
            </div>

            {selectedUserId && <UserModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />}
        </div>
    );
}
