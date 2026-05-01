import { useState, useEffect } from 'react';
import { Users, Briefcase, FileText, Activity } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { API_BASE_URL } from '../utils/config';

export default function OverviewTab() {
    const [loading, setLoading] = useState(true);
    const [dbData, setDbData] = useState({
        metrics: { totalUsers: 0, activeJobs: 0, totalBids: 0 },
        categoryData: [],
        recentActivity: []
    });

    useEffect(() => {
        const fetchRealData = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const response = await fetch(`${API_BASE_URL}/admin/overview`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setDbData(data);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data from DB", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRealData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-120px)] text-slate-400 font-medium animate-pulse">
                Fetching live database records...
            </div>
        );
    }

    const { metrics, categoryData, recentActivity } = dbData;

    return (
        <div className="space-y-6 pb-6 animate-in fade-in duration-500">

            {/* Top Metric Cards - Changed to a 3-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title="Total Users"
                    value={metrics.totalUsers.toLocaleString()}
                    icon={<Users size={24} className="text-blue-600" />}
                    color="bg-blue-50"
                />
                <MetricCard
                    title="Active Jobs"
                    value={metrics.activeJobs.toLocaleString()}
                    icon={<Briefcase size={24} className="text-purple-600" />}
                    color="bg-purple-50"
                />
                <MetricCard
                    title="Bids Placed"
                    value={metrics.totalBids.toLocaleString()}
                    icon={<FileText size={24} className="text-amber-600" />}
                    color="bg-amber-50"
                />
            </div>

            {/* Bottom Section: Chart & Activity Side-by-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Job Categories Bar Chart */}
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="text-xl font-extrabold text-slate-900 mb-1">Top Categories</h3>
                    <p className="text-sm font-medium text-slate-500 mb-6">Most requested services on the platform</p>

                    <div className="flex-1 min-h-[300px] w-full">
                        {categoryData.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-slate-400 font-medium">No jobs posted yet.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} width={80} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="jobs" radius={[0, 8, 8, 0]} barSize={32}>
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : index === 1 ? '#10b981' : index === 2 ? '#f59e0b' : '#8b5cf6'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-extrabold text-slate-900">Recent Platform Activity</h3>
                            <p className="text-sm font-medium text-slate-500 mt-1">Latest jobs posted by clients</p>
                        </div>
                    </div>

                    <div className="flex-1 space-y-4">
                        {recentActivity.length === 0 ? (
                            <div className="text-slate-400 font-medium text-center py-4">No recent activity.</div>
                        ) : (
                            recentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors border border-transparent hover:border-gray-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-50 text-blue-500 shadow-sm">
                                            <Activity size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{activity.action}</p>
                                            <p className="text-xs font-medium text-slate-500">{activity.user}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 bg-white px-2.5 py-1 rounded-md shadow-sm border border-gray-50">{activity.time}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

// Reusable Metric Card Component
function MetricCard({ title, value, icon, color }) {
    return (
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between group hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${color} transition-transform group-hover:scale-110 shadow-sm`}>
                    {icon}
                </div>
            </div>
            <div>
                <h4 className="text-slate-500 font-bold text-sm mb-1">{title}</h4>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">{value}</h2>
            </div>
        </div>
    );
}