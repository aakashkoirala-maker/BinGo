import React from 'react';
import { FaTimes, FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

const CustomModal = ({ 
    isOpen, 
    onClose, 
    title, 
    message, 
    type = 'info', // info, success, warning, error, confirm
    onConfirm,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isReactNode = false
}) => {
    if (!isOpen) return null;

    const getTypeStyles = () => {
        switch (type) {
            case 'success':
                return {
                    icon: <FaCheckCircle className="text-green-500" />,
                    borderColor: 'border-green-200',
                    bgColor: 'bg-green-50',
                    buttonClass: 'bg-green-600 hover:bg-green-700'
                };
            case 'warning':
                return {
                    icon: <FaExclamationTriangle className="text-yellow-500" />,
                    borderColor: 'border-yellow-200',
                    bgColor: 'bg-yellow-50',
                    buttonClass: 'bg-yellow-600 hover:bg-yellow-700'
                };
            case 'error':
                return {
                    icon: <FaExclamationTriangle className="text-red-500" />,
                    borderColor: 'border-red-200',
                    bgColor: 'bg-red-50',
                    buttonClass: 'bg-red-600 hover:bg-red-700'
                };
            case 'confirm':
                return {
                    icon: <FaExclamationTriangle className="text-blue-500" />,
                    borderColor: 'border-blue-200',
                    bgColor: 'bg-blue-50',
                    buttonClass: 'bg-blue-600 hover:bg-blue-700'
                };
            default:
                return {
                    icon: <FaInfoCircle className="text-blue-500" />,
                    borderColor: 'border-blue-200',
                    bgColor: 'bg-blue-50',
                    buttonClass: 'bg-blue-600 hover:bg-blue-700'
                };
        }
    };

    const styles = getTypeStyles();

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[10000]">
            <div className={`bg-white rounded-2xl shadow-xl border ${styles.borderColor} max-w-md w-full transform transition-all duration-300 scale-100`}>
                {/* Header */}
                <div className={`p-6 border-b ${styles.borderColor} flex items-start justify-between`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${styles.bgColor}`}>
                            {styles.icon}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <FaTimes className="text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {isReactNode ? (
                        <div className="text-gray-600">
                            {message}
                        </div>
                    ) : (
                        <p className="text-gray-600 leading-relaxed">{message}</p>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 pt-0 flex gap-3">
                    {type === 'confirm' ? (
                        <>
                            <button
                                onClick={onConfirm}
                                className={`flex-1 py-3 px-4 rounded-xl text-white font-semibold transition-all ${styles.buttonClass}`}
                            >
                                {confirmText}
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
                            >
                                {cancelText}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className={`w-full py-3 px-4 rounded-xl text-white font-semibold transition-all ${styles.buttonClass}`}
                        >
                            OK
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomModal;