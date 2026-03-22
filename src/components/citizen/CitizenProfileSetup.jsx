import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaCalendarAlt, FaPhone, FaArrowRight, FaCheckCircle } from 'react-icons/fa';

const CitizenProfileSetup = ({ onComplete }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: '',
        age: '',
        phone_number: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [generalError, setGeneralError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.full_name || formData.full_name.trim().length < 2) {
            newErrors.full_name = 'Full name is required (at least 2 characters)';
        }

        if (!formData.age || formData.age < 1 || formData.age > 150) {
            newErrors.age = 'Please enter a valid age (1-150)';
        }

        if (!formData.phone_number || formData.phone_number.trim().length < 7) {
            newErrors.phone_number = 'Please enter a valid phone number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGeneralError('');

        if (!validate()) {
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            setGeneralError('Authentication required. Please login again.');
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/citizen/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                console.log('[CITIZEN_PROFILE] Profile updated successfully');
                navigate('/citizen-dashboard');
            } else {
                setGeneralError(data.message || 'Failed to update profile');
            }
        } catch (err) {
            console.error('[CITIZEN_PROFILE] Error:', err);
            setGeneralError('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#5B8FF6] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <FaUser className="text-4xl text-[#5B8FF6]" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h1>
                    <p className="text-white/80">Please provide your details to continue</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {generalError && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {generalError}
                            </div>
                        )}

                        {/* Full Name */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B8FF6] ${errors.full_name ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="Enter your full name"
                                />
                            </div>
                            {errors.full_name && (
                                <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>
                            )}
                        </div>

                        {/* Age */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">
                                Age <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <FaCalendarAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    min="1"
                                    max="150"
                                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B8FF6] ${errors.age ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="Enter your age"
                                />
                            </div>
                            {errors.age && (
                                <p className="text-red-500 text-sm mt-1">{errors.age}</p>
                            )}
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">
                                Phone Number <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <FaPhone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="tel"
                                    name="phone_number"
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B8FF6] ${errors.phone_number ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="Enter your phone number"
                                />
                            </div>
                            {errors.phone_number && (
                                <p className="text-red-500 text-sm mt-1">{errors.phone_number}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-[#5B8FF6] text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#4a7de6] transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                'Saving...'
                            ) : (
                                <>
                                    Save & Continue
                                    <FaArrowRight />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Info Box */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                        <div className="flex items-start gap-3">
                            <FaCheckCircle className="text-[#5B8FF6] mt-1 flex-shrink-0" />
                            <p className="text-sm text-gray-600">
                                Your information is required for municipal records and emergency contact purposes.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CitizenProfileSetup;
