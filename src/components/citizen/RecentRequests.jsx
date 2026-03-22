import React, { useState, useEffect } from 'react';
import { FaTrash, FaMapMarkerAlt, FaClock, FaHome, FaCat, FaPlusSquare, FaSpinner } from 'react-icons/fa';

const RecentRequests = ({ onViewAll, refreshKey }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecent();
    }, [refreshKey]);

    const fetchRecent = async () => {
        const token = localStorage.getItem('token');
        if (!token) { setLoading(false); return; }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/citizen/recent-requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRequests(data.requests || []);
            }
        } catch (err) {
            console.error('Recent requests error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type) => {
        if (!type) return <FaTrash />;
        if (type.includes('Household') || type.includes('Pickup')) return <FaHome />;
        if (type.includes('Dead') || type.includes('Animal')) return <FaCat />;
        if (type.includes('Dustbin')) return <FaPlusSquare />;
        return <FaTrash />;
    };

    const getStatusStyle = (status) => {
        if (!status || status === '') return 'bg-red-100 text-red-500'; // Treat NULL as pending
        if (status === 'pending') return 'bg-red-100 text-red-500';
        if (status === 'in_progress') return 'bg-yellow-100 text-yellow-600';
        if (status === 'completed' || status === 'active' || status === 'approved') return 'bg-green-100 text-green-500';
        if (status === 'cancelled') return 'bg-gray-100 text-gray-500';
        return 'bg-gray-100 text-gray-500';
    };

    const formatStatus = (status) => {
        if (!status || status === '') return 'Pending';
        if (status === 'cancelled') return 'Cancelled';
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
                {onViewAll && (
                    <button
                        onClick={onViewAll}
                        className="text-blue-600 font-medium text-sm hover:underline flex items-center gap-1"
                    >
                        View All &rarr;
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-8">
                    <FaSpinner className="text-2xl text-blue-500 animate-spin" />
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">No requests yet. Start by reporting waste or registering a pickup!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {requests.map((req, i) => (
                        <div key={`${req.type}-${req.id}-${i}`} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-blue-50 text-blue-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                                    {getTypeIcon(req.type)}
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-800 text-sm">{req.type}</h4>
                                    <p className="text-gray-400 text-xs mt-0.5 truncate max-w-[200px]">{req.title}</p>
                                </div>
                            </div>

                            <div className="text-right">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(req.status)}`}>
                                    {formatStatus(req.status)}
                                </span>
                                <p className="text-gray-400 text-xs mt-1">{new Date(req.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecentRequests;
