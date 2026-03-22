import React, { useState, useRef } from 'react';
import { FaArrowLeft, FaTrash, FaImage, FaMapMarkerAlt, FaMedal, FaTimes, FaSpinner } from 'react-icons/fa';
import LocationPicker from '@/components/citizen/LocationPicker';
import CustomModal from '@/components/citizen/CustomModal';

const ReportWaste = ({ onBack, title, subtitle, icon, headerBg = "bg-blue-100", headerColor = "text-blue-600", reportType = "street_waste" }) => {
    const [selectedType, setSelectedType] = useState('Mixed Waste');
    const [description, setDescription] = useState('');
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

    const wasteTypes = [
        { id: 'Mixed Waste', label: 'Mixed Waste' },
        { id: 'Plastic Items', label: 'Plastic Items' },
        { id: 'Construction Debris', label: 'Construction Debris' },
        { id: 'Organic Waste', label: 'Organic Waste' }
    ];

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
            showModal('Authentication Required', "You must be logged in to submit a report!", 'error');
            return;
        }

        if (!description.trim()) {
            showModal('Missing Information', "Please provide a description.", 'warning');
            return;
        }

        // Check if this is an overflowing dustbin report based on title
        const isDustbinReport = title && title.includes('Dustbin');
        
        setLoading(true);
        try {
            const payload = isDustbinReport 
                ? {
                    areaType: 'Public Space',
                    estimatedUsers: 'Medium',
                    reason: `Overflowing dustbin report: ${description}`,
                    latitude,
                    longitude,
                    imageUrls: images.map(img => img.url)
                }
                : {
                    reportType,
                    wasteType: selectedType,
                    description,
                    latitude,
                    longitude,
                    imageUrls: images.map(img => img.url)
                };

            console.log('[ReportWaste] FINAL PAYLOAD', payload);

            const endpoint = isDustbinReport 
                ? `${import.meta.env.VITE_API_URL}/citizen/request-dustbin`
                : `${import.meta.env.VITE_API_URL}/citizen/report-waste`;
            
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                const pointsMsg = reportType === 'dead_animal' ? '12' : '10';
                showModal(
                    'Success!', 
                    `Report submitted successfully! You'll earn ${pointsMsg} points when your report is verified and completed.`, 
                    'success'
                );
            } else {
                showModal('Submission Failed', data.message || "Failed to submit report", 'error');
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
                // In a real app, you'd upload to a cloud service
                // For now, we'll convert to base64 and store locally
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

            {/* Header */}
            <button
                onClick={onBack}
                className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-6 transition-all duration-300 hover:scale-105 group"
            >
                <FaArrowLeft className="mr-2 transition-transform group-hover:-translate-x-1" /> Back to Dashboard
            </button>

            <div className="flex items-center gap-4 mb-8">
                <div className={`${headerBg} p-4 rounded-2xl ${headerColor} text-2xl`}>
                    {icon || <FaTrash />}
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
                    <p className="text-gray-500 mt-1">{subtitle}</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">

                {/* Type of Waste */}
                <section className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Type of Waste</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {wasteTypes.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setSelectedType(type.id)}
                                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2
                            ${selectedType === type.id
                                        ? 'bg-gray-600 text-white border-gray-600 shadow-md shadow-gray-100'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                                    }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Description */}
                <section className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description <span className="text-red-500">*</span></label>
                    <textarea
                        rows="4"
                        placeholder="Describe the waste on the street - location details, approximate amount, any hazards, etc."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-gray-50/50 resize-none"
                    ></textarea>
                    <div className="flex justify-between mt-2 text-xs text-gray-400">
                        <span>{description.length}/500 characters</span>
                        <span className="text-blue-500">Be as detailed as possible</span>
                    </div>
                </section>

                {/* Location */}
                <section className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <LocationPicker
                        latitude={latitude}
                        longitude={longitude}
                        onLocationSelect={(lat, lng) => { setLatitude(lat); setLongitude(lng); }}
                        buttonLabel="Set Waste Location on Map"
                        buttonColorClass="blue"
                    />
                </section>

                {/* Image Upload */}
                <section className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Images <span className="text-gray-400 font-normal">(Optional but recommended)</span></label>
                    
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

                {/* Points Banner */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 flex items-center gap-5 mb-8">
                    <div className="bg-white p-3 rounded-full text-blue-600 shadow-sm">
                        <FaMedal size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 text-lg">Earn 10 Points</h4>
                        <p className="text-sm text-gray-600">Thank you for keeping our streets clean!</p>
                    </div>
                </div>

                {/* Submit Button */}
                <button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Submitting...' : 'Submit Report'}
                </button>

            </div>
        </div>
    );
};

export default ReportWaste;
