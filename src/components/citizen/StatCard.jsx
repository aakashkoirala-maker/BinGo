import React from 'react';

// Reusable card for displaying dashboard statistics
const StatCard = ({ label, count, icon, iconColor, bgHover }) => {
    return (
        <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-gray-200 group active:scale-[0.99] relative overflow-hidden`}>
            {/* Subtle background accent */}
            <div className="absolute inset-0 opacity-3 rounded-2xl">
                <div className="absolute top-3 right-3 w-20 h-20 bg-current rounded-full blur-2xl"></div>
            </div>
            
            <div className="relative z-10">
                <p className="text-gray-400 text-sm font-medium mb-1 transition-all duration-300 group-hover:text-gray-500 group-hover:translate-x-1">{label}</p>
                <h2 className="text-3xl font-semibold text-gray-800 transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-0.5">{count}</h2>
            </div>

            {/* Icon Container - more organic movement */}
            <div className={`text-4xl ${iconColor} transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-active:scale-95 relative z-10`}>
                {icon}
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-current opacity-10 rounded-full blur-md scale-125"></div>
            </div>
        </div>
    );
};

export default StatCard;
