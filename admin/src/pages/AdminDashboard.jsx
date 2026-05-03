import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, Briefcase, FileText,
    LogOut, Search, Bell, TrendingUp, Image as ImageIcon, MessageCircle, Star
} from 'lucide-react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../utils/config';

import OverviewTab from '../components/OverviewTab';
import UsersTab from '../components/UsersTab';
import JobsTab from '../components/JobsTab';
import BidsTab from '../components/BidsTab';
import TransactionsTab from '../components/TransactionsTab';
import PortfoliosTab from '../components/PortfoliosTab';
import SupportTab from '../components/SupportTab';
import ReviewsTab from '../components/ReviewsTab';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [adminName, setAdminName] = useState('Admin');
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            navigate('/');
        }

        const adminData = localStorage.getItem('adminData');
        if (adminData) {
            try {
                const parsed = JSON.parse(adminData);
                if (parsed.name) setAdminName(parsed.name);
            } catch (e) {
                console.error('Failed to parse admin data');
            }
        }
    }, [navigate]);

    // IDEA 2: Listen for requests from other tabs to open the support chat
    useEffect(() => {
        const handleSwitchToSupport = () => {
            setActiveTab('support');
        };
        window.addEventListener('openSupportChat', handleSwitchToSupport);
        return () => window.removeEventListener('openSupportChat', handleSwitchToSupport);
    }, []);

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                if (!token) return;

                const res = await fetch(`${API_BASE_URL}/support/unread/admin?isAdmin=true`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.unreadCount !== undefined) {
                    setUnreadCount(data.unreadCount);
                }
            } catch (err) {
                console.error("Failed to fetch admin unread count", err);
            }
        };
        fetchUnread();
    }, []);

    useEffect(() => {
        const backendUrl = API_BASE_URL.replace('/api', '');
        const socket = io(backendUrl);

        socket.emit('join', { isAdmin: true });

        socket.on('receiveMessage', (msg) => {
            if (!msg.isAdmin) setUnreadCount(prev => prev + 1);
        });

        return () => socket.disconnect();
    }, []);

    useEffect(() => {
        if (activeTab === 'support') setUnreadCount(0);
    }, [activeTab]);

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        navigate('/');
    };

    const renderContent = () => {
        switch(activeTab) {
            case 'overview': return <OverviewTab />;
            case 'users': return <UsersTab />;
            case 'jobs': return <JobsTab />;
            case 'bids': return <BidsTab />;
            case 'portfolios': return <PortfoliosTab />;
            case 'transactions': return <TransactionsTab />;
            case 'reviews': return <ReviewsTab />;
            case 'support': return <SupportTab />;
            default: return <OverviewTab />;
        }
    };

    return (
        <div className="flex h-screen bg-[#F8F9FB]">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col m-4 rounded-[32px] shadow-lg overflow-hidden">
                <div className="p-6 flex items-center gap-3 border-b border-slate-800">
                    <div className="bg-emerald-500 p-2 rounded-xl shadow-inner">
                        <Briefcase size={20} className="text-white" />
                    </div>
                    <span className="text-white font-extrabold text-xl tracking-wide">HireNear</span>
                </div>

                <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
                    <NavItem icon={<LayoutDashboard />} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                    <NavItem icon={<Users />} label="Users & Workers" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                    <NavItem icon={<Briefcase />} label="Job Postings" active={activeTab === 'jobs'} onClick={() => setActiveTab('jobs')} />
                    <NavItem icon={<FileText />} label="Placed Bids" active={activeTab === 'bids'} onClick={() => setActiveTab('bids')} />
                    <NavItem icon={<ImageIcon />} label="Worker Portfolios" active={activeTab === 'portfolios'} onClick={() => setActiveTab('portfolios')} />
                    <NavItem icon={<TrendingUp />} label="Transactions" active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} />
                    <NavItem icon={<Star />} label="Reviews" active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} />

                    <NavItem
                        icon={<MessageCircle />}
                        label="Support"
                        active={activeTab === 'support'}
                        onClick={() => setActiveTab('support')}
                        badge={unreadCount}
                    />
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button onClick={handleLogout} className="flex items-center gap-3 text-slate-400 hover:text-red-400 w-full p-3 rounded-xl transition-colors font-medium group">
                        <LogOut size={20} className="group-hover:text-red-400 transition-colors" /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-24 flex items-center justify-between px-10">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 capitalize">{activeTab.replace('-', ' ')}</h1>
                        <p className="text-slate-500 font-medium text-sm">Welcome back, {adminName}</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input type="text" placeholder="Search data..." className="pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 shadow-sm w-64 transition-shadow" />
                        </div>
                        <button className="relative bg-white p-2.5 rounded-full shadow-sm border border-gray-100 text-slate-600 hover:text-emerald-500 transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="w-10 h-10 bg-emerald-100 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center font-bold text-emerald-700">
                            {adminName.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto px-10 pb-10">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}

const NavItem = ({ icon, label, active, onClick, badge }) => (
    <button onClick={onClick} className={`flex items-center gap-3 w-full p-3 rounded-2xl transition-all font-medium ${active ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
        <div className="relative">
            {icon}
            {badge > 0 && (
                <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 border-2 border-slate-900 text-[9px] font-bold text-white">
                    {badge > 9 ? '9+' : badge}
                </span>
            )}
        </div>
        {label}
    </button>
);