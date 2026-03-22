import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaTrophy, FaMedal, FaStar, FaLeaf, FaSpinner } from 'react-icons/fa';

const Leaderboard = ({ onBack }) => {
    const [leaders, setLeaders] = useState([]);
    const [myPoints, setMyPoints] = useState(0);
    const [myRank, setMyRank] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const [leaderRes, pointsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/citizen/leaderboard`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${import.meta.env.VITE_API_URL}/citizen/my-points`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (leaderRes.ok) {
                const data = await leaderRes.json();
                setLeaders(data.leaderboard || []);
            }
            if (pointsRes.ok) {
                const data = await pointsRes.json();
                setMyPoints(data.points);
                setMyRank(data.rank);
            }
        } catch (err) {
            console.error('Leaderboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getRankDisplay = (index) => {
        if (index === 0) return <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center"><FaTrophy className="text-white text-sm" /></div>;
        if (index === 1) return <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center"><FaMedal className="text-white text-sm" /></div>;
        if (index === 2) return <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center"><FaMedal className="text-white text-sm" /></div>;
        return <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">{index + 1}</div>;
    };

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name[0].toUpperCase();
    };

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto flex items-center justify-center py-32">
                <FaSpinner className="text-4xl text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-6 transition-all duration-300 hover:scale-105 group"
            >
                <FaArrowLeft className="mr-2 transition-transform group-hover:-translate-x-1" /> Back to Dashboard
            </button>

            {/* Header */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 mb-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <FaLeaf className="text-green-300 text-xl" />
                        <h1 className="text-2xl font-bold">Eco-Points Leaderboard</h1>
                    </div>
                    <p className="text-blue-200 text-sm mb-6">Every report counts towards a cleaner city</p>

                    {/* My Stats */}
                    <div className="flex gap-6">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4">
                            <p className="text-blue-200 text-xs font-medium mb-1">Your Points</p>
                            <p className="text-3xl font-bold">{myPoints}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4">
                            <p className="text-blue-200 text-xs font-medium mb-1">Your Rank</p>
                            <p className="text-3xl font-bold">#{myRank}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Points Info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">How to earn points</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-green-50 rounded-xl">
                        <p className="text-lg font-bold text-green-600">+5</p>
                        <p className="text-[11px] text-gray-500 mt-1">Pickup Registration</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-xl">
                        <p className="text-lg font-bold text-blue-600">+10</p>
                        <p className="text-[11px] text-gray-500 mt-1">Waste Report</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-xl">
                        <p className="text-lg font-bold text-red-600">+12</p>
                        <p className="text-[11px] text-gray-500 mt-1">Dead Animal Report</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-xl">
                        <p className="text-lg font-bold text-purple-600">+15</p>
                        <p className="text-[11px] text-gray-500 mt-1">Dustbin Request</p>
                    </div>
                </div>
            </div>

            {/* Leaderboard List */}
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                        <FaStar className="text-yellow-500" /> Top Contributors
                    </h2>
                </div>

                {leaders.length === 0 ? (
                    <div className="p-12 text-center">
                        <FaLeaf className="text-4xl text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No contributions yet. Be the first!</p>
                        <p className="text-gray-400 text-sm mt-1">Submit reports to earn points and appear here</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {leaders.map((user, index) => (
                            <div
                                key={user.id}
                                className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50 ${index < 3 ? 'bg-gradient-to-r from-yellow-50/40 to-transparent' : ''}`}
                            >
                                {/* Rank */}
                                {getRankDisplay(index)}

                                {/* Avatar */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                                    index === 0 ? 'bg-yellow-500' :
                                    index === 1 ? 'bg-gray-400' :
                                    index === 2 ? 'bg-amber-600' : 'bg-blue-500'
                                }`}>
                                    {getInitials(user.full_name)}
                                </div>

                                {/* Name */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 text-sm truncate">{user.full_name}</p>
                                    <p className="text-xs text-gray-400">{user.total_contributions} contribution{user.total_contributions !== 1 ? 's' : ''}</p>
                                </div>

                                {/* Points */}
                                <div className="text-right">
                                    <p className="font-bold text-gray-800">{user.eco_points}</p>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">points</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
