import React, { useState, useEffect } from 'react';
import { FaTrash, FaMapMarkerAlt, FaClock, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaCompass, FaFlag, FaArrowLeft, FaImage, FaUser, FaBox } from 'react-icons/fa';

const DustbinMaintenance = ({ onBack }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [issueNote, setIssueNote] = useState('');
    const [showMapModal, setShowMapModal] = useState(false);
    const [mapLocation, setMapLocation] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/worker/dustbin-maintenance-requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                console.log('[WORKER] Dustbin maintenance requests:', data);
                setRequests(data.requests || []);
            } else {
                setError('Failed to load requests');
            }
        } catch (err) {
            console.error('[WORKER] Error fetching requests:', err);
            setError('Error loading requests');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkResolved = async (requestId) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/worker/dustbin-requests/${requestId}`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'completed' })
            });

            if (res.ok) {
                setRequests(requests.map(r => 
                    r.id === requestId ? { ...r, status: 'completed' } : r
                ));
                alert('Request marked as resolved!');
            } else {
                alert('Failed to update request');
            }
        } catch (err) {
            console.error('[WORKER] Error resolving request:', err);
            alert('Error updating request');
        }
    };

    const handleReportIssue = async (requestId) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/worker/dustbin-requests/${requestId}`, {
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
                setRequests(requests.map(r => 
                    r.id === requestId ? { ...r, status: 'cancelled', worker_note: issueNote } : r
                ));
                setShowIssueModal(false);
                setIssueNote('');
                setSelectedRequest(null);
                alert('Issue reported and request cancelled!');
            } else {
                alert('Failed to report issue');
            }
        } catch (err) {
            console.error('[WORKER] Error reporting issue:', err);
            alert('Error reporting issue');
        }
    };

    const handleNavigate = (request) => {
        if (request.latitude && request.longitude) {
            setMapLocation({ lat: request.latitude, lng: request.longitude });
            setShowMapModal(true);
        } else {
            alert('Location not available for this request');
        }
    };

    const openIssueModal = (request) => {
        setSelectedRequest(request);
        setShowIssueModal(true);
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

    const getStatusBadge = (status) => {
        const statusMap = {
            'pending': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
            'in_progress': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
            'approved': { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
            'completed': { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
            'cancelled': { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
            'rejected': { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' }
        };
        const s = statusMap[status] || statusMap.pending;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
                {s.label}
            </span>
        );
    };

    const pendingCount = requests.filter(r => r.status === 'pending' || r.status === 'approved').length;
    const completedCount = requests.filter(r => r.status === 'completed').length;
    const cancelledCount = requests.filter(r => r.status === 'cancelled' || r.status === 'rejected').length;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-green-600 text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* Header */}
            <div className="mb-6">
                <button 
                    onClick={onBack}
                    className="flex items-center gap-2 text-green-600 hover:text-green-700 mb-2"
                >
                    <FaArrowLeft /> Back
                </button>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dustbin Maintenance</h1>
                <p className="text-gray-600">Handle overflowing dustbin reports from citizens.</p>
            </div>

            {/* Stats Banner */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 mb-6 text-white">
                <h2 className="text-lg font-semibold mb-2">Dustbin Maintenance Requests</h2>
                <div className="flex gap-4 text-sm">
                    <span>{pendingCount} pending</span>
                    <span>{completedCount} completed</span>
                    <span>{cancelledCount} cancelled</span>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Requests List */}
            {requests.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center">
                    <FaBox className="text-gray-300 text-6xl mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Requests Found</h3>
                    <p className="text-gray-500">There are no dustbin maintenance requests at the moment.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {requests.map((request) => (
                        <div key={request.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                {/* Left: Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FaUser className="text-green-600" />
                                        <span className="font-medium text-gray-800">{request.citizen_name || 'Unknown Citizen'}</span>
                                        {getStatusBadge(request.status)}
                                    </div>
                                    
                                    <div className="space-y-1 text-sm text-gray-600 mb-2">
                                        <p><strong>Type:</strong> Overflowing Dustbin Report</p>
                                        <p><strong>Area Type:</strong> {request.area_type || '-'}</p>
                                        <p><strong>Reason:</strong> {request.reason ? request.reason.replace('Overflowing dustbin report:', '').trim() : '-'}</p>
                                        <p className="flex items-center gap-1">
                                            <FaMapMarkerAlt className="text-green-600" />
                                            <span>Lat: {request.latitude || '-'}, Lng: {request.longitude || '-'}</span>
                                        </p>
                                        <p className="flex items-center gap-1">
                                            <FaClock className="text-green-600" />
                                            <span>{formatDate(request.created_at)}</span>
                                        </p>
                                    </div>

                                    {request.worker_note && (
                                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                                            <strong>Worker Note:</strong> {request.worker_note}
                                        </div>
                                    )}
                                </div>

                                {/* Right: Actions */}
                                <div className="flex flex-wrap gap-2">
                                    {request.status !== 'completed' && request.status !== 'cancelled' && request.status !== 'rejected' && (
                                        <>
                                            <button 
                                                onClick={() => handleMarkResolved(request.id)}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                <FaCheckCircle /> Mark Resolved
                                            </button>
                                            <button 
                                                onClick={() => handleNavigate(request)}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                <FaCompass /> Navigate
                                            </button>
                                            <button 
                                                onClick={() => openIssueModal(request)}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                                            >
                                                <FaFlag /> Report Issue
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Issue Modal */}
            {showIssueModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Report Issue</h3>
                        <p className="text-gray-600 mb-4">Describe the issue with this request:</p>
                        <textarea
                            value={issueNote}
                            onChange={(e) => setIssueNote(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg mb-4 h-32 resize-none"
                            placeholder="Enter issue details..."
                        />
                        <div className="flex gap-2 justify-end">
                            <button 
                                onClick={() => { setShowIssueModal(false); setIssueNote(''); setSelectedRequest(null); }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => handleReportIssue(selectedRequest.id)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                disabled={!issueNote.trim()}
                            >
                                Submit Issue
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Map Modal */}
            {showMapModal && mapLocation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg">
                        <h3 className="text-xl font-bold mb-4">Location Map</h3>
                        <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center mb-4">
                            <div className="text-center">
                                <FaMapMarkerAlt className="text-green-600 text-4xl mx-auto mb-2" />
                                <p className="text-gray-600">Lat: {mapLocation.lat}, Lng: {mapLocation.lng}</p>
                                <a 
                                    href={`https://www.openstreetmap.org/?mlat=${mapLocation.lat}&mlon=${mapLocation.lng}#map=15/${mapLocation.lat}/${mapLocation.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline block mt-2"
                                >
                                    Open in OpenStreetMap
                                </a>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button 
                                onClick={() => { setShowMapModal(false); setMapLocation(null); }}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DustbinMaintenance;
