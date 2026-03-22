import React, { useState, useEffect } from 'react';
import { FaClock, FaCheckCircle, FaFileAlt, FaHome, FaTrash, FaTrashRestore, FaCat, FaPlusSquare, FaSearchLocation, FaCrosshairs, FaArrowLeft, FaMapMarkerAlt, FaRoute } from 'react-icons/fa';
import CitizenHeader from '@/components/citizen/CitizenHeader';
import StatCard from '@/components/citizen/StatCard';
import ActionCard from '@/components/citizen/ActionCard';
import RecentRequests from '@/components/citizen/RecentRequests';
import RegisterPickup from '@/components/citizen/RegisterPickup';
import ReportWaste from '@/components/citizen/ReportWaste';
import ReportDeadAnimal from '@/components/citizen/ReportDeadAnimal';
import RequestDustbin from '@/components/citizen/RequestDustbin';
import FindDustbins from '@/components/citizen/FindDustbins';
import TrackRequests from '@/components/citizen/TrackRequests';
import Leaderboard from '@/components/citizen/Leaderboard';

const CitizenDashboard = () => {
    const [activeView, setActiveView] = useState('dashboard');
    const [stats, setStats] = useState([
        { label: "Pending Requests", count: 0, icon: <FaClock />, iconColor: "text-red-500", bgHover: "hover:bg-red-50" },
        { label: "Completed Requests", count: 0, icon: <FaCheckCircle />, iconColor: "text-green-500", bgHover: "hover:bg-green-50" },
        { label: "Total Reports", count: 0, icon: <FaFileAlt />, iconColor: "text-yellow-500", bgHover: "hover:bg-yellow-50" }
    ]);
    const [todaySchedule, setTodaySchedule] = useState({ day: '', wards: [], byWard: {} });
    const [refreshKey, setRefreshKey] = useState(0);

    // Function to trigger refresh
    const triggerRefresh = () => {
        setRefreshKey(prev => prev + 1);
        fetchStats(); // Refresh stats immediately
    };

    useEffect(() => {
        // Clear any cached data on fresh start
        localStorage.removeItem('lastRefresh');
        fetchTodaySchedule();
    }, []);

    useEffect(() => {
        if (activeView === 'dashboard') {
            fetchStats();
        }
    }, [activeView]);

    const fetchStats = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            return;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/citizen/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setStats([
                    { label: "Pending Requests", count: data.pending, icon: <FaClock />, iconColor: "text-red-500", bgHover: "hover:bg-red-50" },
                    { label: "Completed Requests", count: data.completed, icon: <FaCheckCircle />, iconColor: "text-green-500", bgHover: "hover:bg-green-50" },
                    { label: "Total Reports", count: data.total, icon: <FaFileAlt />, iconColor: "text-yellow-500", bgHover: "hover:bg-yellow-50" }
                ]);
            }
        } catch (err) {
            console.error("Failed to fetch stats:", err);
        }
    };
    
    // Fetch today's pickup schedule
    const fetchTodaySchedule = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/citizen/today-schedule`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                console.log('[CITIZEN] Today schedule:', data);
                setTodaySchedule(data);
            }
        } catch (err) {
            console.error('[CITIZEN] Failed to fetch today schedule:', err);
        }
    };

    // Quick Actions Data
    const actions = [
        {
            title: "Register Household Waste Pickup",
            subtitle: "Schedule regular waste collection",
            icon: <FaHome />,
            iconBg: "bg-green-100",
            iconColor: "text-green-600",
            action: () => setActiveView('register-pickup')
        },
        {
            title: "Report Street Waste / Garbage Dump",
            subtitle: "Report illegal dumping",
            icon: <FaTrash />,
            iconBg: "bg-gray-200",
            iconColor: "text-gray-700",
            action: () => setActiveView('report-street-waste')
        },
        {
            title: "Report Overflowing Dustbin",
            subtitle: "Alert about full dustbins",
            icon: <FaTrashRestore />,
            iconBg: "bg-gray-200",
            iconColor: "text-gray-700",
            action: () => setActiveView('report-dustbin')
        },
        {
            title: "Report Dead Animal",
            subtitle: "Request removal service",
            icon: <FaCat />,
            iconBg: "bg-orange-100",
            iconColor: "text-orange-600",
            action: () => setActiveView('report-dead-animal')
        },
        {
            title: "Request Installation of New Public Dustbin",
            subtitle: "Suggest new dustbin locations",
            icon: <FaPlusSquare />,
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600",
            action: () => setActiveView('request-dustbin')
        },
        {
            title: "Find Nearby Dustbins",
            subtitle: "Locate closest waste bins",
            icon: <FaSearchLocation />,
            iconBg: "bg-red-100",
            iconColor: "text-red-600",
            action: () => setActiveView('find-dustbins')
        },
        {
            title: "Track My Requests",
            subtitle: "View request status",
            icon: <FaCrosshairs />,
            iconBg: "bg-green-100",
            iconColor: "text-green-600",
            action: () => setActiveView('track-requests')
        }
    ];

    const renderContent = () => {
        const handleFormSubmit = () => {
            setActiveView('dashboard');
            fetchStats(); // Refresh stats after submission
        };

        switch (activeView) {
            case 'register-pickup':
                return <RegisterPickup onBack={handleFormSubmit} />;
            case 'report-street-waste':
                return (
                    <ReportWaste
                        onBack={handleFormSubmit}
                        title="Report Street Waste"
                        subtitle="Help keep our streets clean and beautiful"
                        icon={<FaTrash />}
                        headerBg="bg-gray-200"
                        headerColor="text-gray-700"
                    />
                );
            case 'report-dustbin':
                return (
                    <ReportWaste
                        onBack={handleFormSubmit}
                        title="Report Overflowing Dustbin"
                        subtitle="Alert authorities about a full or damaged dustbin"
                        icon={<FaTrashRestore />}
                        headerBg="bg-gray-200"
                        headerColor="text-gray-700"
                    />
                );
            case 'report-dead-animal':
                return <ReportDeadAnimal onBack={handleFormSubmit} />;
            case 'request-dustbin':
                return <RequestDustbin onBack={handleFormSubmit} />;
            case 'find-dustbins':
                return <FindDustbins onBack={() => setActiveView('dashboard')} />;
            case 'track-requests':
                return <TrackRequests onBack={() => setActiveView('dashboard')} onRefresh={triggerRefresh} />;
            case 'leaderboard':
                return <Leaderboard onBack={() => setActiveView('dashboard')} />;
            default:
                return (
                    <>
                        {/* Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            {stats.map((stat, index) => (
                                <StatCard key={index} {...stat} />
                            ))}
                        </div>

                        {/* Today's Pickup Areas Card */}
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 mb-10 text-white">
                            <div className="flex items-center gap-3 mb-4">
                                <FaRoute className="text-2xl" />
                                <div>
                                    <h2 className="text-xl font-bold">Today's Pickup Areas</h2>
                                    <p className="text-blue-100 text-sm">
                                        {todaySchedule.day ? todaySchedule.day : 'Loading...'}
                                        {todaySchedule.wards && todaySchedule.wards.length > 0 && 
                                            ` - Wards ${todaySchedule.wards.join(', ')}`}
                                    </p>
                                </div>
                            </div>
                            
                            {todaySchedule.byWard && Object.keys(todaySchedule.byWard).length > 0 ? (
                                <div className="bg-white/10 rounded-lg p-4 max-h-48 overflow-y-auto">
                                    {Object.entries(todaySchedule.byWard).map(([ward, areas]) => (
                                        <div key={ward} className="mb-3 pb-2 border-b border-white/20 last:border-0">
                                            <h3 className="font-semibold text-blue-100 text-sm mb-1">Ward {ward}</h3>
                                            {areas.map((area, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-start gap-3 text-sm py-2 px-3 rounded-lg bg-white/5"
                                                >
                                                    <FaMapMarkerAlt className="text-blue-100 mt-1 text-base flex-shrink-0" />
                                                    <div className="flex flex-col leading-tight">
                                                        <span className="font-semibold text-white">{area.area_name}</span>
                                                        {area.description && (
                                                            <span className="text-blue-100 text-xs mt-0.5">{area.description}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white/10 rounded-lg p-4 text-center text-blue-100">
                                    <p>No pickups scheduled for today</p>
                                </div>
                            )}
                        </div>

                        {/* Quick Actions Section */}
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">Quick Actions</h2>
                        </div>

                        {/* Actions Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                            {actions.map((action, index) => (
                                <ActionCard 
                                    key={index} 
                                    title={action.title}
                                    subtitle={action.subtitle}
                                    icon={action.icon}
                                    iconBgColor={action.iconBg}
                                    iconColor={action.iconColor}
                                    onClick={action.action}
                                />
                            ))}
                        </div>

                        {/* Recent Requests Feed */}
                        <RecentRequests refreshKey={refreshKey} />
                    </>
                );
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-10 relative overflow-hidden">
            {/* Subtle organic background texture */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-green-100 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-yellow-50 rounded-full blur-2xl"></div>
            </div>
            
            {/* Top Navigation Bar */}
            <CitizenHeader onNavigate={(view) => setActiveView(view)} />

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 relative z-10">
                {renderContent()}
            </div>
        </div>
    );
};

export default CitizenDashboard;
