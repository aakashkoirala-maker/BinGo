import React, { useState, useRef } from 'react';
import { FaArrowLeft, FaPlusSquare, FaMapMarkerAlt, FaInfoCircle, FaMedal, FaImage, FaTimes, FaSpinner } from 'react-icons/fa';
import LocationPicker from '@/components/citizen/LocationPicker';
import CustomModal from '@/components/citizen/CustomModal';

const RequestDustbin = ({ onBack }) => {
    const [areaType, setAreaType] = useState('Residential Area');
    const [users, setUsers] = useState('Medium');
    const [reason, setReason] = useState('');
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

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
            showModal('Authentication Required', "You must be logged in to submit a request!", 'error');
            return;
        }

        if (!reason.trim()) {
            showModal('Missing Information', "Please provide a reason for the request.", 'warning');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                areaType,
                estimatedUsers: users,
                reason,
                latitude,
                longitude,
                imageUrls: images.map(img => img.url)
            };

            console.log('[RequestDustbin] FINAL PAYLOAD', payload);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/citizen/request-dustbin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                showModal(
                    'Success!', 
                    "Request submitted successfully! You'll earn 15 points when your request is approved and implemented.", 
                    'success'
                );
            } else {
                showModal('Submission Failed', data.message || "Failed to submit request", 'error');
            }
        } catch (error) {
            console.error("Error:", error);
            showModal('Server Error', error.message || "An error occurred. Please try again.", 'error');
        } finally {
            setLoading(false);
        }
    };

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        
        for (let file of files) {
            // Validate file type
            if (!ALLOWED_TYPES.includes(file.type)) {
                showModal('Invalid File Type', `Invalid file type: ${file.name}. Please upload JPEG, PNG, or WebP images only.`, 'warning');
                continue;
            }
            
            // Validate file size
            if (file.size > MAX_FILE_SIZE) {
                showModal('File Too Large', `File too large: ${file.name}. Maximum size is 10MB.`, 'warning');
                continue;
            }
            
            // Check if we already have 3 images
            if (images.length >= 3) {
                showModal('Limit Reached', 'Maximum 3 images allowed', 'warning');
                break;
            }
            
            setUploading(true);
            
            try {
                const reader = new FileReader();
                reader.onload = (event) => {
                    setImages(prev => [...prev, {
                        id: Date.now() + Math.random(),
                        name: file.name,
                        url: event.target.result,
                        size: file.size
                    }]);
                    setUploading(false);
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Error processing image:', error);
                showModal('Processing Error', 'Failed to process image. Please try again.', 'error');
                setUploading(false);
            }
        }
    };
    
    const removeImage = (id) => {
        setImages(prev => prev.filter(img => img.id !== id));
    };
    
    const triggerFileInput = () => {
        fileInputRef.current?.click();
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

            {/* Header - Green Theme */}
            <button
                onClick={onBack}
                className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-6 transition-all duration-300 hover:scale-105 group"
            >
                <FaArrowLeft className="mr-2 transition-transform group-hover:-translate-x-1" /> Back to Dashboard
            </button>

            <div className="flex items-center gap-4 mb-8">
                <div className="bg-green-100 p-4 rounded-2xl text-green-600 text-2xl">
                    <FaPlusSquare />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Request New Public Dustbin</h1>
                    <p className="text-gray-500 mt-1">Help improve waste management in your area</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">

                {/* Area Type */}
                <section className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Area Type <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {['Residential Area', 'Commercial Area', 'Public Space', 'Park/Recreation'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setAreaType(type)}
                                className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all text-left
                                 ${areaType === type
                                        ? 'bg-gray-600 text-white border-gray-600 shadow-md shadow-gray-100'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Estimated Daily Users */}
                <section className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Estimated Daily Users <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Low', sub: '(<50 people)' },
                            { label: 'Medium', sub: '(50-200)' },
                            { label: 'High', sub: '(>200 people)' }
                        ].map((u) => (
                            <button
                                key={u.label}
                                onClick={() => setUsers(u.label)}
                                className={`py-4 rounded-xl border text-sm font-medium transition-all flex flex-col items-center justify-center
                                    ${users === u.label
                                        ? 'bg-gray-600 text-white border-gray-600 shadow-md shadow-gray-100'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="font-bold">{u.label}</span>
                                <span className={`text-xs mt-1 ${users === u.label ? 'text-gray-200' : 'text-gray-400'}`}>{u.sub}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Reason */}
                <section className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Request <span className="text-red-500">*</span></label>
                    <textarea
                        rows="3"
                        placeholder="Explain why this location needs a new dustbin (e.g., no nearby bins, frequent littering, high foot traffic, etc.)"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-gray-50/50 resize-none"
                    ></textarea>
                </section>

                {/* Proposed Location */}
                <section className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Proposed Location <span className="text-red-500">*</span></label>
                    <LocationPicker
                        latitude={latitude}
                        longitude={longitude}
                        onLocationSelect={(lat, lng) => { setLatitude(lat); setLongitude(lng); }}
                        buttonLabel="Set Proposed Dustbin Location"
                        buttonColorClass="green"
                    />
                </section>

                {/* Image Upload */}
                <section className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Supporting Images <span className="text-gray-400 font-normal">(Optional)</span></label>
                    
                    {/* Hidden file input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        multiple
                        className="hidden"
                    />
                    
                    {/* Upload area */}
                    <div 
                        onClick={triggerFileInput}
                        className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group mb-4"
                    >
                        <div className="bg-gray-100 p-4 rounded-2xl text-gray-400 mb-3 group-hover:text-blue-500 group-hover:bg-blue-50 transition-colors">
                            {uploading ? <FaSpinner className="animate-spin" size={24} /> : <FaImage size={24} />}
                        </div>
                        <h4 className="text-gray-600 font-medium group-hover:text-blue-600">Click to upload images</h4>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP up to 10MB each (Max 3 images)</p>
                        {images.length > 0 && (
                            <p className="text-xs text-blue-500 mt-1">{images.length}/3 images uploaded</p>
                        )}
                    </div>
                    
                    {/* Preview uploaded images */}
                    {images.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                            {images.map((image) => (
                                <div key={image.id} className="relative group">
                                    <img 
                                        src={image.url} 
                                        alt={image.name}
                                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                    />
                                    <button
                                        onClick={() => removeImage(image.id)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    >
                                        <FaTimes size={12} />
                                    </button>
                                    <p className="text-xs text-gray-500 mt-1 truncate">{image.name}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Review Process Info */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 mb-8">
                    <FaInfoCircle className="text-blue-500 mt-1 flex-shrink-0" />
                    <div>
                        <h4 className="font-bold text-gray-800 text-sm">Review Process</h4>
                        <p className="text-xs text-gray-600">Your request will be reviewed by the municipal team. Installation depends on feasibility, budget, and priority assessment.</p>
                    </div>
                </div>

                {/* Points Banner */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-6 flex items-center gap-5 mb-8">
                    <div className="bg-white p-3 rounded-full text-green-600 shadow-sm">
                        <FaMedal size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 text-lg">Earn 15 Points</h4>
                        <p className="text-sm text-gray-600">Help improve waste infrastructure!</p>
                    </div>
                </div>

                {/* Submit Button - Green Theme */}
                <button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-200 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Submitting...' : 'Submit Request'}
                </button>
            </div>
        </div>
    );
};

export default RequestDustbin;
