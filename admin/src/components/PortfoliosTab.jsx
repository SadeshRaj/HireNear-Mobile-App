import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/config';
import PortfolioModal from './PortfolioModal';
import { Briefcase, Image as ImageIcon } from 'lucide-react';

export default function PortfoliosTab() {
    const [groupedPortfolios, setGroupedPortfolios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedWorker, setSelectedWorker] = useState(null);

    const fetchPortfolios = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/admin/portfolios`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                // Group by worker
                const grouped = data.reduce((acc, item) => {
                    const workerId = item.workerId?._id;
                    if (!workerId) return acc;
                    
                    if (!acc[workerId]) {
                        acc[workerId] = {
                            worker: item.workerId,
                            items: []
                        };
                    }
                    acc[workerId].items.push(item);
                    return acc;
                }, {});
                
                setGroupedPortfolios(Object.values(grouped));
            }
        } catch (err) {
            console.error("Failed to fetch portfolios", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPortfolios();
    }, []);

    if (loading) return <div className="p-8 font-medium text-slate-500 animate-pulse">Loading portfolios...</div>;

    return (
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Worker Portfolios Directory</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedPortfolios.map((group, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => setSelectedWorker(group)}
                        className="border border-gray-100 rounded-3xl p-6 bg-white hover:bg-slate-50 cursor-pointer hover:shadow-md transition-all duration-300 group"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <img 
                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${group.worker?.name}`} 
                                alt={group.worker?.name} 
                                className="w-14 h-14 rounded-full border-2 border-emerald-100 group-hover:border-emerald-300 transition-colors"
                            />
                            <div>
                                <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-emerald-600 transition-colors">{group.worker?.name}</h3>
                                <p className="text-sm font-medium text-slate-500">{group.worker?.email}</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-4 border-t border-gray-50 pt-4">
                            <div className="flex items-center gap-2 text-slate-600 text-sm font-bold bg-slate-100 px-3 py-1.5 rounded-xl">
                                <Briefcase size={16} className="text-blue-500" />
                                {group.items.length} Project{group.items.length !== 1 && 's'}
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 text-sm font-bold bg-slate-100 px-3 py-1.5 rounded-xl">
                                <ImageIcon size={16} className="text-amber-500" />
                                {group.items.reduce((total, item) => total + (item.images?.length || 0), 0)} Photos
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {groupedPortfolios.length === 0 && (
                <div className="text-center py-10 text-slate-500 font-medium bg-gray-50 rounded-2xl">
                    No worker portfolios found.
                </div>
            )}

            {selectedWorker && (
                <PortfolioModal 
                    worker={selectedWorker.worker} 
                    items={selectedWorker.items} 
                    onClose={() => setSelectedWorker(null)}
                    onUpdate={() => {
                        fetchPortfolios();
                        setSelectedWorker(null);
                    }}
                />
            )}
        </div>
    );
}
