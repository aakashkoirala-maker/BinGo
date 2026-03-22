import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEllipsisV, FaSignOutAlt, FaTrophy, FaUser } from 'react-icons/fa';
import WorkerOverview from '@/components/worker/WorkerOverview';
import { renderWorkerSection } from '@/components/worker/workerRoutes';

const WorkerDashboard = () => {
    const [activeSection, setActiveSection] = useState('overview');
    const [showMenu, setShowMenu] = useState(false);
    const navigate = useNavigate();
    
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.role || user.role !== 'worker') {
            navigate('/');
        }
    }, [navigate]);
    
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };
    
    const handleBack = () => {
        setActiveSection('overview');
    };
    
    const renderContent = () => {
        if (activeSection === 'overview') {
            return <WorkerOverview setActiveSection={setActiveSection} />;
        }
        return renderWorkerSection(activeSection, handleBack);
    };
    
    return (
        <div className="min-h-screen bg-gray-50 w-full">
            {/* Header Bar - matched density and width to citizen */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 sm:px-8 md:px-10 lg:px-12 py-6 shadow-md">
                <div className="w-full max-w-screen-2xl mx-auto flex items-center justify-between gap-4 relative">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                            <FaUser className="text-white text-lg" />
                        </div>
                        <div className="leading-tight">
                            <h1 className="text-white text-2xl font-bold">Welcome, Worker</h1>
                            <p className="text-green-100 text-sm mt-1">Your tasks and daily updates at a glance</p>
                        </div>
                    </div>

                    {/* Three-dot Menu pinned to top-right */}
                    <div className="relative self-start pt-1">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 rounded-full hover:bg-white/15 transition-colors"
                            aria-label="Open menu"
                        >
                            <FaEllipsisV className="text-white text-lg" />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                <button
                                    onClick={() => { navigate('/worker-leaderboard'); setShowMenu(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
                                >
                                    <FaTrophy className="text-green-600" />
                                    <span>Leaderboard</span>
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
            </div>

            {/* Content area with generous breathing room and reduced side gaps */}
            <div className="px-4 sm:px-8 md:px-10 lg:px-12 py-10 w-full max-w-screen-2xl mx-auto">
                {renderContent()}
            </div>
        </div>
    );
};

export default WorkerDashboard;
