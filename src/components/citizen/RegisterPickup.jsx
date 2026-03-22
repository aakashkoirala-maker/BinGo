import React, { useState } from 'react';
import { FaArrowLeft, FaMapMarkerAlt, FaHome, FaMoneyBillWave } from 'react-icons/fa';
import LocationPicker from '@/components/citizen/LocationPicker';
import CustomModal from '@/components/citizen/CustomModal';

const RegisterPickup = ({ onBack }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        ward: '',
        houseNumber: '',
        fullAddress: '',
        latitude: null, // For future map integration
        longitude: null
    });
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const showModal = (title, message, type = 'info') => {
        setModal({
            isOpen: true,
            title,
            message,
            type
        });
    };

    const closeModal = () => {
        const wasSuccess = modal.type === 'success';
        setModal({
            isOpen: false,
            title: '',
            message: '',
            type: 'info'
        });
        if (wasSuccess && onBack) {
            onBack();
        }
    };

    const handleSubmit = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            showModal('Authentication Required', 'You must be logged in to register!', 'error');
            return;
        }

        if (!formData.fullName || !formData.phone || !formData.ward || !formData.houseNumber || !formData.fullAddress) {
            showModal('Missing Information', 'Please fill all mandatory fields.', 'warning');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/citizen/register-pickup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (res.ok) {
                showModal(
                    'Success!', 
                    "Pickup Registered Successfully! You'll earn 5 points when your request is approved.", 
                    'success'
                );
            } else {
                showModal('Registration Failed', data.message || "Registration failed", 'error');
            }
        } catch (error) {
            console.error("Error:", error);
            showModal('Server Error', error.message || "An error occurred. Please try again.", 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Custom Modal */}
            <CustomModal
                isOpen={modal.isOpen}
                onClose={closeModal}
                title={modal.title}
                message={modal.message}
                type={modal.type}
            />

            {/* Header */}
            <button
                onClick={onBack}
                className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-6 transition-all duration-300 hover:scale-105 group"
            >
                <FaArrowLeft className="mr-2 transition-transform group-hover:-translate-x-1" /> Back to Dashboard
            </button>

            <div className="flex items-center gap-4 mb-8">
                <div className="bg-green-100 p-4 rounded-2xl text-green-600 text-2xl">
                    <FaHome />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Register Household Waste Pickup</h1>
                    <p className="text-gray-500 mt-1">Schedule regular waste collection for your household</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">

                {/* Personal Information */}
                <section className="mb-8">
                    <h3 className="flex items-center text-lg font-bold text-gray-800 mb-4 gap-2">
                        Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-gray-50/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number <span className="text-red-500">*</span></label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Enter your phone number"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-gray-50/50"
                            />
                        </div>
                    </div>
                </section>

                {/* Address Information */}
                <section className="mb-8">
                    <h3 className="flex items-center text-lg font-bold text-gray-800 mb-4 gap-2">
                        Address Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Ward <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="ward"
                                value={formData.ward}
                                onChange={handleChange}
                                placeholder="Enter ward number"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-gray-50/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">House Number <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="houseNumber"
                                value={formData.houseNumber}
                                onChange={handleChange}
                                placeholder="Enter house number"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-gray-50/50"
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Address <span className="text-red-500">*</span></label>
                        <textarea
                            rows="2"
                            name="fullAddress"
                            value={formData.fullAddress}
                            onChange={handleChange}
                            placeholder="Enter your complete address"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-gray-50/50 resize-none"
                        ></textarea>
                    </div>

                    {/* Map Location Picker */}
                    <LocationPicker
                        latitude={formData.latitude}
                        longitude={formData.longitude}
                        onLocationSelect={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
                        buttonLabel="Set Your House Location on Map"
                        buttonColorClass="blue"
                    />
                </section>

                {/* Service Fee Box */}
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-green-100 p-3 rounded-full text-green-600">
                            <FaMoneyBillWave size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800">Municipal Waste Service Fee</h4>
                            <p className="text-sm text-gray-500">Monthly service fee for regular collection</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="block text-3xl font-bold text-green-600">Rs. 500</span>
                        <span className="text-xs text-green-600/80 font-medium">Billed Monthly</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 border-t border-gray-100">
                    <button 
                        onClick={onBack} 
                        className="px-8 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all duration-200 active:scale-95 hover:-translate-y-0.5"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Submitting...' : 'Submit Registration'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default RegisterPickup;
