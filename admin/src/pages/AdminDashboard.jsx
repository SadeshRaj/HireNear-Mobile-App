import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, Briefcase, FileText,
    Settings, LogOut, Search, Bell, TrendingUp
} from 'lucide-react';

export default function AdminDashboard() {
    const navigate = useNavigate();

    return (
        <div className="flex h-screen bg-[#F8F9FB]">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col m-4 rounded-[32px] shadow-lg overflow-hidden">
                <div className="p-6 flex items-center gap-3 border-b border-slate-800">
                    <div className="bg-emerald-500 p-2 rounded-xl">
                        <Briefcase size={20} className="text-white" />
                    </div>
                    <span className="text-white font-extrabold text-xl tracking-wide">HireNear</span>
                </div>

                <nav className="flex-1 p-4 space-y-2 mt-4">
                    <NavItem icon={<LayoutDashboard />} label="Overview" active />
                    <NavItem icon={<Users />} label="Users" />
                    <NavItem icon={<Briefcase />} label="Jobs & Services" />
                    <NavItem icon={<FileText />} label="Transactions" />
                    <NavItem icon={<Settings />} label="Settings" />
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-3 text-slate-400 hover:text-red-400 w-full p-3 rounded-xl transition-colors font-medium"
                    >
                        <LogOut size={20} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="h-24 flex items-center justify-between px-10">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900">Platform Overview</h1>
                        <p className="text-slate-500 font-medium text-sm">Welcome back, Super Admin</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 shadow-sm w-64"
                            />
                        </div>

                        <button className="relative bg-white p-2.5 rounded-full shadow-sm border border-gray-100 text-slate-600">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>

                        <div className="w-10 h-10 bg-emerald-100 rounded-full border-2 border-white shadow-sm overflow-hidden">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" />
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="flex-1 overflow-auto px-10 pb-10">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <StatCard title="Total Users" value="12,450" trend="+12%" icon={<Users className="text-blue-600" />} bg="bg-blue-50" />
                        <StatCard title="Active Jobs" value="842" trend="+5%" icon={<Briefcase className="text-emerald-600" />} bg="bg-emerald-50" />
                        <StatCard title="Total Revenue" value="$45,231" trend="+18%" icon={<TrendingUp className="text-amber-600" />} bg="bg-amber-50" />
                    </div>

                    {/* Recent Activity Table Placeholder */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Platform Activity</h2>
                        <div className="text-center py-10 text-slate-400 font-medium">
                            Activity logs will populate here once the backend is connected.
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// Helper Components
const NavItem = ({ icon, label, active }) => (
    <a href="#" className={`flex items-center gap-3 p-3 rounded-2xl transition-colors font-medium ${
        active ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}>
        {icon}
        {label}
    </a>
);

const StatCard = ({ title, value, trend, icon, bg }) => (
    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
            <p className="text-slate-500 text-sm font-bold mb-1 uppercase tracking-wider">{title}</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{value}</h3>
            <p className="text-emerald-600 text-sm font-bold mt-2">{trend} this month</p>
        </div>
        <div className={`p-4 rounded-[24px] ${bg}`}>
            {icon}
        </div>
    </div>
);