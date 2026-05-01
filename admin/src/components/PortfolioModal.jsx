import { useState } from 'react';
import { X, Image as ImageIcon, Trash2, Maximize2 } from 'lucide-react';
import { API_BASE_URL } from '../utils/config';

export default function PortfolioModal({ worker, items, onClose, onUpdate }) {
    const [fullscreenImage, setFullscreenImage] = useState(null);

    const handleDelete = async (itemId) => {
        if (!window.confirm('Are you sure you want to delete this portfolio item?')) return;
        
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/admin/portfolios/${itemId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                if (onUpdate) onUpdate();
                if (items.length <= 1) {
                    onClose(); // Close modal if last item deleted
                }
            } else {
                alert('Failed to delete portfolio');
            }
        } catch (err) {
            console.error("Failed to delete portfolio", err);
        }
    };

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-[#F8F9FB] rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 bg-white border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600">
                            <ImageIcon size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-2xl text-slate-900">{worker?.name}'s Portfolio</h3>
                            <p className="text-sm font-medium text-slate-500">{items.length} Project{items.length !== 1 && 's'} Showcase</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                    {items.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 font-medium">No portfolio items found.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {items.map(item => (
                                <div key={item._id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative group">
                                    <button 
                                        onClick={() => handleDelete(item._id)}
                                        className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                                        title="Delete Portfolio Item"
                                    >
                                        <Trash2 size={16} />
                                    </button>

                                    <div className="flex justify-between items-start mb-2 pr-8">
                                        <h4 className="font-bold text-lg text-slate-900">{item.title}</h4>
                                        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-5 leading-relaxed">{item.description}</p>
                                    
                                    {item.images && item.images.length > 0 && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {item.images.map((img, i) => (
                                                <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-gray-50 relative group/img">
                                                    <img src={img} alt={item.title} className="w-full h-full object-cover" />
                                                    <button 
                                                        onClick={() => setFullscreenImage(img)}
                                                        className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                    >
                                                        <Maximize2 size={24} className="text-white" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Fullscreen Image Overlay */}
            {fullscreenImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setFullscreenImage(null)}>
                    <button 
                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        onClick={() => setFullscreenImage(null)}
                    >
                        <X size={24} />
                    </button>
                    <img src={fullscreenImage} alt="Fullscreen View" className="max-w-full max-h-full object-contain rounded-lg" />
                </div>
            )}
        </div>
    );
}
