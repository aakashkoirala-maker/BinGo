import React, { useState, useEffect } from 'react';
import { FaTrash, FaMapMarkerAlt, FaClock, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaCompass, FaFlag, FaArrowLeft, FaImage, FaUser } from 'react-icons/fa';

const GarbageWastePickup = ({ onBack }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [issueNote, setIssueNote] = useState('');
    const [showMapModal, setShowMapModal] = useState(false);
    const [mapLocation, setMapLocation] = useState(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/worker/street-waste-reports`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                console.log('[WORKER] Street waste reports:', data);
                setReports(data.reports || []);
            } else {
                setError('Failed to load reports');
            }
        } catch (err) {
            console.error('[WORKER] Error fetching reports:', err);
            setError('Error loading reports');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkResolved = async (reportId) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/worker/street-waste-reports/${reportId}`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'completed' })
            });

            if (res.ok) {
                // Update local state
                setReports(reports.map(r => 
                    r.id === reportId ? { ...r, status: 'completed' } : r
                ));
                alert('Report marked as resolved!');
            } else {
                alert('Failed to update report');
            }
        } catch (err) {
            console.error('[WORKER] Error resolving report:', err);
            alert('Error updating report');
        }
    };

    const handleReportIssue = async (reportId) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/worker/street-waste-reports/${reportId}`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    status: 'cancelled',
                    worker_note: issueNote 
                })
            });

            if (res.ok) {
                setReports(reports.map(r => 
                    r.id === reportId ? { ...r, status: 'cancelled', worker_note: issueNote } : r
                ));
                setShowIssueModal(false);
                setIssueNote('');
                setSelectedReport(null);
                alert('Issue reported and report cancelled!');
            } else {
                alert('Failed to report issue');
            }
        } catch (err) {
            console.error('[WORKER] Error reporting issue:', err);
            alert('Error reporting issue');
        }
    };

    const handleNavigate = (report) => {
        if (report.latitude && report.longitude) {
            setMapLocation({ lat: report.latitude, lng: report.longitude });
            setShowMapModal(true);
        } else {
            alert('No location data available for this report');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'in_progress': return 'bg-orange-100 text-orange-700';
            case 'completed': return 'bg-green-100 text-green-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
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
                    <h1 className="text-2xl font-bold text-gray-800">Garbage & Waste Management</h1>
                    <p className="text-gray-500 mt-1">Handle street waste reports from citizens</p>
                </div>
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center gap-3">
                    <FaTrash className="text-2xl" />
                    <div>
                        <h2 className="text-xl font-bold">Street Waste Reports</h2>
                        <p className="text-green-100 text-sm">
                            {reports.filter(r => r.status === 'pending').length} pending • 
                            {reports.filter(r => r.status === 'in_progress').length} in progress • 
                            {reports.filter(r => r.status === 'completed').length} completed
                        </p>
                    </div>
                </div>
            </div>

            {/* Reports List */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                {reports.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <FaTrash className="text-4xl text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Reports Found</h3>
                        <p className="text-gray-500">There are no street waste reports at the moment.</p>
                    </div>
                ) : (
                    reports.map((report) => (
                        <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-orange-100 p-2 rounded-lg">
                                            <FaTrash className="text-orange-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800">{report.waste_type || 'Street Waste'}</h3>
                                            <p className="text-gray-600 text-sm mt-1">{report.description}</p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <FaUser className="text-xs" /> {report.citizen_name || 'Anonymous'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <FaClock className="text-xs" /> {formatDate(report.created_at)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <FaMapMarkerAlt className="text-xs" /> 
                                                    {report.latitude && report.longitude ? 
                                                        `${report.latitude}, ${report.longitude}` : 'No location'}
                                                </span>
                                            </div>
                                            {report.worker_note && (
                                                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                                                    <strong>Note:</strong> {report.worker_note}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(report.status)}`}>
                                        {report.status === 'in_progress' ? 'In Progress' : 
                                         report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                    </span>
                                </div>

                                {/* Image */}
                                {report.image_url && (
                                    <div className="mt-3">
                                        <img 
                                            src={report.image_url} 
                                            alt="Waste report" 
                                            className="max-w-xs max-h-48 rounded-lg border border-gray-200"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="bg-gray-50 px-4 py-3 flex flex-wrap gap-2">
                                {report.status === 'in_progress' && (
                                    <>
                                        <button 
                                            onClick={() => handleMarkResolved(report.id)}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            <FaCheckCircle /> Mark Resolved
                                        </button>
                                        <button 
                                            onClick={() => handleNavigate(report)}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            <FaCompass /> Navigate
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setSelectedReport(report);
                                                setShowIssueModal(true);
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition-colors"
                                        >
                                            <FaFlag /> Report Issue
                                        </button>
                                    </>
                                )}
                                {report.status === 'completed' && (
                                    <span className="text-green-600 text-sm flex items-center gap-1">
                                        <FaCheckCircle /> Resolved
                                    </span>
                                )}
                                {report.status === 'cancelled' && (
                                    <span className="text-red-600 text-sm flex items-center gap-1">
                                        <FaTimesCircle /> Cancelled
                                    </span>
                                )}
                                {report.status !== 'in_progress' && !['completed', 'cancelled'].includes(report.status) && (
                                    <span className="text-gray-500 text-sm">No actions available for this status</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Report Issue Modal */}
            {showIssueModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <FaFlag className="text-red-500" /> Report Issue
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Please provide a reason for cancelling this report (e.g., "No waste found at location", "Invalid report")
                        </p>
                        <textarea
                            value={issueNote}
                            onChange={(e) => setIssueNote(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg mb-4"
                            rows="4"
                            placeholder="Describe the issue..."
                            required
                        />
                        <div className="flex gap-3">
                            <button 
                                onClick={() => {
                                    setShowIssueModal(false);
                                    setIssueNote('');
                                    setSelectedReport(null);
                                }}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => handleReportIssue(selectedReport.id)}
                                disabled={!issueNote.trim()}
                                className={`flex-1 px-4 py-2 rounded-lg text-white ${
                                    issueNote.trim() ? 'bg-red-600 hover:bg-red-700' : 'bg-red-300 cursor-not-allowed'
                                }`}
                            >
                                Submit Issue
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Map Modal */}
            {showMapModal && mapLocation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <FaMapMarkerAlt className="text-green-600" /> Location Map
                            </h3>
                            <button 
                                onClick={() => setShowMapModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FaTimesCircle className="text-xl" />
                            </button>
                        </div>
                        <div className="bg-gray-100 rounded-lg h-80 flex items-center justify-center">
                            <div className="text-center">
                                <FaMapMarkerAlt className="text-4xl text-green-600 mx-auto mb-2" />
                                <p className="text-gray-600 font-medium">Coordinates</p>
                                <p className="text-gray-500">
                                    Latitude: {mapLocation.lat}<br/>
                                    Longitude: {mapLocation.lng}
                                </p>
                                <a 
                                    href={`https://www.openstreetmap.org/?mlat=${mapLocation.lat}&mlon=${mapLocation.lng}#map=15/${mapLocation.lat}/${mapLocation.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    Open in Maps
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GarbageWastePickup;
