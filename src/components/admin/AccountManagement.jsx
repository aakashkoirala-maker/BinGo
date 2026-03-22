import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaTimes, FaUserFriends, FaUsers, FaEdit, FaUser, FaEye, FaLock } from 'react-icons/fa';
import { WorkerCard } from './ui/WorkerCard';
import { CitizenRow } from './ui/CitizenRow';
import { useAdminToast } from '../../utils/adminToastContext';

const AccountManagement = ({ workers = [], setWorkers = () => {}, token = localStorage.getItem('token'), mode = 'workers' }) => {
    const { showToast } = useAdminToast();
    
    // Derived from VITE_API_URL (e.g., http://localhost:5000/api -> http://localhost:5000)
    const SERVER_URL = (import.meta.env.VITE_API_URL || '').replace('/api', '');

    // ===== WORKER MANAGEMENT STATE =====
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [showWorkerModal, setShowWorkerModal] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formKey, setFormKey] = useState(0); // Force re-render
    const [deleteWorkerId, setDeleteWorkerId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [workerForm, setWorkerForm] = useState({
        fullName: '',
        email: '',
        password: '',
        age: '',
        phoneNumber: ''
    });
    const [workerList, setWorkerList] = useState(workers || []);

    // ===== CITIZEN MANAGEMENT STATE =====
    const [citizenStats, setCitizenStats] = useState({ totalCitizens: 0, totalReports: 0 });
    const [citizens, setCitizens] = useState([]);
    const [citizenLeaderboard, setCitizenLeaderboard] = useState([]);
    const [deleteCitizenId, setDeleteCitizenId] = useState(null);
    const [showDeleteCitizenConfirm, setShowDeleteCitizenConfirm] = useState(false);

    // ===== WORKER MANAGEMENT FUNCTIONS =====
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
                setWorkerList(data.workers || []);
            }
        } catch (error) {
            console.error('Error fetching workers:', error);
        }
    };

    const viewWorkerDetails = async (workerId) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/workers/${workerId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setSelectedWorker(data.worker);
                setShowWorkerModal(true);
            }
        } catch (error) {
            console.error('Error fetching worker details:', error);
        }
    };

    const handleCreateWorker = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) return;

        const trimmedName = workerForm.fullName.trim();
        const trimmedEmail = workerForm.email.trim().toLowerCase();
        const ageValue = workerForm.age ? Number(workerForm.age) : null;

        if (!trimmedName || !trimmedEmail || !workerForm.password.trim()) {
            showToast('Full name, email, and password are required', 'error');
            return;
        }

        if (workerForm.password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        if (ageValue !== null && (Number.isNaN(ageValue) || ageValue < 18)) {
            showToast('Age must be 18 or above', 'error');
            return;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/workers`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fullName: trimmedName,
                    email: trimmedEmail,
                    password: workerForm.password,
                    age: ageValue,
                    phoneNumber: workerForm.phoneNumber?.trim() || null
                })
            });

            const data = await res.json();

            if (res.ok) {
                showToast('Worker created successfully!', 'success');
                setShowCreateForm(false);
                setWorkerForm({ fullName: '', email: '', password: '', age: '', phoneNumber: '' });
                setFormKey(prev => prev + 1); // Force complete re-render
                const newWorker = {
                    ...(data.worker || {}),
                    full_name: data.worker?.full_name || data.worker?.fullName || workerForm.fullName,
                    password: '••••••••',
                    created_at: new Date().toISOString()
                };
                setWorkerList((prev) => [newWorker, ...prev]);
                setWorkers((prev) => [newWorker, ...(prev || [])]);
            } else {
                showToast('Error: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error creating worker:', error);
            showToast('Error creating worker', 'error');
        }
    };

    const handleWorkerFormChange = (e) => {
        setWorkerForm({
            ...workerForm,
            [e.target.name]: e.target.value
        });
    };

    const closeWorkerModal = () => {
        setShowWorkerModal(false);
        setSelectedWorker(null);
        setShowResetPassword(false);
        setNewPassword('');
        setShowPassword(false);
    };

    const handleResetPassword = async () => {
        if (!newPassword.trim()) {
            showToast('Please enter a new password', 'error');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/workers/${selectedWorker.id}/reset-password`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ newPassword })
            });

            const data = await res.json();

            if (res.ok) {
                showToast(`Password reset successfully! New password: ${data.newPassword}`, 'success');
                setNewPassword('');
                setShowResetPassword(false);
                // Refresh worker details
                viewWorkerDetails(selectedWorker.id);
            } else {
                showToast('Error: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            showToast('Error resetting password', 'error');
        }
    };

    const handleDeleteWorker = async () => {
        if (!deleteWorkerId) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/workers/${deleteWorkerId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();

            if (res.ok) {
                showToast('Worker deleted successfully', 'success');
                setShowDeleteConfirm(false);
                setDeleteWorkerId(null);
                setWorkerList((prev) => prev.filter(w => w.id !== deleteWorkerId));
                setWorkers((prev) => (prev || []).filter(w => w.id !== deleteWorkerId));
            } else {
                if (res.status === 404) {
                    // Backend already removed; sync UI
                    setWorkerList((prev) => prev.filter(w => w.id !== deleteWorkerId));
                    setWorkers((prev) => (prev || []).filter(w => w.id !== deleteWorkerId));
                    showToast('Worker already removed; list updated', 'info');
                    setShowDeleteConfirm(false);
                    setDeleteWorkerId(null);
                } else {
                    showToast('Error: ' + data.message, 'error');
                }
            }
        } catch (error) {
            console.error('Error deleting worker:', error);
            showToast('Error deleting worker', 'error');
        }
    };

    const confirmDeleteWorker = (workerId) => {
        setDeleteWorkerId(workerId);
        setShowDeleteConfirm(true);
    };

    const cancelDeleteWorker = () => {
        setShowDeleteConfirm(false);
        setDeleteWorkerId(null);
    };

    // ===== CITIZEN MANAGEMENT FUNCTIONS =====
    const fetchCitizenStats = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/citizens/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setCitizenStats(data);
            }
        } catch (error) {
            console.error('Error fetching citizen stats:', error);
        }
    };

    const fetchCitizens = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/citizens`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setCitizens(data.citizens || []);
            }
        } catch (error) {
            console.error('Error fetching citizens:', error);
        }
    };

    const fetchCitizenLeaderboard = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/citizens/leaderboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setCitizenLeaderboard(data.leaderboard || []);
            }
        } catch (error) {
            console.error('Error fetching citizen leaderboard:', error);
        }
    };

    const handleDeleteCitizen = async () => {
        if (!deleteCitizenId) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/citizens/${deleteCitizenId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                showToast('Citizen deleted successfully!', 'success');
                setShowDeleteCitizenConfirm(false);
                setDeleteCitizenId(null);
                fetchCitizens(); // Refresh the list
                fetchCitizenStats(); // Refresh stats
                fetchCitizenLeaderboard(); // Refresh leaderboard
            } else {
                const data = await res.json();
                showToast('Error: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting citizen:', error);
            showToast('Error deleting citizen', 'error');
        }
    };

    const confirmDeleteCitizen = (citizenId) => {
        setDeleteCitizenId(citizenId);
        setShowDeleteCitizenConfirm(true);
    };

    const cancelDeleteCitizen = () => {
        setShowDeleteCitizenConfirm(false);
        setDeleteCitizenId(null);
    };

    // ===== LOAD DATA ON MOUNT =====
    useEffect(() => {
        if (token) {
            // Fetch all citizen data on mount
            fetchCitizenStats();
            fetchCitizens();
            fetchCitizenLeaderboard();
        }
    }, [token]);

    // Keep local worker list in sync with parent-provided data
    useEffect(() => {
        setWorkerList(workers || []);
    }, [workers]);

    // ===== RENDER FUNCTIONS =====
    const renderWorkerManagement = () => (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Worker Management</h1>
                    <p className="text-gray-600 mt-2">Manage worker accounts and credentials</p>
                </div>
                <button
                    onClick={() => {
                        setShowCreateForm(!showCreateForm);
                        if (!showCreateForm) {
                            setWorkerForm({ fullName: '', email: '', password: '', age: '', phoneNumber: '' });
                            setFormKey(prev => prev + 1);
                        }
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    <FaPlus className="text-lg" />
                    {showCreateForm ? 'Cancel' : 'Create New Worker'}
                </button>
            </div>

            {/* Create Worker Form */}
            {showCreateForm && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Create New Worker Account</h2>
                    <form key={formKey} onSubmit={handleCreateWorker} autoComplete="off" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                            <input
                                type="text"
                                name="fullName"
                                value={workerForm.fullName}
                                onChange={handleWorkerFormChange}
                                autoComplete="off"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Enter full name"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                            <input
                                type="email"
                                name="email"
                                value={workerForm.email}
                                onChange={handleWorkerFormChange}
                                autoComplete="off"
                                data-1p-ignore="true"
                                data-lpignore="true"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Enter email"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                            <input
                                type="password"
                                name="password"
                                value={workerForm.password}
                                onChange={handleWorkerFormChange}
                                autoComplete="off"
                                data-1p-ignore="true"
                                data-lpignore="true"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Enter password"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Age (18+)</label>
                            <input
                                type="number"
                                name="age"
                                min={18}
                                value={workerForm.age}
                                onChange={handleWorkerFormChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Enter age (18 or above)"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={workerForm.phoneNumber}
                                onChange={handleWorkerFormChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Enter phone number"
                            />
                        </div>

                        <div className="md:col-span-2 flex gap-4">
                            <button
                                type="submit"
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                            >
                                Create Worker
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Workers List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Existing Workers ({workerList.length})</h2>

                {workerList.length === 0 ? (
                    <div className="text-center py-12">
                        <FaUserFriends className="text-gray-300 text-5xl mx-auto mb-4" />
                        <p className="text-gray-500">No workers found. Create your first worker account.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Full Name</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Password</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workerList.map((worker) => (
                                    <WorkerCard
                                        key={worker.id}
                                        worker={worker}
                                        onViewDetails={viewWorkerDetails}
                                        onDelete={confirmDeleteWorker}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Worker Details Modal */}
            {showWorkerModal && selectedWorker && (
                <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 transform transition-all duration-300 scale-100 border-2 border-purple-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-800">Worker Details</h3>
                            <button
                                onClick={closeWorkerModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                            >
                                <FaTimes className="text-xl" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-2">Full Name</label>
                                <p className="text-xl font-bold text-gray-900 bg-purple-50 p-4 rounded-xl border border-purple-100">{selectedWorker.fullName}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-2">Age</label>
                                <p className="text-xl font-bold text-gray-900 bg-purple-50 p-4 rounded-xl border border-purple-100">{selectedWorker.age} years</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-2">Email</label>
                                <p className="text-xl font-bold text-gray-900 bg-purple-50 p-4 rounded-xl border border-purple-100">{selectedWorker.email}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-2">Password</label>
                                <div className="relative">
                                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 pr-32">
                                        <p className="text-xl font-bold text-gray-900 font-mono">
                                            {showPassword ? selectedWorker.password : '•'.repeat(selectedWorker.password.length)}
                                        </p>
                                    </div>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                                        <button
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="text-purple-600 hover:text-purple-800 text-sm font-bold bg-purple-100 hover:bg-purple-200 px-3 py-2 rounded-lg transition-colors"
                                            title={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? 'Hide' : 'Show'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(selectedWorker.password);
                                                showToast('Password copied to clipboard!', 'success');
                                            }}
                                            className="text-purple-600 hover:text-purple-800 text-sm font-bold bg-purple-100 hover:bg-purple-200 px-3 py-2 rounded-lg transition-colors"
                                            title="Copy password"
                                        >
                                            Copy
                                        </button>
                                        <button
                                            onClick={() => setShowResetPassword(true)}
                                            className="text-red-600 hover:text-red-800 text-sm font-bold bg-red-100 hover:bg-red-200 px-3 py-2 rounded-lg transition-colors"
                                            title="Reset password"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                                <p className="text-lg font-medium text-gray-800 bg-gray-50 p-3 rounded-lg">{selectedWorker.phoneNumber}</p>
                            </div>
                        </div>

                        {/* Password Reset Modal */}
                        {showResetPassword && (
                            <div className="fixed inset-0 bg-white/50 backdrop-blur-md flex items-center justify-center p-4 z-60">
                                <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">Reset Password</h3>
                                    <p className="text-gray-600 text-sm mb-4">Enter new password for {selectedWorker.fullName}</p>

                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        autoComplete="off"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4"
                                        placeholder="Enter new password"
                                    />

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleResetPassword}
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition-colors"
                                        >
                                            Reset Password
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowResetPassword(false);
                                                setNewPassword('');
                                            }}
                                            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={closeWorkerModal}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Worker Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-white/50 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="text-center">
                            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaTrash className="text-red-600 text-2xl" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Worker</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to permanently delete this worker? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDeleteWorker}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors"
                                >
                                    Yes, Delete Worker
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeleteWorkerId(null);
                                    }}
                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderCitizenManagement = () => (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Citizen Management</h1>
                <p className="text-gray-600 mt-2">Manage citizen accounts and view leaderboard</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Citizens */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Total Citizens</p>
                            <p className="text-3xl font-bold text-gray-800 mt-2">{citizenStats.totalCitizens.toLocaleString()}</p>
                        </div>
                        <div className="bg-blue-100 p-4 rounded-full">
                            <FaUsers className="text-blue-600 text-2xl" />
                        </div>
                    </div>
                </div>

                {/* Total Reports */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Total Reports</p>
                            <p className="text-3xl font-bold text-gray-800 mt-2">{citizenStats.totalReports.toLocaleString()}</p>
                        </div>
                        <div className="bg-green-100 p-4 rounded-full">
                            <FaEdit className="text-green-600 text-2xl" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content - Table and Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Citizens Table */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-semibold text-gray-800">All Citizens</h2>
                    </div>

                    {citizens.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="text-gray-400 mb-4">
                                <FaUsers className="text-6xl mx-auto" />
                            </div>
                            <h3 className="text-xl font-medium text-gray-500 mb-2">No citizens found</h3>
                            <p className="text-gray-400">Citizen accounts will appear here</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Reports</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Points</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {citizens.map((citizen, index) => (
                                        <CitizenRow
                                            key={citizen.id}
                                            citizen={citizen}
                                            onDelete={confirmDeleteCitizen}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Leaderboard */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Leaderboard</h2>

                    {citizenLeaderboard.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-400">No ranked citizens yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {citizenLeaderboard.map((user, index) => (
                                <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${index === 0 ? 'bg-yellow-500' :
                                            index === 1 ? 'bg-gray-400' :
                                                index === 2 ? 'bg-amber-600' : 'bg-blue-500'
                                        }`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-800 text-sm truncate">{user.full_name}</p>
                                        <p className="text-xs text-gray-400">{user.total_contributions} reports</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-800">{user.eco_points}</p>
                                        <p className="text-[10px] text-gray-400 uppercase">points</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteCitizenConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <div className="text-center">
                            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaTrash className="text-red-600 text-2xl" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Citizen</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to permanently delete this citizen? This action cannot be undone and will remove all their reports.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDeleteCitizen}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors"
                                >
                                    Yes, Delete Citizen
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeleteCitizenConfirm(false);
                                        setDeleteCitizenId(null);
                                    }}
                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // ===== MAIN RETURN =====
    if (mode === 'citizens') return renderCitizenManagement();
    return renderWorkerManagement();
};

export default AccountManagement;
