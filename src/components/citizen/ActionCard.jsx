import React from 'react';

// Card component for the main action grid
const ActionCard = ({ title, subtitle, icon, iconBgColor, iconColor, onClick }) => {
    return (
        <div
            onClick={onClick}
            className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 group relative overflow-hidden active:scale-[0.98]"
        >
            {/* Subtle organic background texture */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-2 right-2 w-16 h-16 bg-gray-200 rounded-full blur-xl"></div>
                <div className="absolute bottom-2 left-2 w-12 h-12 bg-gray-300 rounded-full blur-lg"></div>
            </div>
            
            {/* Icon with colored background - more organic shape */}
            <div className={`w-14 h-14 rounded-2xl ${iconBgColor} ${iconColor} flex items-center justify-center text-3xl mb-4 relative z-10 transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1 group-hover:shadow-lg group-active:scale-95`}>
                {icon}
            </div>

            {/* Text Content */}
            <div className="relative z-10">
                <h3 className="font-semibold text-gray-800 text-lg leading-tight mb-2 transition-all duration-300 group-hover:text-blue-600 group-hover:translate-x-1">{title}</h3>
                <p className="text-gray-400 text-xs transition-all duration-300 group-hover:text-gray-500 group-hover:translate-x-0.5">{subtitle}</p>
            </div>
            
            {/* Organic underline effect */}
            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-blue-400/0 via-blue-500 to-blue-400/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center rounded-full"></div>
        </div>
    );
};

export default ActionCard;
