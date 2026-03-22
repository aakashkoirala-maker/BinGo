import React, { useState, useEffect } from 'react';
import { FaPlus, FaTimes, FaEdit, FaTrash } from 'react-icons/fa';
import { useAdminToast } from '../../utils/adminToastContext';

const MunicipalityServices = ({ workers, token, mode = 'schedule' }) => {
    const { showToast } = useAdminToast();
    const dayOptions = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Household Schedule States
    const [wardSchedules, setWardSchedules] = useState([]);
    const [areaRoutes, setAreaRoutes] = useState([]);
    const [showAddWardModal, setShowAddWardModal] = useState(false);
    const [showAddAreaModal, setShowAddAreaModal] = useState(false);
    const [showAssignWorkerModal, setShowAssignWorkerModal] = useState(false);
    const [selectedAreaForAssignment, setSelectedAreaForAssignment] = useState(null);
    const [wardForm, setWardForm] = useState({ day_of_week: 'Sunday', ward_numbers: [] });
    const [areaForm, setAreaForm] = useState({ ward_number: 1, area_name: '', description: '' });
    const [workerAssignmentForm, setWorkerAssignmentForm] = useState({ worker_id: '', area_id: '' });
    const [isAddingWard, setIsAddingWard] = useState(false);
    const [isAddingArea, setIsAddingArea] = useState(false);
    const [wardInput, setWardInput] = useState('');

    // Notice Board States
    const [notices, setNotices] = useState([]);
    const [showNoticeModal, setShowNoticeModal] = useState(false);
    const [editingNotice, setEditingNotice] = useState(null);
    const [noticeForm, setNoticeForm] = useState({ title: '', description: '', expires_at: '' });
    const [deleteNoticeId, setDeleteNoticeId] = useState(null);
    const [showDeleteNoticeConfirm, setShowDeleteNoticeConfirm] = useState(false);

    // Emergency Contacts States
    const [emergencyContacts, setEmergencyContacts] = useState([]);
    const [showEmergencyContactModal, setShowEmergencyContactModal] = useState(false);
    const [editingEmergencyContact, setEditingEmergencyContact] = useState(null);
    const [emergencyContactForm, setEmergencyContactForm] = useState({ service_name: '', phone_number: '' });

    // Load data on mount
    useEffect(() => {
        if (token) {
            fetchWardSchedules();
            fetchAreaRoutes();
            fetchNotices();
            fetchEmergencyContacts();
        }
    }, [token]);

    // FETCH FUNCTIONS
    const fetchWardSchedules = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/schedule/wards`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setWardSchedules(data.schedules || []);
            }
        } catch (error) {
            console.error('Error fetching ward schedules:', error);
        }
    };

    const fetchAreaRoutes = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/schedule/areas`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAreaRoutes(data.areas || []);
            }
        } catch (error) {
            console.error('Error fetching area routes:', error);
        }
    };

    const fetchNotices = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/notices`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotices(data.notices || []);
            }
        } catch (error) {
            console.error('Error fetching notices:', error);
        }
    };

    const fetchEmergencyContacts = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/emergency-contacts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEmergencyContacts(data.contacts || []);
            }
        } catch (error) {
            console.error('Error fetching emergency contacts:', error);
        }
    };

    // HOUSEHOLD SCHEDULE HANDLERS
    const handleAddWardSchedule = async (e) => {
        e.preventDefault();
        if (!token) return;
        const parsedWards = (wardForm.ward_numbers.length ? wardForm.ward_numbers : wardInput.split(',')
            .map((w) => Number(String(w).trim()))
            .filter((w) => !Number.isNaN(w) && w > 0))
            .map((w) => Number(w));

        if (parsedWards.length === 0) {
            showToast('Add at least one ward number', 'warning');
            return;
        }
        setIsAddingWard(true);
        let addedCount = 0;
        for (const wardNumber of parsedWards) {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/schedule/wards`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ day_of_week: wardForm.day_of_week, ward_number: wardNumber })
                });
                if (res.ok) addedCount++;
            } catch (error) {
                console.error(`Error adding ward ${wardNumber}:`, error);
            }
        }
        setIsAddingWard(false);
        if (addedCount > 0) {
            setShowAddWardModal(false);
            setWardForm({ day_of_week: 'Sunday', ward_numbers: [] });
            setWardInput('');
            fetchWardSchedules();
            showToast(`Added ${addedCount} ward(s)`, 'success');
        }
    };

    const handleDeleteWardSchedule = async (scheduleId) => {
        if (!token) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/schedule/wards/${scheduleId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchWardSchedules();
        } catch (error) {
            console.error('Error deleting ward schedule:', error);
        }
    };

    const handleAddAreaRoute = async (e) => {
        e.preventDefault();
        if (!token || isAddingArea) return;
        setIsAddingArea(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/schedule/areas`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(areaForm)
            });
            const data = await res.json();
            if (res.ok) {
                setShowAddAreaModal(false);
                setAreaForm({ ward_number: 1, area_name: '', description: '' });
                fetchAreaRoutes();
                showToast('Area added successfully!', 'success');
            }
        } catch (error) {
            console.error('Error adding area route:', error);
            showToast('Error adding area', 'error');
        } finally {
            setIsAddingArea(false);
        }
    };

    const handleDeleteAreaRoute = async (areaId) => {
        if (!token) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/schedule/areas/${areaId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchAreaRoutes();
        } catch (error) {
            console.error('Error deleting area route:', error);
        }
    };

    const handleAssignWorker = async (e) => {
        e.preventDefault();
        if (!token) return;
        const areaId = workerAssignmentForm.area_id || selectedAreaForAssignment?.id;
        if (!areaId) {
            showToast('Select an area before assigning', 'warning');
            return;
        }
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/schedule/assign-worker`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...workerAssignmentForm, area_id: areaId })
            });
            if (res.ok) {
                setShowAssignWorkerModal(false);
                setWorkerAssignmentForm({ worker_id: '', area_id: '' });
                fetchAreaRoutes();
                showToast('Worker assigned successfully!', 'success');
            }
        } catch (error) {
            console.error('Error assigning worker:', error);
            showToast('Error assigning worker', 'error');
        }
    };

    // NOTICE BOARD HANDLERS
    const handleCreateNotice = async (e) => {
        e.preventDefault();
        if (!token) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/notices`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(noticeForm)
            });
            if (res.ok) {
                setShowNoticeModal(false);
                setNoticeForm({ title: '', description: '', expires_at: '' });
                setEditingNotice(null);
                fetchNotices();
                showToast('Notice created successfully!', 'success');
            }
        } catch (error) {
            console.error('Error creating notice:', error);
            showToast('Error creating notice', 'error');
        }
    };

    const handleUpdateNotice = async (e) => {
        e.preventDefault();
        if (!token || !editingNotice) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/notices/${editingNotice.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(noticeForm)
            });
            if (res.ok) {
                setShowNoticeModal(false);
                setNoticeForm({ title: '', description: '', expires_at: '' });
                setEditingNotice(null);
                fetchNotices();
                showToast('Notice updated successfully!', 'success');
            }
        } catch (error) {
            console.error('Error updating notice:', error);
            showToast('Error updating notice', 'error');
        }
    };

    const handleDeleteNotice = async () => {
        if (!deleteNoticeId || !token) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/notices/${deleteNoticeId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setShowDeleteNoticeConfirm(false);
                setDeleteNoticeId(null);
                fetchNotices();
                showToast('Notice deleted successfully!', 'success');
            }
        } catch (error) {
            console.error('Error deleting notice:', error);
            showToast('Error deleting notice', 'error');
        }
    };

    const openEditNotice = (notice) => {
        setEditingNotice(notice);
        setNoticeForm({
            title: notice.title,
            description: notice.description,
            expires_at: notice.expires_at ? String(notice.expires_at).split('T')[0] : ''
        });
        setShowNoticeModal(true);
    };

    const openNewNotice = () => {
        setEditingNotice(null);
        setNoticeForm({ title: '', description: '', expires_at: '' });
        setShowNoticeModal(true);
    };

    // EMERGENCY CONTACTS HANDLERS
    const handleCreateEmergencyContact = async (e) => {
        e.preventDefault();
        if (!token) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/emergency-contacts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emergencyContactForm)
            });
            if (res.ok) {
                setShowEmergencyContactModal(false);
                setEmergencyContactForm({ service_name: '', phone_number: '' });
                setEditingEmergencyContact(null);
                fetchEmergencyContacts();
                showToast('Emergency contact created successfully!', 'success');
            }
        } catch (error) {
            console.error('Error creating emergency contact:', error);
            showToast('Error creating emergency contact', 'error');
        }
    };

    const handleUpdateEmergencyContact = async (e) => {
        e.preventDefault();
        if (!token || !editingEmergencyContact) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/emergency-contacts/${editingEmergencyContact.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emergencyContactForm)
            });
            if (res.ok) {
                setShowEmergencyContactModal(false);
                setEmergencyContactForm({ service_name: '', phone_number: '' });
                setEditingEmergencyContact(null);
                fetchEmergencyContacts();
                showToast('Emergency contact updated successfully!', 'success');
            }
        } catch (error) {
            console.error('Error updating emergency contact:', error);
            showToast('Error updating emergency contact', 'error');
        }
    };

    const handleToggleEmergencyContactStatus = async (contact) => {
        if (!token) return;
        const newStatus = !contact.is_active;
        if (!confirm(`Are you sure you want to ${newStatus ? 'enable' : 'disable'} this contact?`)) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/emergency-contacts/${contact.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_active: newStatus })
            });
            if (res.ok) {
                fetchEmergencyContacts();
                showToast(`Emergency contact ${newStatus ? 'enabled' : 'disabled'} successfully!`, 'success');
            }
        } catch (error) {
            console.error('Error toggling emergency contact status:', error);
            showToast('Error updating emergency contact', 'error');
        }
    };

    const openEditEmergencyContact = (contact) => {
        setEditingEmergencyContact(contact);
        setEmergencyContactForm({
            service_name: contact.service_name,
            phone_number: contact.phone_number
        });
        setShowEmergencyContactModal(true);
    };

    const openNewEmergencyContact = () => {
        setEditingEmergencyContact(null);
        setEmergencyContactForm({ service_name: '', phone_number: '' });
        setShowEmergencyContactModal(true);
    };

    const renderSchedule = () => {
        const groupedSchedules = dayOptions.reduce((acc, day) => ({ ...acc, [day]: [] }), {});
        wardSchedules.forEach((ws) => {
            if (groupedSchedules[ws.day_of_week]) {
                groupedSchedules[ws.day_of_week].push(ws);
            }
        });

        return (
            <>
                <div className="space-y-6">
                    <div><h1 className="text-3xl font-bold text-gray-800">Pickup Schedule & Areas</h1></div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold">Ward Schedules</h2>
                            <button onClick={() => setShowAddWardModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg">
                                <FaPlus className="inline mr-2" /> Add Ward
                            </button>
                        </div>
                        {wardSchedules.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No wards scheduled yet</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {dayOptions.map((day) => {
                                    const wards = groupedSchedules[day] || [];
                                    return (
                                        <div key={day} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="font-semibold text-gray-800">{day}</p>
                                                <span className="text-xs px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-600">{wards.length} ward(s)</span>
                                            </div>
                                            {wards.length === 0 ? (
                                                <p className="text-xs text-gray-500">No wards assigned</p>
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    {wards.map((ws) => (
                                                        <span key={ws.id} className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-full border border-purple-200 text-sm text-purple-700">
                                                            Ward {ws.ward_number}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteWardSchedule(ws.id)}
                                                                className="text-red-500 hover:text-red-700"
                                                                aria-label="Remove ward"
                                                            >
                                                                <FaTimes />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold">Areas & Routes</h2>
                            <button onClick={() => setShowAddAreaModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg">
                                <FaPlus className="inline mr-2" /> Add Area
                            </button>
                        </div>
                        <div className="space-y-3">
                            {areaRoutes.length === 0 ? (
                                <p className="text-center py-8 text-gray-500">No areas configured</p>
                            ) : (
                                areaRoutes.map(area => (
                                    <div key={area.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 p-4 bg-gray-50 rounded border border-gray-100">
                                        <div className="space-y-1">
                                            <p className="font-semibold text-gray-800">Ward {area.ward_number} · {area.area_name}</p>
                                            <p className="text-xs text-gray-500">{area.description || 'No description provided'}</p>
                                            {area.assigned_worker_name && (
                                                <p className="text-xs text-green-700">Assigned to {area.assigned_worker_name}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => { setSelectedAreaForAssignment(area); setWorkerAssignmentForm({ worker_id: '', area_id: area.id }); setShowAssignWorkerModal(true); }}
                                            className="text-purple-600 text-sm font-medium hover:text-purple-800"
                                        >
                                            Assign
                                        </button>
                                        <button onClick={() => handleDeleteAreaRoute(area.id)} className="text-red-600 hover:text-red-800" aria-label="Delete area">
                                            <FaTrash />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {showAddWardModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
                            <h3 className="text-xl font-bold mb-4">Add Ward Schedule</h3>
                            <form onSubmit={handleAddWardSchedule} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Day of Week</label>
                                    <select
                                        value={wardForm.day_of_week}
                                        onChange={(e) => setWardForm({ ...wardForm, day_of_week: e.target.value })}
                                        className="w-full p-3 border border-gray-300 rounded-lg"
                                    >
                                        {dayOptions.map((day) => (
                                            <option key={day} value={day}>{day}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ward Numbers</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., 1, 3, 5"
                                        value={wardInput}
                                        onChange={(e) => setWardInput(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Comma-separated to add multiple wards at once.</p>
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => { setShowAddWardModal(false); setWardInput(''); setWardForm({ day_of_week: 'Sunday', ward_numbers: [] }); }} className="flex-1 px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                                    <button type="submit" disabled={isAddingWard} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg">
                                        {isAddingWard ? 'Adding...' : 'Add'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showAddAreaModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
                            <h3 className="text-xl font-bold mb-4">Add Area</h3>
                            <form onSubmit={handleAddAreaRoute} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ward Number</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={areaForm.ward_number}
                                        onChange={(e) => setAreaForm({ ...areaForm, ward_number: Number(e.target.value) })}
                                        className="w-full p-3 border border-gray-300 rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Area Name</label>
                                    <input
                                        type="text"
                                        placeholder="Area Name"
                                        value={areaForm.area_name}
                                        onChange={(e) => setAreaForm({ ...areaForm, area_name: e.target.value })}
                                        className="w-full p-3 border border-gray-300 rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description (optional)</label>
                                    <textarea
                                        placeholder="Notes about this area or route"
                                        value={areaForm.description}
                                        onChange={(e) => setAreaForm({ ...areaForm, description: e.target.value })}
                                        className="w-full p-3 border border-gray-300 rounded-lg"
                                        rows="3"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => { setShowAddAreaModal(false); setAreaForm({ ward_number: 1, area_name: '', description: '' }); }} className="flex-1 px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                                    <button type="submit" disabled={isAddingArea} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg">
                                        {isAddingArea ? 'Adding...' : 'Add Area'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showAssignWorkerModal && selectedAreaForAssignment && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
                            <h3 className="text-xl font-bold mb-4">Assign Worker</h3>
                            <div className="mb-4 text-sm text-gray-600">
                                <p className="font-semibold text-gray-800">{selectedAreaForAssignment.area_name}</p>
                                <p>Ward {selectedAreaForAssignment.ward_number}</p>
                            </div>
                            <form onSubmit={handleAssignWorker} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Worker</label>
                                    <select
                                        value={workerAssignmentForm.worker_id}
                                        onChange={(e) => setWorkerAssignmentForm({ ...workerAssignmentForm, worker_id: e.target.value })}
                                        className="w-full p-3 border border-gray-300 rounded-lg"
                                        required
                                    >
                                        <option value="">Select Worker...</option>
                                        {workers && workers.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => { setShowAssignWorkerModal(false); setWorkerAssignmentForm({ worker_id: '', area_id: '' }); setSelectedAreaForAssignment(null); }} className="flex-1 px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                                    <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg">Assign</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </>
        );
    };

    const renderNoticeBoard = () => (
        <>
            <div className="space-y-6">
                <div><h1 className="text-3xl font-bold text-gray-800">Notice Board</h1></div>
                <button onClick={openNewNotice} className="px-6 py-3 bg-purple-600 text-white rounded-lg"><FaPlus /> Add Notice</button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {notices.length === 0 ? (
                        <p className="col-span-2 text-center py-12 text-gray-500">No notices</p>
                    ) : (
                        notices.map(notice => (
                            <div key={notice.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-semibold text-gray-800">{notice.title}</h3>
                                    <button onClick={() => openEditNotice(notice)} className="text-blue-600"><FaEdit /></button>
                                </div>
                                <p className="text-sm text-gray-600">{notice.description}</p>
                                <p className="text-xs text-gray-500 mt-2">Expires: {notice.expires_at}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showNoticeModal && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white rounded-xl p-6 w-full max-w-md"><h3 className="text-xl font-bold mb-4">{editingNotice ? 'Edit' : 'Add'} Notice</h3><form onSubmit={editingNotice ? handleUpdateNotice : handleCreateNotice}><input type="text" placeholder="Title" value={noticeForm.title} onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })} className="w-full p-2 border border-gray-300 rounded mb-3" required /><textarea placeholder="Description" value={noticeForm.description} onChange={(e) => setNoticeForm({ ...noticeForm, description: e.target.value })} className="w-full p-2 border border-gray-300 rounded mb-3" rows="3" required /><input type="date" value={noticeForm.expires_at} onChange={(e) => setNoticeForm({ ...noticeForm, expires_at: e.target.value })} className="w-full p-2 border border-gray-300 rounded mb-4" required /><div className="flex gap-3"><button type="button" onClick={() => { setShowNoticeModal(false); setEditingNotice(null); }} className="flex-1 px-4 py-2 bg-gray-300 rounded">Cancel</button><button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded">Save</button></div></form></div></div>}
        </>
    );

    const renderEmergencyContacts = () => (
        <>
            <div className="space-y-6">
                <div><h1 className="text-3xl font-bold text-gray-800">Emergency Contacts</h1></div>
                <button onClick={openNewEmergencyContact} className="px-6 py-3 bg-purple-600 text-white rounded-lg"><FaPlus /> Add Contact</button>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {emergencyContacts.length === 0 ? (
                        <p className="col-span-3 text-center py-12 text-gray-500">No emergency contacts</p>
                    ) : (
                        emergencyContacts.map(contact => (
                            <div key={contact.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-semibold text-gray-800 mb-2">{contact.service_name}</h3>
                                <p className="text-2xl font-bold text-purple-600 mb-4">{contact.phone_number}</p>
                                <button onClick={() => openEditEmergencyContact(contact)} className="w-full py-2 bg-blue-100 text-blue-600 rounded text-sm"><FaEdit className="inline mr-1" /> Edit</button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showEmergencyContactModal && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white rounded-xl p-6 w-full max-w-md"><h3 className="text-xl font-bold mb-4">{editingEmergencyContact ? 'Edit' : 'Add'} Contact</h3><form onSubmit={editingEmergencyContact ? handleUpdateEmergencyContact : handleCreateEmergencyContact}><input type="text" placeholder="Service Name" value={emergencyContactForm.service_name} onChange={(e) => setEmergencyContactForm({ ...emergencyContactForm, service_name: e.target.value })} className="w-full p-2 border border-gray-300 rounded mb-3" required /><input type="text" placeholder="Phone Number" value={emergencyContactForm.phone_number} onChange={(e) => setEmergencyContactForm({ ...emergencyContactForm, phone_number: e.target.value })} className="w-full p-2 border border-gray-300 rounded mb-4" required /><div className="flex gap-3"><button type="button" onClick={() => { setShowEmergencyContactModal(false); setEditingEmergencyContact(null); }} className="flex-1 px-4 py-2 bg-gray-300 rounded">Cancel</button><button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded">Save</button></div></form></div></div>}
        </>
    );

    if (mode === 'notice') return renderNoticeBoard();
    if (mode === 'emergency') return renderEmergencyContacts();
    return renderSchedule();
};

export default MunicipalityServices;
