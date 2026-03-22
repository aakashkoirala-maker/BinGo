import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaHome, FaUserFriends, FaCheckCircle, FaEye, FaUsers, FaClipboard, FaPhone, FaUser, FaSignOutAlt, FaChevronRight, FaBolt, FaTools, FaClock, FaPlus, FaTrash, FaBell, FaEdit, FaLock, FaEnvelope, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';
import { ToastProvider } from '../../utils/adminToastContext.jsx';
import { StatCard } from './ui/StatCard';
import { RequestCard } from './ui/RequestCard';
import { CitizenRow } from './ui/CitizenRow';
import AccountManagement from './AccountManagement';
import RequestManagement from './RequestManagement';
import MunicipalityServices from './MunicipalityServices';
import AdminSidebar from './AdminSidebar';

const AdminDashboard = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeSection, setActiveSection] = useState('overview');
    // Toast Notification System
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    // Derived from VITE_API_URL (e.g., http://localhost:5000/api -> http://localhost:5000)
    const SERVER_URL = (import.meta.env.VITE_API_URL || '').replace('/api', '');

    const [stats, setStats] = useState({
        totalWorkers: 0,
        pendingApprovals: 0,
        activeRequests: 0,
        registeredCitizens: 0
    });
    const [recentRequests, setRecentRequests] = useState([]);

    // Worker Management State (SHARED with child components)
    const [workers, setWorkers] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [workerForm, setWorkerForm] = useState({ fullName: '', email: '', password: '', age: '', phoneNumber: '' });
    const [formKey, setFormKey] = useState(0);

    // Request/assignment state
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignmentRequest, setAssignmentRequest] = useState(null);
    const [assignedWorker, setAssignedWorker] = useState('');
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

    // Notice board state
    const [notices, setNotices] = useState([]);
    const [showNoticeModal, setShowNoticeModal] = useState(false);
    const [editingNotice, setEditingNotice] = useState(null);
    const [noticeForm, setNoticeForm] = useState({ title: '', description: '', expires_at: '' });
    const [showDeleteNoticeConfirm, setShowDeleteNoticeConfirm] = useState(false);
    const [deleteNoticeId, setDeleteNoticeId] = useState(null);
    const [adminProfile, setAdminProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileNotice, setProfileNotice] = useState('');
    const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
    const [passwordSaving, setPasswordSaving] = useState(false);


    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Fetch core data on mount (workers ALWAYS fetched here)
    useEffect(() => {
        fetchDashboardData();
        fetchWorkers();
    }, []); // Empty dependency = mount only

    // Fetch section-specific data when activeSection changes
    useEffect(() => {
        if (activeSection === 'worker-management') {
            // workers already fetched above
            setShowCreateForm(false);
            setWorkerForm({ fullName: '', email: '', password: '', age: '', phoneNumber: '' });
            setFormKey(prev => prev + 1);
        } else if (activeSection === 'household-schedule') {
            fetchWardSchedules();
            fetchAreaRoutes();
            // availableWorkers = workers (already fetched)
        } else if (activeSection === 'approve-requests') {
            fetchPendingRequests();
        } else if (activeSection === 'monitor-requests') {
            fetchApprovedRequests();
        } else if (activeSection === 'notice-board') {
            fetchNotices();
        } else if (activeSection === 'emergency-contacts') {
            fetchEmergencyContacts();
        } else if (activeSection === 'admin-profile') {
            fetchAdminProfile();
        }
    }, [activeSection]);

    // Reset form when opening create worker form
    useEffect(() => {
        if (showCreateForm) {
            setWorkerForm({
                fullName: '',
                email: '',
                password: '',
                age: '',
                phoneNumber: ''
            });
            setFormKey(prev => prev + 1); // Force re-render
        }
    }, [showCreateForm]);

    const fetchDashboardData = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }

        try {
            // Fetch stats
            const statsRes = await fetch(`${import.meta.env.VITE_API_URL}/admin/dashboard-stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            // Fetch recent requests
            const requestsRes = await fetch(`${import.meta.env.VITE_API_URL}/admin/recent-requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (requestsRes.ok) {
                const requestsData = await requestsRes.json();
                setRecentRequests(requestsData.requests || []);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    // Worker Management Functions
    const fetchWorkers = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/workers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setWorkers(data.workers || []);
            }
        } catch (error) {
            console.error('Error fetching workers:', error);
        }
    };

    // Placeholder fetchers for other sections (prevent runtime errors)
    const fetchWardSchedules = async () => { /* no-op placeholder */ };
    const fetchAreaRoutes = async () => { /* no-op placeholder */ };
    const fetchPendingRequests = async () => { /* no-op placeholder */ };
    const fetchApprovedRequests = async () => { /* no-op placeholder */ };
    const fetchNotices = async () => { /* no-op placeholder to keep UI stable */ };
    const fetchEmergencyContacts = async () => { /* no-op placeholder */ };
    const fetchAdminProfile = async () => {
        if (!token) return;
        try {
            setProfileLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setAdminProfile(data.admin || null);
            } else {
                setProfileNotice(data.message || 'Unable to load profile');
            }
        } catch (error) {
            console.error('Error fetching admin profile:', error);
            setProfileNotice('Unable to load profile');
        } finally {
            setProfileLoading(false);
        }
    };

    const handleChangeAdminPassword = async (e) => {
        e.preventDefault();
        setProfileNotice('');
        if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
            setProfileNotice('Please fill all password fields');
            return;
        }
        if (passwordForm.next !== passwordForm.confirm) {
            setProfileNotice('New passwords do not match');
            return;
        }
        if (passwordForm.next.length < 6) {
            setProfileNotice('Password must be at least 6 characters');
            return;
        }

        try {
            setPasswordSaving(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/profile/password`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    current_password: passwordForm.current,
                    new_password: passwordForm.next,
                    confirm_password: passwordForm.confirm
                })
            });
            const data = await res.json();
            if (res.ok) {
                setProfileNotice('Password changed successfully');
                setPasswordForm({ current: '', next: '', confirm: '' });
            } else {
                setProfileNotice(data.message || 'Unable to change password');
            }
        } catch (error) {
            console.error('Error changing admin password:', error);
            setProfileNotice('Unable to change password');
        } finally {
            setPasswordSaving(false);
        }
    };

    // Request modal helpers
    const closeRequestModal = () => {
        setShowRequestModal(false);
        setSelectedRequest(null);
    };

    // Assignment helpers
    const handleAssignment = () => {
        setShowAssignModal(false);
        setAssignmentRequest(null);
        setAssignedWorker('');
    };

    // Notice helpers
    const openEditNotice = (notice) => {
        setEditingNotice(notice);
        setNoticeForm({
            title: notice.title || '',
            description: notice.description || '',
            expires_at: notice.expires_at ? notice.expires_at.split('T')[0] : ''
        });
        setShowNoticeModal(true);
    };

    const confirmDeleteNotice = (id) => {
        setDeleteNoticeId(id);
        setShowDeleteNoticeConfirm(true);
    };

    const handleDeleteNotice = () => {
        setNotices((prev) => prev.filter((n) => n.id !== deleteNoticeId));
        setShowDeleteNoticeConfirm(false);
        setDeleteNoticeId(null);
    };

    const handleCreateNotice = (e) => {
        e?.preventDefault();
        const newNotice = {
            id: notices.length ? Math.max(...notices.map((n) => n.id)) + 1 : 1,
            status: 'active',
            created_at: new Date().toISOString().split('T')[0],
            ...noticeForm
        };
        setNotices((prev) => [...prev, newNotice]);
        setShowNoticeModal(false);
        setNoticeForm({ title: '', description: '', expires_at: '' });
    };

    const handleUpdateNotice = (e) => {
        e?.preventDefault();
        if (!editingNotice) return;
        setNotices((prev) => prev.map((n) => (n.id === editingNotice.id ? { ...n, ...noticeForm } : n)));
        setShowNoticeModal(false);
        setEditingNotice(null);
        setNoticeForm({ title: '', description: '', expires_at: '' });
    };

    // Citizen Management Functions - Handled by AccountManagement component

    const closeAssignModal = () => {
        setShowAssignModal(false);
        setAssignmentRequest(null);
        setAssignedWorker('');
    };
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const renderOverview = () => (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Workers" value={stats.totalWorkers} icon={FaUsers} bgColor="bg-purple-100" iconColor="text-purple-600" />
                <StatCard label="Pending Approvals" value={stats.pendingApprovals} icon={FaClipboard} bgColor="bg-orange-100" iconColor="text-orange-600" />
                <StatCard label="Active Requests" value={stats.activeRequests} icon={FaBolt} bgColor="bg-blue-100" iconColor="text-blue-600" />
                <StatCard label="Registered Citizens" value={stats.registeredCitizens} icon={FaUserFriends} bgColor="bg-green-100" iconColor="text-green-600" />
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Recent Requests</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {recentRequests.length === 0 ? (
                            <p className="text-gray-500 text-sm">No recent requests.</p>
                        ) : (
                            recentRequests.map((req, idx) => {
                                const key = `${req.type || 'request'}-${req.id ?? req.request_id ?? req.created_at ?? req.title ?? req.location ?? req.time ?? idx}-${idx}`;
                                return (
                                    <div key={key} className="flex flex-col gap-2 p-4 rounded-lg border border-gray-100 hover:border-purple-200 hover:shadow-sm transition-all">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold text-gray-800">{req.title}</p>
                                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{req.status}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">{req.location} · {req.time || ''}</p>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeSection) {
            case 'overview':
                return renderOverview();
            case 'worker-management':
                return <AccountManagement mode="workers" workers={workers} setWorkers={setWorkers} token={token} />;
            case 'household-schedule':
                return <MunicipalityServices mode="schedule" workers={workers} token={token} />;
            case 'approve-requests':
                return <RequestManagement mode="approve" workers={workers} token={token} />;
            case 'monitor-requests':
                return <RequestManagement mode="monitor" workers={workers} token={token} />;
            case 'citizen-management':
                return <AccountManagement mode="citizens" workers={workers} setWorkers={setWorkers} token={token} />;
            case 'notice-board':
                return <MunicipalityServices mode="notice" workers={workers} token={token} />;
            case 'emergency-contacts':
                return <MunicipalityServices mode="emergency" workers={workers} token={token} />;
            case 'admin-profile':
                return renderAdminProfile();
            default:
                return renderOverview();
        }
    };

    const renderAdminProfile = () => {
        const profile = adminProfile || { full_name: user.full_name || user.name || 'Admin', email: user.email || 'admin@municipality.gov' };
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xl font-bold">
                        {(profile.full_name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{profile.full_name || 'Admin'}</h2>
                        <p className="text-gray-600">{profile.email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <p className="text-gray-500 text-sm">Role</p>
                        <p className="text-xl font-semibold text-gray-800 mt-2">Administrator</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <p className="text-gray-500 text-sm">Status</p>
                        <p className="text-xl font-semibold text-green-600 mt-2">Active</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <p className="text-gray-500 text-sm">Last Login</p>
                        <p className="text-xl font-semibold text-gray-800 mt-2">{new Date().toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800">Change Password</h3>
                            <p className="text-sm text-gray-500">Email and name are read-only</p>
                        </div>
                        {profileLoading && <span className="text-xs text-gray-500">Loading profile...</span>}
                    </div>

                    <form onSubmit={handleChangeAdminPassword} className="space-y-4 max-w-xl">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                            <input
                                type="password"
                                value={passwordForm.current}
                                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                                placeholder="Enter current password"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                            <input
                                type="password"
                                value={passwordForm.next}
                                onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                                placeholder="Enter new password"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                            <input
                                type="password"
                                value={passwordForm.confirm}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                                placeholder="Re-enter new password"
                                required
                            />
                        </div>

                        {profileNotice && (
                            <div className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                {profileNotice}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={passwordSaving}
                                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                            >
                                {passwordSaving ? 'Saving...' : 'Update Password'}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setPasswordForm({ current: '', next: '', confirm: '' }); setProfileNotice(''); }}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <ToastProvider showToast={showToast}>
            <div className="min-h-screen bg-gray-50 flex">
                <AdminSidebar
                    isSidebarCollapsed={isSidebarCollapsed}
                    setIsSidebarCollapsed={setIsSidebarCollapsed}
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    handleLogout={handleLogout}
                />

                <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
                    {/* Top Bar */}
                    <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Municipality Admin Dashboard</h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                    <span className="text-purple-600 font-medium">A</span>
                                </div>
                                <span className="text-gray-700 font-medium">Admin Municipality</span>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {renderContent()}
                    </div>
                </div>
            </div>

            {/* Modals & Notifications */}
            {/* Request Details Modal */}
            {showRequestModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 md:p-8 my-8 transform transition-all duration-300 scale-100 border-2 border-purple-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-800">Request Details</h3>
                            <button
                                onClick={closeRequestModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
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
                                    <label className="block text-sm font-semibold text-gray-600 mb-2">Request Type</label>
                                    <p className="text-lg font-bold text-gray-900 bg-purple-50 p-3 rounded-lg">{selectedRequest.type}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-2">Status</label>
                                    <p className="text-lg font-bold text-gray-900 bg-purple-50 p-3 rounded-lg">{selectedRequest.status}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-2">Priority</label>
                                    <p className="text-lg font-bold text-gray-900 bg-purple-50 p-3 rounded-lg">{selectedRequest.priority}</p>
                                </div>
                            </div>
                            
                            {/* Image Preview in Modal */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-2">Request Image</label>
                                <div className="relative h-64 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                                    {selectedRequest.image ? (
                                        <img
                                            src={selectedRequest.image.startsWith('data:') ? selectedRequest.image : `${SERVER_URL}${selectedRequest.image}`}
                                            alt="Request"
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div className={`absolute inset-0 flex items-center justify-center ${selectedRequest.image ? 'hidden' : 'flex'}`}>
                                        <span className="text-gray-400 text-center">
                                            <FaClipboard className="text-5xl mx-auto mb-2" />
                                            <span className="text-sm">No image available</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-2">Description</label>
                                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedRequest.description || 'No description provided'}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-2">Location</label>
                                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedRequest.location}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-2">Submitted Date</label>
                                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                                </div>
                            </div>

                            {selectedRequest.worker_note && (
                                <div className="border-t pt-6">
                                    <h4 className="text-lg font-bold text-gray-800 mb-4">Worker Updates</h4>
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                        <p className="text-gray-800 whitespace-pre-wrap">{selectedRequest.worker_note}</p>
                                    </div>
                                </div>
                            )}

                            <div className="border-t pt-6">
                                <h4 className="text-lg font-bold text-gray-800 mb-4">Citizen Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-2">Full Name</label>
                                        <p className="text-lg font-bold text-gray-900 bg-purple-50 p-3 rounded-lg">{selectedRequest.citizen_name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-2">Phone Number</label>
                                        <p className="text-lg font-bold text-gray-900 bg-purple-50 p-3 rounded-lg">{selectedRequest.citizen_phone}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-2">Email</label>
                                        <p className="text-lg font-bold text-gray-900 bg-purple-50 p-3 rounded-lg">{selectedRequest.citizen_email || 'Not provided'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-2">Age</label>
                                        <p className="text-lg font-bold text-gray-900 bg-purple-50 p-3 rounded-lg">{selectedRequest.citizen_age || 'Not provided'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={closeRequestModal}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Worker Modal */}
            {showAssignModal && assignmentRequest && (
                    <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all duration-300 scale-100 border-2 border-purple-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-800">Assign Worker</h3>
                                <button
                                    onClick={closeAssignModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <FaTimes className="text-xl" />
                                </button>
                            </div>

                            <div className="mb-6">
                                <p className="text-gray-600 mb-4">Assign a worker to handle this request:</p>
                                <p className="font-bold text-gray-800">{assignmentRequest.title}</p>
                                <p className="text-gray-600 text-sm mt-1">Request ID: {assignmentRequest.id}</p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Worker</label>
                                <select
                                    value={assignedWorker}
                                    onChange={(e) => setAssignedWorker(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="">Select a worker...</option>
                                    {workers.map((worker) => (
                                        <option key={worker.id} value={worker.id}>
                                            {worker.full_name} (Worker {worker.id})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleAssignment}
                                    disabled={!assignedWorker}
                                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition-colors"
                                >
                                    Assign Worker
                                </button>
                                <button
                                    onClick={closeAssignModal}
                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
            )}
        </ToastProvider>
    );
};

export default AdminDashboard;
