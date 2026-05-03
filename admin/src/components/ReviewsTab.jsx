import { useState, useEffect } from 'react';
import { Search, Trash2, Star, User, Calendar, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../utils/config';

export default function ReviewsTab() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    const fetchReviews = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/admin/reviews`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setReviews(data);
            }
        } catch (err) {
            console.error("Failed to fetch reviews", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleDelete = async (reviewId) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/admin/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setReviews(reviews.filter(r => r._id !== reviewId));
                setToast({ type: 'success', message: 'Review deleted successfully' });
                setShowDeleteConfirm(null);
            } else {
                setToast({ type: 'error', message: 'Failed to delete review' });
            }
        } catch (err) {
            console.error("Delete Review Error:", err);
            setToast({ type: 'error', message: 'Server error while deleting review' });
        } finally {
            setTimeout(() => setToast(null), 3000);
        }
    };

    const filteredReviews = reviews.filter(review =>
        review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.clientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.workerId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderStars = (rating) => {
        return (
            <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        size={14}
                        className={i < rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                    />
                ))}
            </div>
        );
    };

    if (loading) return <div className="p-8 font-medium text-slate-500 animate-pulse text-center">Loading reviews...</div>;

    return (
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 min-h-[calc(100vh-120px)] relative">
            
            {/* Success/Error Toast */}
            {toast && (
                <div className={`fixed top-8 right-8 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-lg z-50 animate-in fade-in slide-in-from-top-4 ${
                    toast.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                }`}>
                    {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span className="font-bold text-sm">{toast.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-900">Review Management</h2>
                    <p className="text-slate-500 font-medium mt-1">Monitor and manage client reviews to maintain platform quality.</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search reviews, clients or workers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 w-80 transition-colors"
                    />
                </div>
            </div>

            {/* Content Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr className="border-b-2 border-gray-100">
                            <th className="pb-4 font-bold text-slate-400 uppercase tracking-wider w-1/4">Participants</th>
                            <th className="pb-4 font-bold text-slate-400 uppercase tracking-wider w-1/6">Rating</th>
                            <th className="pb-4 font-bold text-slate-400 uppercase tracking-wider">Comment</th>
                            <th className="pb-4 font-bold text-slate-400 uppercase tracking-wider w-1/8">Date</th>
                            <th className="pb-4 font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredReviews.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="py-12 text-center text-slate-500 font-medium">
                                    <div className="flex flex-col items-center gap-2">
                                        <MessageSquare size={40} className="text-slate-200" />
                                        <p>No reviews found matching your criteria.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredReviews.map((review) => (
                                <tr key={review._id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="py-4">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-emerald-50 p-1 rounded-md">
                                                    <User size={12} className="text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-xs">Client: <span className="font-normal">{review.clientId?.name || 'Unknown'}</span></p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="bg-blue-50 p-1 rounded-md">
                                                    <User size={12} className="text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-xs">Worker: <span className="font-normal">{review.workerId?.name || 'Unknown'}</span></p>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-bold text-slate-900">{review.rating}.0</span>
                                            {renderStars(review.rating)}
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <p className="text-slate-700 font-medium leading-relaxed max-w-md line-clamp-2">
                                            {review.comment}
                                        </p>
                                        {review.images && review.images.length > 0 && (
                                            <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                                                +{review.images.length} images attached
                                            </p>
                                        )}
                                    </td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                                            <Calendar size={14} />
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="py-4 text-right">
                                        <button
                                            onClick={() => setShowDeleteConfirm(review._id)}
                                            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            title="Delete Review"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 p-8 text-center">
                        <div className="bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 mb-2">Delete Review?</h3>
                        <p className="text-slate-500 font-medium mb-8">This action cannot be undone. The review will be permanently removed and unlinked from the booking.</p>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="flex-1 py-3 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(showDeleteConfirm)}
                                className="flex-1 py-3 rounded-2xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                            >
                                Delete Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
