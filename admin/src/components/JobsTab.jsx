import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/config';
import UserModal from './UserModal';

export default function JobsTab() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState(null);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const response = await fetch(`${API_BASE_URL}/admin/jobs`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (response.ok) {
                    setJobs(data);
                }
            } catch (err) {
                console.error("Failed to fetch jobs", err);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    if (loading) return <div className="p-8 font-medium text-slate-500 animate-pulse">Loading jobs...</div>;

    return (
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Job Postings Directory</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 text-slate-500">
                            <th className="pb-4 font-semibold">Job Title</th>
                            <th className="pb-4 font-semibold">Client</th>
                            <th className="pb-4 font-semibold">Category</th>
                            <th className="pb-4 font-semibold">Budget</th>
                            <th className="pb-4 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobs.map(job => (
                            <tr key={job._id} className="border-b border-gray-50 last:border-0 hover:bg-slate-50/80 transition-colors">
                                <td className="py-4">
                                    <div className="font-bold text-slate-900">{job.title}</div>
                                    <div className="text-xs text-slate-500 mt-0.5 max-w-xs truncate">{job.description}</div>
                                </td>
                                <td className="py-4">
                                    <button 
                                        onClick={() => job.clientId?._id && setSelectedUserId(job.clientId._id)}
                                        className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition-colors text-left"
                                    >
                                        {job.clientId?.name || 'Unknown User'}
                                    </button>
                                </td>
                                <td className="py-4">
                                    <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-semibold">
                                        {job.category}
                                    </span>
                                </td>
                                <td className="py-4 font-bold text-slate-800">Rs. {job.budget}</td>
                                <td className="py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        job.status === 'open' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                                        job.status === 'completed' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                        'bg-gray-50 text-gray-600 border border-gray-200'
                                    }`}>
                                        {job.status.toUpperCase()}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {jobs.length === 0 && <div className="text-center py-10 text-slate-500 font-medium">No job postings found.</div>}
            </div>

            {selectedUserId && <UserModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />}
        </div>
    );
}
