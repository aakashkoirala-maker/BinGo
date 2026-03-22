import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaTrophy, FaEllipsisV, FaSignOutAlt, FaUser } from 'react-icons/fa';

const WorkerLeaderboard = () => {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.role || user.role !== 'worker') {
            navigate('/');
            return;
        }
        fetchLeaderboard();
    }, [navigate]);

    const fetchLeaderboard = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/worker/leaderboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setLeaders(data.leaderboard || []);
            }
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const getRankStyle = (index) => {
        if (index === 0) return 'bg-yellow-500';
        if (index === 1) return 'bg-gray-400';
        if (index === 2) return 'bg-amber-600';
        return 'bg-blue-500';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Bar */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/worker-dashboard')}
                        className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                        <FaArrowLeft className="text-white text-lg" />
                    </button>
                    <div>
                        <h1 className="text-white text-xl font-bold">Leaderboard</h1>
                        <p className="text-green-100 text-sm">Citizen rankings by eco-points</p>
                    </div>
                </div>
                
                {/* Three-dot Menu */}
                <div className="relative">
                    <button 
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <FaEllipsisV className="text-white text-lg" />
                    </button>
                    
                    {showMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                            <button 
                                onClick={() => { navigate('/worker-dashboard'); setShowMenu(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
                            >
                                <FaUser className="text-green-600" />
                                <span>Worker Dashboard</span>
                            </button>
                            <button 
                                onClick={() => { handleLogout(); setShowMenu(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50"
                            >
                                <FaSignOutAlt />
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Leaderboard Content */}
            <div className="p-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="bg-yellow-100 p-3 rounded-full">
                                <FaTrophy className="text-yellow-600 text-2xl" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Top Citizens</h2>
                                <p className="text-gray-500 text-sm">Rankings by eco-points</p>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
                            <p className="text-gray-500 mt-4">Loading leaderboard...</p>
                        </div>
                    ) : leaders.length === 0 ? (
                        <div className="p-12 text-center">
                            <FaTrophy className="text-gray-300 text-6xl mx-auto mb-4" />
                            <p className="text-gray-500">No ranked citizens yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {leaders.map((user, index) => (
                                <div 
                                    key={user.id} 
                                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${getRankStyle(index)}`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800 truncate">{user.full_name}</p>
                                        <p className="text-xs text-gray-400">{user.total_contributions || 0} contributions</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-green-600">{user.eco_points}</p>
                                        <p className="text-xs text-gray-400 uppercase">points</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkerLeaderboard;
