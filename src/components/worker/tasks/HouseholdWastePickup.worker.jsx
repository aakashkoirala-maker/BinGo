import React, { useState, useEffect } from 'react';
import { FaRoute, FaMapMarkerAlt, FaUsers, FaCalendarAlt, FaHome, FaArrowLeft } from 'react-icons/fa';

const HouseholdWastePickup = ({ onBack }) => {
    const [scheduleData, setScheduleData] = useState({ byDay: {}, totalWards: 0, totalAreas: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchScheduleData();
    }, []);

    const fetchScheduleData = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/worker/household-pickups`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                console.log('[WORKER] Household pickups:', data);
                setScheduleData(data);
            } else {
                setError('Failed to load schedule data');
            }
        } catch (err) {
            console.error('[WORKER] Error fetching household pickups:', err);
            setError('Error loading schedule data');
        } finally {
            setLoading(false);
        }
    };

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <button onClick={onBack} className="text-green-600 hover:underline mb-2 flex items-center gap-2">
                            <FaArrowLeft /> Back to Dashboard
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800">Household Waste Pickup</h1>
                    </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <button onClick={onBack} className="text-green-600 hover:underline mb-2 flex items-center gap-2">
                        <FaArrowLeft /> Back to Dashboard
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">Household Waste Pickup Schedule</h1>
                    <p className="text-gray-500 mt-1">View complete pickup schedule for all wards and areas</p>
                </div>
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <FaRoute className="text-2xl" />
                    <div>
                        <h2 className="text-xl font-bold">Weekly Schedule Overview</h2>
                        <p className="text-green-100 text-sm">
                            {scheduleData.totalWards} wards scheduled • {scheduleData.totalAreas} areas defined
                        </p>
                    </div>
                </div>
            </div>

            {/* Schedule by Day */}
            <div className="space-y-4">
                {days.map(day => {
                    const dayData = scheduleData.byDay[day] || [];
                    const hasWards = dayData.length > 0;
                    
                    return (
                        <div key={day} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Day Header */}
                            <div className="bg-green-50 border-b border-green-100 px-6 py-3 flex items-center gap-3">
                                <FaCalendarAlt className="text-green-600" />
                                <h3 className="font-semibold text-gray-800">{day}</h3>
                                {hasWards && (
                                    <span className="ml-auto bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                                        {dayData.length} ward(s)
                                    </span>
                                )}
                            </div>
                            
                            {/* Day Content */}
                            <div className="p-4">
                                {hasWards ? (
                                    <div className="space-y-3">
                                        {dayData.map((ward, idx) => (
                                            <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <FaHome className="text-green-600" />
                                                    <h4 className="font-semibold text-gray-800">Ward {ward.ward_number}</h4>
                                                </div>
                                                
                                                {ward.areas && ward.areas.length > 0 ? (
                                                    <div className="space-y-2 pl-6">
                                                        {ward.areas.map((area, areaIdx) => (
                                                            <div key={areaIdx} className="bg-gray-50 rounded-lg p-3 flex items-start gap-3">
                                                                <FaMapMarkerAlt className="text-green-500 mt-1 flex-shrink-0" />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="font-medium text-gray-800">{area.area_name}</span>
                                                                    </div>
                                                                    {area.description && area.description !== '-' && (
                                                                        <p className="text-gray-500 text-sm mt-1">{area.description}</p>
                                                                    )}
                                                                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                                                                        <FaUsers className="text-gray-400" />
                                                                        <span>Assigned: {area.assigned_workers}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-400 text-sm pl-6">No areas defined for this ward</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-center py-4">No pickups scheduled for {day}</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {scheduleData.totalWards === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <FaRoute className="text-4xl text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Schedule Data</h3>
                    <p className="text-gray-500">The admin hasn't set up the household waste pickup schedule yet.</p>
                </div>
            )}
        </div>
    );
};

export default HouseholdWastePickup;
