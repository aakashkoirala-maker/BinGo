import React, { useState, useEffect } from 'react';
import { FaCheckSquare, FaWrench, FaCheckCircle, FaTruck, FaTrash, FaRecycle, FaPaw, FaPlusCircle, FaBell } from 'react-icons/fa';

const WorkerOverview = ({ setActiveSection }) => {
    const [notices, setNotices] = useState([]);
    const [loadingNotices, setLoadingNotices] = useState(true);
    const [taskStats, setTaskStats] = useState({ assignedTasks: 0, inProgressTasks: 0, completedToday: 0 });
    const [loadingTasks, setLoadingTasks] = useState(true);

    useEffect(() => {
        fetchNotices();
        fetchTasks();
    }, []);

    const fetchNotices = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/worker/notices`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotices(data.notices || []);
            }
        } catch (err) {
            console.error('[WORKER_OVERVIEW] Error fetching notices:', err);
        } finally {
            setLoadingNotices(false);
        }
    };

    const fetchTasks = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            setLoadingTasks(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/worker/tasks`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTaskStats({
                    assignedTasks: data.assignedTasks ?? 0,
                    inProgressTasks: data.inProgressTasks ?? 0,
                    completedToday: data.completedToday ?? 0
                });
            } else {
                console.error('[WORKER_OVERVIEW] Failed to load tasks', await res.text());
                setTaskStats({ assignedTasks: 0, inProgressTasks: 0, completedToday: 0 });
            }
        } catch (err) {
            console.error('[WORKER_OVERVIEW] Error fetching tasks:', err);
            setTaskStats({ assignedTasks: 0, inProgressTasks: 0, completedToday: 0 });
        } finally {
            setLoadingTasks(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const parsed = new Date(dateString);
        if (isNaN(parsed)) {
            const fallback = new Date(String(dateString).replace(' GM', ' GMT'));
            if (isNaN(fallback)) return '-';
            return fallback.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
        }
        return parsed.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const taskCategories = [
        {
            id: 'household',
            icon: FaTruck,
            title: 'Household Pickup',
            description: 'See ward/area schedules for household waste pickups',
            color: 'bg-blue-100 text-blue-600'
        },
        {
            id: 'garbage',
            icon: FaTrash,
            title: 'Garbage & Waste',
            description: 'Manage street waste and garbage dump complaints',
            color: 'bg-orange-100 text-orange-600'
        },
        {
            id: 'dustbin-maint',
            icon: FaRecycle,
            title: 'Dustbin Maintenance',
            description: 'Clean and maintain overflowing dustbins',
            color: 'bg-green-100 text-green-600'
        },
        {
            id: 'dead-animal',
            icon: FaPaw,
            title: 'Dead Animal Pickup',
            description: 'Handle dead animal reports and rescue operations',
            color: 'bg-pink-100 text-pink-600'
        },
        {
            id: 'dustbin-install',
            icon: FaPlusCircle,
            title: 'Dustbin Installation',
            description: 'Install new public dustbins as per citizen requests',
            color: 'bg-purple-100 text-purple-600'
        }
    ];

    const stats = [
        {
            label: 'Assigned Tasks',
            count: taskStats.assignedTasks,
            subtext: 'Tasks assigned to your queue',
            icon: FaCheckSquare,
            bgColor: 'bg-green-100',
            iconColor: 'text-green-600'
        },
        {
            label: 'Tasks in Progress',
            count: taskStats.inProgressTasks,
            subtext: 'Currently being handled',
            icon: FaWrench,
            bgColor: 'bg-orange-100',
            iconColor: 'text-orange-600'
        },
        {
            label: 'Completed Today',
            count: taskStats.completedToday,
            subtext: 'Marked as completed today',
            icon: FaCheckCircle,
            bgColor: 'bg-green-100',
            iconColor: 'text-green-600'
        }
    ];

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                                <p className="text-3xl font-bold text-gray-800 mt-1">{loadingTasks ? '…' : stat.count}</p>
                                <p className="text-gray-400 text-xs mt-1">{stat.subtext}</p>
                            </div>
                            <div className={`${stat.bgColor} p-3 rounded-full`}>
                                <stat.icon className={`${stat.iconColor} text-xl`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-5">Task Categories</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {taskCategories.map((task) => (
                        <div 
                            key={task.id}
                            onClick={() => setActiveSection(task.id)}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`${task.color} p-3 rounded-lg`}>
                                    <task.icon className="text-2xl" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-800">{task.title}</h3>
                                    <p className="text-gray-500 text-sm mt-1">{task.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div 
                    onClick={() => setActiveSection('contact')}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-green-100 p-2 rounded-lg">
                            <FaCheckSquare className="text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Emergency Contacts</h3>
                    </div>
                    <div className="space-y-3">
                        <button 
                            onClick={() => setActiveSection('contact')}
                            className="w-full flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                        >
                            <span className="text-gray-700 font-medium">View Emergency Contacts</span>
                            <span className="text-green-600">→</span>
                        </button>
                    </div>
                </div>

                <div 
                    onClick={() => setActiveSection('notices')}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <FaCheckSquare className="text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Updates & Notices</h3>
                    </div>
                    <div className="space-y-3">
                        {loadingNotices ? (
                            <p className="text-gray-500 text-sm">Loading notices...</p>
                        ) : notices.length === 0 ? (
                            <p className="text-gray-500 text-sm">No active notices</p>
                        ) : (
                            notices.slice(0, 3).map((notice) => (
                                <div key={notice.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">Active</span>
                                    <div>
                                        <p className="text-gray-700 text-sm">{notice.title}</p>
                                        <p className="text-gray-400 text-xs mt-1">{formatDate(notice.created_at_iso || notice.created_at)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkerOverview;
