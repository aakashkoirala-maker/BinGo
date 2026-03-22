import React, { useState, useEffect } from 'react';
import { FaPhone, FaUserShield, FaPlus, FaToggleOn, FaToggleOff } from 'react-icons/fa';

const ContactAdmin = ({ onBack }) => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Authentication required');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/worker/emergency-contacts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                console.log('[WORKER_CONTACTS] Fetched contacts:', data.contacts);
                setContacts(data.contacts || []);
            } else {
                setError('Failed to load contacts');
            }
        } catch (err) {
            console.error('[WORKER_CONTACTS] Error:', err);
            setError('Error loading contacts');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <button onClick={onBack} className="text-green-600 hover:underline mb-2">← Back to Dashboard</button>
                <h1 className="text-2xl font-bold text-gray-800">Emergency Contacts</h1>
                <p className="text-gray-500 mt-1">Contact numbers managed by administration</p>
            </div>

            {loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="text-green-600">Loading contacts...</div>
                </div>
            ) : error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            ) : contacts.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="text-gray-400 mb-4">
                        <FaPhone className="text-6xl mx-auto" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-500 mb-2">No Emergency Contacts</h3>
                    <p className="text-gray-400">No emergency contacts have been added yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {contacts.map((contact) => (
                        <div key={contact.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-100">
                                        <FaPhone className="text-lg text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">{contact.service_name}</h3>
                                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                                            Active
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mb-4">
                                <p className="text-2xl font-bold text-purple-600">{contact.phone_number}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ContactAdmin;
