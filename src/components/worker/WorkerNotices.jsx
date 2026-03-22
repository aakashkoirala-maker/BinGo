import React, { useState, useEffect } from 'react';
import { FaBell, FaClock, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';

const WorkerNotices = ({ onBack }) => {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Authentication required');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/worker/notices`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                console.log('[WORKER_NOTICES] Fetched notices:', data.notices);
                setNotices(data.notices || []);
            } else {
                setError('Failed to load notices');
            }
        } catch (err) {
            console.error('[WORKER_NOTICES] Error:', err);
            setError('Error loading notices');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateInput) => {
        if (!dateInput) return '-';

        const tryParse = (value) => {
            const d = new Date(value);
            if (!Number.isNaN(d)) return d;
            return null;
        };

        const attempts = [
            dateInput,
            typeof dateInput === 'string' ? dateInput.replace(' GM', ' GMT') : null
        ].filter(Boolean);

        for (const attempt of attempts) {
            const parsed = tryParse(attempt);
            if (parsed) {
                return parsed.toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });
            }
        }

        return '-';
    };

    const getTypeStyles = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-700';
            case 'expired':
                return 'bg-gray-100 text-gray-700';
            default:
                return 'bg-blue-100 text-blue-700';
        }
    };

    const getIcon = (status) => {
        return status === 'active' ? <FaCheckCircle className="text-xs" /> : <FaBell className="text-xs" />;
    };

    return (
        <div className="space-y-6">
            <div>
                <button onClick={onBack} className="text-green-600 hover:underline mb-2">← Back to Dashboard</button>
                <h1 className="text-2xl font-bold text-gray-800">Updates & Notices</h1>
                <p className="text-gray-500 mt-1">Latest notices and announcements from admin</p>
            </div>

            {loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="text-green-600">Loading notices...</div>
                </div>
            ) : error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            ) : notices.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="text-gray-400 mb-4">
                        <FaBell className="text-6xl mx-auto" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-500 mb-2">No active notices</h3>
                    <p className="text-gray-400">Check back later for new notices</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {notices.map((notice) => (
                        <div 
                            key={notice.id} 
                            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-sm font-medium text-gray-500">N{String(notice.id).padStart(3, '0')}</span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeStyles(notice.status)}`}>
                                        {notice.status === 'active' ? 'Active' : notice.status}
                                    </span>
                                </div>
                                
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">{notice.title}</h3>
                                
                                {notice.description && (
                                    <p className="text-sm text-gray-600 mb-4">{notice.description}</p>
                                )}
                                
                                <div className="flex justify-between text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <FaClock className="text-xs" />
                                        <span>Created: {formatDate(notice.created_at_iso || notice.created_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {getIcon(notice.status)}
                                        <span>Expires: {formatDate(notice.expires_at_iso || notice.expires_at)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WorkerNotices;
