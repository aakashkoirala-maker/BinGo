import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaEye, FaTimes } from 'react-icons/fa';
import { useAdminToast } from '../../utils/adminToastContext';

const TYPE_LABELS = {
    pickup: 'Household Waste Pickup',
    report: 'Waste Report',
    dustbin: 'Dustbin Request'
};

const STATUS_LABELS = {
    pending: 'Pending',
    approved: 'Approved',
    in_progress: 'In Progress',
    active: 'Assigned',
    completed: 'Completed',
    rejected: 'Rejected',
    cancelled: 'Cancelled'
};

const RequestManagement = ({ workers, token, mode = 'approve' }) => {
    const { showToast: toastFromContext } = useAdminToast();
    const safeToast = toastFromContext || ((msg, type) => console[type === 'error' ? 'error' : 'log']('[toast-fallback]', msg));
    const API_URL = import.meta.env.VITE_API_URL;
    const SERVER_URL = (API_URL || '').replace('/api', '');

    const normalizeType = (value = '') => {
        const lower = value.toString().toLowerCase();
        if (lower.includes('pickup')) return 'pickup';
        if (lower.includes('dustbin')) return 'dustbin';
        return 'report';
    };

    const uniqueRequestId = (id, requestType) => {
        const canonicalType = normalizeType(requestType);
        const numericId = Number(id);
        const safeId = Number.isFinite(numericId) ? numericId : id ?? 'unknown';
        return `${canonicalType}:${safeId}`;
    };

    const dedupeByUniqueId = (list = []) => {
        const map = new Map();
        list.forEach((item) => {
            const key = item?.uniqueId || uniqueRequestId(item?.id, item?.type || item?.requestType);
            if (!map.has(key)) {
                map.set(key, item);
            }
        });
        return Array.from(map.values());
    };

    const prettifyStatus = (status) => status.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

    const sanitizeImageValue = (value) => {
        if (!value) return '';

        // Arrays: prefer first entry
        if (Array.isArray(value)) return sanitizeImageValue(value[0]);

        if (typeof value === 'string') {
            const trimmed = value.trim();

            // Try to unwrap JSON/stringified arrays
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) return sanitizeImageValue(parsed[0]);
                if (typeof parsed === 'string') return sanitizeImageValue(parsed);
            } catch (_) {
                /* ignore parse errors; fall through */
            }

            // Valid direct sources
            if (trimmed.startsWith('data:image')) return trimmed;
            if (trimmed.startsWith('http')) return trimmed;
            if (trimmed.startsWith('/uploads')) return trimmed;
            if (trimmed.startsWith('uploads')) return `/${trimmed}`;

            // Anything else is considered unsafe for rendering
            return '';
        }

        return '';
    };

    const resolveRequestImage = (request) => {
        if (!request) return '';
        const candidate = request.image_url || request.image || request.resolvedImage || request.imageUrl || request.imagePath || request.photo || request.attachment || request.picture || request.image_urls || request.image_url_raw;
        return sanitizeImageValue(candidate);
    };

    const normalizeStatusValue = (request, canonicalType) => {
        const raw = (request?.db_status || request?.status || 'pending').toString().trim().toLowerCase().replace(/\s+/g, '_');
        const aliases = {
            inprogress: 'in_progress',
            assigned: 'active'
        };
        const normalized = aliases[raw] || raw;
        if (normalized === 'pending' && canonicalType === 'report' && request?.status?.toLowerCase()?.includes('progress')) {
            return 'in_progress';
        }
        return normalized;
    };

    const normalizeRequest = (request, options = {}) => {
        const canonicalType = normalizeType(options.overrideType || request?.type || request?.requestType || request?.title || '');
        const requestId = request?.id ?? request?.request_id;
        const normalizedStatus = normalizeStatusValue(request, canonicalType);
        const resolvedImage = resolveRequestImage(request);
        const uniqueId = uniqueRequestId(requestId, canonicalType);

        return {
            ...request,
            id: requestId,
            type: canonicalType,
            requestType: canonicalType,
            displayType: request?.title || TYPE_LABELS[canonicalType] || request?.type || 'Request',
            status: normalizedStatus,
            statusLabel: STATUS_LABELS[normalizedStatus] || prettifyStatus(normalizedStatus),
            resolvedImage,
            image_url: resolvedImage,
            uniqueId
        };
    };

    const buildImageUrl = (imagePath) => {
        if (!imagePath || typeof imagePath !== 'string') return '';
        const trimmed = imagePath.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('data:') || trimmed.startsWith('http')) return trimmed;
        const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
        return `${SERVER_URL || ''}${normalizedPath}`;
    };

    // Approve/Monitor unified state
    const [requests, setRequests] = useState({ pending: [], approved: [] });
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showImagePreview, setShowImagePreview] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignmentRequest, setAssignmentRequest] = useState(null);
    const [assignedWorker, setAssignedWorker] = useState('');

    const statusBadgeClasses = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-blue-100 text-blue-800',
        in_progress: 'bg-blue-100 text-blue-800',
        active: 'bg-purple-100 text-purple-800',
        completed: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-700',
        cancelled: 'bg-gray-100 text-gray-700'
    };

    const findRequestById = (requestId, requestType) => {
        const canonicalType = normalizeType(requestType);
        const targetUniqueId = uniqueRequestId(requestId, canonicalType);
        const matchFn = (r) => (r?.uniqueId || uniqueRequestId(r.id, r.type)) === targetUniqueId;
        return requests.pending.find(matchFn) || requests.approved.find(matchFn) || null;
    };

    const APPROVED_STATUSES = new Set(['approved', 'in_progress', 'active', 'completed']);

    const applyLocalStateUpdates = (requestId, requestType, targetStatus) => {
        const canonicalType = normalizeType(requestType);
        const matchId = Number(requestId);
        const targetUniqueId = uniqueRequestId(matchId, canonicalType);
        const source = findRequestById(matchId, canonicalType) || {};
        const normalized = normalizeRequest({ ...source, id: matchId, type: canonicalType, status: targetStatus, db_status: targetStatus, uniqueId: targetUniqueId }, { overrideType: canonicalType });
        const shouldAppearInApproved = APPROVED_STATUSES.has(targetStatus);

        setRequests((prev) => {
            const nextPendingState = prev.pending.filter(r => (r?.uniqueId || uniqueRequestId(r.id, r.type)) !== targetUniqueId);
            const filteredApproved = prev.approved.filter(r => (r?.uniqueId || uniqueRequestId(r.id, r.type)) !== targetUniqueId);
            const nextApprovedState = shouldAppearInApproved ? [normalized, ...filteredApproved] : filteredApproved;

            return { pending: nextPendingState, approved: nextApprovedState };
        });

        setSelectedRequest((prev) => {
            if (!prev) return prev;
            const prevUniqueId = prev.uniqueId || uniqueRequestId(prev.id, prev.type);
            return prevUniqueId === targetUniqueId ? normalized : prev;
        });
    };

    const STATUS_FOR_ACTION = {
        approve: { pickup: 'approved', report: 'in_progress', dustbin: 'in_progress' },
        reject: { pickup: 'rejected', report: 'rejected', dustbin: 'rejected' },
        cancel: { pickup: 'cancelled', report: 'cancelled', dustbin: 'cancelled' }
    };

    const updateRequestStatus = async ({ requestId, requestType, status, actionLabel = 'Status updated successfully!' }) => {
        if (!token) return;

        const canonicalType = normalizeType(requestType);
        const targetStatus = status || STATUS_FOR_ACTION.approve[canonicalType];
        if (!targetStatus) {
            safeToast('Unsupported request action for this type', 'error');
            return;
        }

        console.info('[REQUEST_ACTION:start]', { requestId, requestType: canonicalType, status: targetStatus });
        console.info('[REQUEST_STATE:before]', { pending: requests.pending.length, approved: requests.approved.length });

        try {
            const res = await fetch(`${API_URL}/admin/requests/${requestId}/${canonicalType}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: targetStatus })
            });

            const data = await res.json();
            const finalType = normalizeType(data?.type || canonicalType);
            const finalStatus = data?.newStatus || targetStatus;
            if (res.ok) {
                applyLocalStateUpdates(requestId, finalType, finalStatus);
                setShowRequestModal(false);
                setShowImagePreview(false);
                safeToast(actionLabel, 'success');

                // Await authoritative refetch to avoid stale rehydration
                await fetchApprovedRequests();
                await fetchPendingRequests();
            } else {
                safeToast('Error: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            safeToast('Error updating status', 'error');
        }
    };

    const handleApproveRequest = (requestId, requestType) => {
        const status = STATUS_FOR_ACTION.approve[normalizeType(requestType)];
        updateRequestStatus({ requestId, requestType, status, actionLabel: 'Request approved successfully!' });
    };

    const handleRejectRequest = (requestId, requestType) => {
        const status = STATUS_FOR_ACTION.reject[normalizeType(requestType)];
        updateRequestStatus({ requestId, requestType, status, actionLabel: 'Request disapproved' });
    };

    const handleCancelRequest = (requestId, requestType) => {
        if (!confirm('Cancel this request? This will remove it from active monitoring.')) return;
        const status = STATUS_FOR_ACTION.cancel[normalizeType(requestType)];
        updateRequestStatus({ requestId, requestType, status, actionLabel: 'Request cancelled' });
    };

    const closeRequestModal = () => {
        setShowRequestModal(false);
        setSelectedRequest(null);
        setShowImagePreview(false);
    };

    // Fetch pending requests for approval
    const fetchPendingRequests = async () => {
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/admin/requests/pending`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();

            if (res.ok) {
                const filtered = (data.requests || []).filter((req) => {
                    const normalizedStatus = normalizeStatusValue(req, normalizeType(req.type || req.requestType));
                    return normalizedStatus === 'pending';
                });
                const normalizedPending = dedupeByUniqueId(filtered.map((req) => normalizeRequest(req)));
                setRequests((prev) => ({ ...prev, pending: normalizedPending }));
                console.info('[STATE:FINAL]', { pendingIds: normalizedPending.map((r) => r.id), pending: normalizedPending.length });
            } else {
                console.error('Error fetching pending requests:', data.message);
            }
        } catch (error) {
            console.error('Error fetching pending requests:', error);
        }
    };

    // Fetch approved requests for monitoring
    const fetchApprovedRequests = async () => {
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/admin/requests/approved`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();

            if (res.ok) {
                const filtered = (data.requests || []).filter((req) => {
                    const normalizedStatus = normalizeStatusValue(req, normalizeType(req.type || req.requestType));
                    return APPROVED_STATUSES.has(normalizedStatus) && !normalizedStatus.includes('reject');
                });
                const normalizedApproved = dedupeByUniqueId(filtered.map((req) => normalizeRequest(req)));
                setRequests((prev) => ({ ...prev, approved: normalizedApproved }));
                console.info('[STATE:FINAL]', { approvedIds: normalizedApproved.map((r) => r.id), approved: normalizedApproved.length });
            } else {
                console.error('Error fetching approved requests:', data.message);
            }
        } catch (error) {
            console.error('Error fetching approved requests:', error);
        }
    };

    // Request Approval Handlers
    const viewRequestDetails = async (requestId, requestType, options = {}) => {
        if (!token) return;

        const canonicalType = normalizeType(requestType);

        try {
            const res = await fetch(`${API_URL}/admin/requests/${requestId}/${canonicalType}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();

            if (res.ok) {
                const normalized = normalizeRequest(data.request, { overrideType: canonicalType });
                setSelectedRequest(normalized);
                setShowImagePreview(options.openImage && !!normalized.resolvedImage);
                setShowRequestModal(true);
            } else {
                safeToast('Error: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error fetching request details:', error);
            safeToast('Error fetching request details', 'error');
        }
    };

    // Request Monitoring Handlers
    const assignWorkerToRequest = (requestId, requestType) => {
        if (!workers || workers.length === 0) {
            safeToast('Worker list is still loading. Please try again.', 'warning');
            return;
        }

        const canonicalType = normalizeType(requestType);
        if (canonicalType === 'pickup') {
            safeToast('Household pickups are informational and cannot be assigned.', 'warning');
            return;
        }
        const request = requests.approved.find(r => r.id === requestId && normalizeType(r.type) === canonicalType);
        if (!request) {
            safeToast('Request not found', 'error');
            return;
        }

        setAssignmentRequest(request);
        setAssignedWorker(request.assigned_worker || '');
        setShowAssignModal(true);
    };

    const handleAssignment = async () => {
        if (!workers || workers.length === 0) {
            safeToast('Worker list is not available. Please try again.', 'error');
            return;
        }

        if (!assignmentRequest || !assignedWorker) {
            safeToast('Please select a worker to assign', 'warning');
            return;
        }

        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/admin/requests/${assignmentRequest.id}/${assignmentRequest.type}/assign`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ workerId: assignedWorker })
            });

            const data = await res.json();

            if (res.ok) {
                safeToast('Worker assigned successfully!', 'success');
                closeAssignModal();
                fetchApprovedRequests();
            } else {
                safeToast('Error: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error assigning worker:', error);
            safeToast('Error assigning worker', 'error');
        }
    };

    const closeAssignModal = () => {
        setShowAssignModal(false);
        setAssignmentRequest(null);
        setAssignedWorker('');
    };

    // Load data when token or mode changes to keep both lists fresh
    useEffect(() => {
        if (!token) return;
        if (mode === 'approve') {
            fetchPendingRequests();
        }
        // Always keep approved list up to date so monitor view is accurate after approvals
        fetchApprovedRequests();
    }, [token, mode]);

    const renderApproveRequests = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Approve Requests</h1>
                    <p className="text-gray-600 mt-2">Review and approve pending citizen requests</p>
                </div>
            </div>

            {requests.pending.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <p className="text-gray-500">No pending requests</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.pending.map((request, idx) => {
                        const requestImage = resolveRequestImage(request);
                        const createdAt = request.created_at ? new Date(request.created_at).toLocaleDateString() : 'N/A';

                        return (
                            <div key={request.uniqueId || `${normalizeType(request.type || request.requestType || 'pending')}:${request.id ?? idx}`} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-semibold text-gray-800">{request.displayType || request.title || TYPE_LABELS[request.type] || request.type}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadgeClasses[request.status] || 'bg-orange-100 text-orange-800'}`}>{request.statusLabel || 'Pending'}</span>
                                        </div>
                                        <p className="text-gray-600">{request.description || 'No description'}</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500">Request ID:</span>
                                                <p className="font-semibold text-gray-800">{request.id}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Type:</span>
                                                <p className="font-semibold text-gray-800">{request.displayType || request.type}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Citizen:</span>
                                                <p className="font-semibold text-gray-800">{request.citizen_name || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Date:</span>
                                                <p className="font-semibold text-gray-800">{createdAt}</p>
                                            </div>
                                        </div>
                                        <div className="mt-1 text-sm text-gray-500">
                                            {requestImage ? (
                                                <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full">Image attached</span>
                                            ) : (
                                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full">No image available</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-wrap justify-end">
                                        <button
                                            onClick={() => viewRequestDetails(request.id, request.type)}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                                        >
                                            <FaEye className="text-sm" />
                                            View
                                        </button>
                                        <button
                                            onClick={() => handleRejectRequest(request.id, request.type)}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                        >
                                            <FaTimes className="text-sm" />
                                            Disapprove
                                        </button>
                                        <button
                                            onClick={() => handleApproveRequest(request.id, request.type)}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                                        >
                                            <FaCheckCircle className="text-sm" />
                                            Approve
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Request Details Modal */}
            {showRequestModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 my-8 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-800">Request Details</h3>
                            <button
                                onClick={closeRequestModal}
                                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
                            >
                                <FaTimes className="text-xl" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-2">Request ID</label>
                                    <p className="text-lg font-bold text-gray-900 bg-purple-50 p-3 rounded-lg">{selectedRequest.id}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-2">Type</label>
                                    <p className="text-lg font-bold text-gray-900 bg-purple-50 p-3 rounded-lg">{selectedRequest.displayType || selectedRequest.type}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-2">Citizen</label>
                                    <p className="text-lg font-bold text-gray-900 bg-purple-50 p-3 rounded-lg">{selectedRequest.citizen_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-2">Date</label>
                                    <p className="text-lg font-bold text-gray-900 bg-purple-50 p-3 rounded-lg">{selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-2">Details</label>
                                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedRequest.description || 'No additional details'}</p>
                                </div>
                                            {(() => {
                                                const modalImage = resolveRequestImage(selectedRequest);
                                                const hasImage = !!modalImage;
                                    return (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-600">Attachment</label>
                                                    <p className="text-xs text-gray-500">View the submitted image without affecting the details layout.</p>
                                                </div>
                                                {hasImage ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowImagePreview((prev) => !prev)}
                                                        className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:border-purple-400 hover:text-purple-700 transition-colors"
                                                    >
                                                        {showImagePreview ? 'Hide Image' : 'View Image'}
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-500 px-3 py-2 bg-gray-100 rounded-lg">No image available</span>
                                                )}
                                            </div>
                                            {hasImage && showImagePreview && (
                                                <div className="border border-gray-200 rounded-xl bg-gray-50 p-3 max-h-[70vh] overflow-auto">
                                                    <img
                                                        src={buildImageUrl(modalImage)}
                                                        alt="Request attachment"
                                                        className="w-full h-full object-contain"
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                        </div>

                        <div className="flex gap-4 mt-6">
                            <button
                                onClick={() => handleRejectRequest(selectedRequest.id, selectedRequest.type)}
                                className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-3 rounded-lg font-medium transition-colors"
                            >
                                Disapprove
                            </button>
                            <button
                                onClick={() => handleApproveRequest(selectedRequest.id, selectedRequest.type)}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors"
                            >
                                Approve Request
                            </button>
                            <button
                                onClick={closeRequestModal}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-lg font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderMonitorRequests = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Monitor Requests</h1>
                    <p className="text-gray-600 mt-2">Track and manage approved requests</p>
                </div>
            </div>

            {requests.approved.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <p className="text-gray-500">No approved requests</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 text-gray-600 font-medium">ID</th>
                                <th className="text-left py-3 px-4 text-gray-600 font-medium">Type</th>
                                <th className="text-left py-3 px-4 text-gray-600 font-medium">Citizen</th>
                                <th className="text-left py-3 px-4 text-gray-600 font-medium">Assigned Worker</th>
                                <th className="text-left py-3 px-4 text-gray-600 font-medium">Image</th>
                                <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
                                <th className="text-left py-3 px-4 text-gray-600 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.approved.map((request, idx) => {
                                const requestImage = resolveRequestImage(request);
                                const statusClass = statusBadgeClasses[request.status] || 'bg-gray-100 text-gray-700';
                                const statusLabel = request.statusLabel || prettifyStatus(request.status || 'pending');
                                const canonicalType = normalizeType(request.type || request.requestType);
                                const isHousehold = canonicalType === 'pickup';
                                const isActionable = !['completed', 'cancelled', 'rejected'].includes(request.status);

                                return (
                                <tr key={request.uniqueId || `${normalizeType(request.type || request.requestType || 'approved')}:${request.id ?? idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-4 font-semibold">{request.id}</td>
                                    <td className="py-3 px-4">{request.displayType || request.type}</td>
                                    <td className="py-3 px-4">{request.citizen_name || 'N/A'}</td>
                                    <td className="py-3 px-4">
                                        {isHousehold ? (
                                            <span className="text-gray-500">-</span>
                                        ) : request.assigned_worker_name || request.assigned_worker ? (
                                            <span className="text-green-600 font-medium">{request.assigned_worker_name || request.assigned_worker}</span>
                                        ) : (
                                            <span className="text-yellow-600 font-medium">To be assigned</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        {requestImage ? (
                                            <img
                                                src={buildImageUrl(requestImage)}
                                                alt="Request attachment"
                                                className="h-16 w-20 object-cover rounded border border-gray-200"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        ) : (
                                            <span className="text-gray-400 text-xs">No image</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                                            {statusLabel}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        {!isHousehold && isActionable && (
                                            <button
                                                onClick={() => assignWorkerToRequest(request.id, request.type)}
                                                className="text-purple-600 hover:text-purple-800 text-sm mr-3"
                                            >
                                                Assign
                                            </button>
                                        )}
                                        {isActionable && (
                                            <button
                                                onClick={() => handleCancelRequest(request.id, request.type)}
                                                className="text-red-600 hover:text-red-800 text-sm"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        {!isActionable && (
                                            <span className="text-gray-500 text-sm">No actions</span>
                                        )}
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Assign Worker Modal */}
            {showAssignModal && assignmentRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Assign Worker</h3>
                        <form onSubmit={(e) => { e.preventDefault(); handleAssignment(); }}>
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Select Worker</label>
                                <select
                                    value={assignedWorker}
                                    onChange={(e) => setAssignedWorker(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    required
                                >
                                    <option value="">Choose a worker...</option>
                                    {workers && workers.map(worker => (
                                        <option key={worker.id} value={worker.id}>{worker.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeAssignModal}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                >
                                    Assign
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );

    if (mode === 'monitor') return renderMonitorRequests();
    return renderApproveRequests();
};

export default RequestManagement;
