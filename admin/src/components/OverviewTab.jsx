import { Users, Briefcase, TrendingUp } from 'lucide-react';

export default function OverviewTab() {
    return (
        <div className="flex-1">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Total Users" value="Manage" trend="Active" icon={<Users className="text-blue-600" />} bg="bg-blue-50" />
                <StatCard title="Active Jobs" value="View All" trend="Open" icon={<Briefcase className="text-emerald-600" />} bg="bg-emerald-50" />
                <StatCard title="Platform Revenue" value="Track" trend="Secure" icon={<TrendingUp className="text-amber-600" />} bg="bg-amber-50" />
            </div>

            {/* Recent Activity Table Placeholder */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Platform Activity</h2>
                <div className="text-center py-10 text-slate-400 font-medium">
                    Activity logs and overall statistics will be available soon. Use the side navigation to manage platform data.
                </div>
            </div>
        </div>
    );
}

const StatCard = ({ title, value, trend, icon, bg }) => (
    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
        <div>
            <p className="text-slate-500 text-sm font-bold mb-1 uppercase tracking-wider">{title}</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{value}</h3>
            <p className="text-emerald-600 text-sm font-bold mt-2">{trend} status</p>
        </div>
        <div className={`p-4 rounded-[24px] ${bg}`}>
            {icon}
        </div>
    </div>
);
