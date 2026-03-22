import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaSearch, FaFilter, FaClock, FaCheckCircle, FaSpinner, FaTimesCircle, FaTrash, FaHome, FaCat, FaPlusSquare, FaMapMarkerAlt, FaInfoCircle } from 'react-icons/fa';
import CustomModal from '@/components/citizen/CustomModal';

const TrackRequests = ({ onBack, onRefresh }) => {
    const [activeTab, setActiveTab] = useState('All');
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: null,
        isReactNode: false
    });

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('You must be logged in');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/citizen/requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setRequests(data.requests || []);
            } else {
                setError('Failed to fetch requests');
            }
        } catch (err) {
            setError('Server error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'All', label: 'All', count: requests.length },
        { id: 'pending', label: 'Pending', count: requests.filter(r => (r.status === 'pending' || !r.status)).length },
        { id: 'in_progress', label: 'In Progress', count: requests.filter(r => r.status === 'in_progress').length },
        { id: 'completed', label: 'Completed', count: requests.filter(r => r.status === 'completed').length },
        { id: 'cancelled', label: 'Cancelled', count: requests.filter(r => r.status === 'cancelled').length }
    ];

    const getStatusStyle = (status) => {
        // Treat NULL/empty status as pending
        if (!status || status === '') return 'bg-red-100 text-red-600';
        switch (status) {
            case 'pending': return 'bg-red-100 text-red-600';
            case 'in_progress': return 'bg-yellow-100 text-yellow-700';
            case 'completed': return 'bg-green-100 text-green-600';
            case 'approved': return 'bg-blue-100 text-blue-600';
            case 'active': return 'bg-green-100 text-green-600';
            case 'cancelled': return 'bg-gray-100 text-gray-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusIcon = (status) => {
        // Treat NULL/empty status as pending
        if (!status || status === '') return <FaClock />;
        switch (status) {
            case 'pending': return <FaClock />;
            case 'in_progress': return <FaSpinner className="animate-spin" />;
            case 'completed': return <FaCheckCircle />;
            case 'approved': return <FaCheckCircle />;
            case 'active': return <FaCheckCircle />;
            case 'cancelled': return <FaTimesCircle />;
            default: return <FaClock />;
        }
    };

    const getTypeIcon = (type) => {
        if (type.includes('Household')) return <FaHome />;
        if (type.includes('Dustbin') || type.includes('Overflowing')) return <FaPlusSquare />;
        if (type.includes('Dead') || type.includes('Animal')) return <FaCat />;
        return <FaTrash />;
    };

    const showModal = (title, message, type = 'info', onConfirm = null) => {
        setModal({
            isOpen: true,
            title,
            message: typeof message === 'string' ? message : message,
            type,
            onConfirm,
            isReactNode: typeof message !== 'string'
        });
    };

    const closeModal = () => {
        setModal({
            isOpen: false,
            title: '',
            message: '',
            type: 'info',
            onConfirm: null
        });
    };

    const viewRequestDetails = (request) => {
        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };
        
        // Get fresh status for this specific request
        const getFreshStatus = async () => {
            const token = localStorage.getItem('token');
            if (!token) return request.status;
            
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/citizen/requests`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const freshRequest = data.requests.find(r => r.id === request.id && r.type === request.type);
                    return freshRequest ? freshRequest.status : request.status;
                }
            } catch (error) {
                console.error('Error fetching fresh status:', error);
            }
            return request.status;
        };
        
        getFreshStatus().then(freshStatus => {
            const displayStatus = freshStatus || 'pending';
            
            const details = (
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-start border-b pb-2">
                        <span className="font-semibold text-gray-700">Request ID:</span>
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-blue-600">#{request.id}</span>
                    </div>
                    
                    <div className="flex justify-between items-start">
                        <span className="font-semibold text-gray-700">Type:</span>
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                            {request.type}
                        </span>
                    </div>
                    
                    <div className="flex justify-between items-start">
                        <span className="font-semibold text-gray-700">Title:</span>
                        <span className="text-gray-600 text-right max-w-[60%]">{request.title}</span>
                    </div>
                    
                    <div className="flex justify-between items-start">
                        <span className="font-semibold text-gray-700">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusStyle(displayStatus)}`}>
                            {getStatusIcon(displayStatus)}
                            <span className="ml-1">{displayStatus.replace('_', ' ')}</span>
                        </span>
                    </div>
                    
                    <div className="flex justify-between items-start border-t pt-2">
                        <span className="font-semibold text-gray-700">Submitted:</span>
                        <span className="text-gray-600 text-right">{formatDate(request.created_at)}</span>
                    </div>
                    
                    <div className="flex justify-between items-start">
                        <span className="font-semibold text-gray-700">Location:</span>
                        <span className="text-gray-600 text-right max-w-[60%]">{request.location}</span>
                    </div>
                </div>
            );
            
            showModal('Request Details', details, 'info');
        });
    };

    const cancelRequest = async (request) => {
        const requestId = request.id;
        
        const requestType = request.req_type || 'street_waste_report';
        showModal(
            'Cancel Request',
            'Are you sure you want to cancel this request?',
            'confirm',
            async () => {
                closeModal();
                
                const token = localStorage.getItem('token');
                if (!token) {
                    showModal('Error', 'You must be logged in', 'error');
                    return;
                }

                try {
                    // Call API to cancel the request with type information
                    const res = await fetch(`${import.meta.env.VITE_API_URL}/citizen/requests/${requestId}/cancel?type=${requestType}`, {
                        method: 'PUT',
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (res.ok) {
                        showModal('Success', 'Request cancelled successfully!', 'success');
                        // Force refresh all data immediately after successful cancellation
                        fetchRequests();
                        if (onRefresh) onRefresh(); // Trigger dashboard refresh
                    } else {
                        const errorData = await res.json();
                        showModal('Error', errorData.message || 'Failed to cancel request', 'error');
                    }
                } catch (error) {
                    console.error('Error cancelling request:', error);
                    showModal('Error', 'Failed to cancel request. Please try again.', 'error');
                }
            }
        );
    };

    const filteredRequests = activeTab === 'All' ? requests : requests.filter(r => {
        // Handle NULL status as 'pending' for filtering
        const requestStatus = r.status || 'pending';
        return requestStatus === activeTab;
    });

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto min-h-screen flex items-center justify-center">
                <FaSpinner className="text-4xl text-blue-600 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 text-lg">{error}</p>
                    <button onClick={fetchRequests} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto min-h-screen pb-10">
            {/* Header - Blue Theme */}
            <div className="mb-8">
                <button
                    onClick={onBack}
                    className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-4 transition-all duration-300 hover:scale-105 group"
                >
                    <FaArrowLeft className="mr-2 transition-transform group-hover:-translate-x-1" /> Back to Dashboard
                </button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-200">
                            <FaSearch className="text-2xl" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Track My Requests</h1>
                            <p className="text-gray-500 mt-1">View and monitor all your submitted requests</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-4 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2
                            ${activeTab === tab.id
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                            }`}
                    >
                        {tab.label}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] 
                            ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Custom Modal */}
            <CustomModal
                isOpen={modal.isOpen}
                onClose={closeModal}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                onConfirm={modal.onConfirm}
                confirmText="Yes, Cancel Request"
                cancelText="No, Keep Request"
                isReactNode={modal.isReactNode}
            />

            {/* Requests List */}
            <div className="space-y-4">
                {filteredRequests.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No requests found in this category</p>
                    </div>
                ) : (
                    filteredRequests.map((req, index) => (
                        <div key={`${req.id}-${req.type}`} className="bg-white rounded-3xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Icon Sidebar */}
                                <div className="flex flex-col items-center gap-2 relative">
                                    <div className={`w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl`}>
                                        {getStatusIcon(req.status)}
                                    </div>
                                    <div className="h-full w-0.5 bg-gray-100 rounded-full hidden md:block"></div>
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex flex-col sm:flex-row justify-between mb-2">
                                        <h3 className="text-lg font-bold text-gray-800">{req.type || req.title}</h3>
                                        <span className={`w-fit px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusStyle(req.status)}`}>
                                            {req.status}
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-600 mb-4">{req.title}</p>

                                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <FaClock /> {new Date(req.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {getTypeIcon(req.type)} {req.type}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <FaMapMarkerAlt /> {req.location}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-blue-500">
                                            # {req.id}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-6 flex gap-3">
                                        <button 
                                            onClick={() => viewRequestDetails(req)}
                                            className="px-4 py-2 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-all duration-200 hover:scale-105 hover:shadow-sm flex items-center gap-1 group"
                                        >
                                            <FaInfoCircle className="group-hover:scale-110 transition-transform" size={12} />
                                            View Details
                                        </button>
                                        {(req.status === 'pending' || !req.status) && (
                                            <button 
                                                onClick={() => cancelRequest(req)}
                                                className="px-4 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-all duration-200 hover:scale-105 hover:shadow-sm flex items-center gap-1 group"
                                            >
                                                <FaTimesCircle className="group-hover:scale-110 transition-transform" size={12} />
                                                Cancel Request
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TrackRequests;
