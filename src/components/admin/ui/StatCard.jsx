import React from 'react';

/**
 * StatCard - Pure presentational component for displaying statistics
 * Zero state, zero logic - only receives and displays props
 */
export const StatCard = ({ label, value, icon: Icon, bgColor, iconColor }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm">{label}</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </h3>
                </div>
                <div className={`${bgColor} p-3 rounded-lg`}>
                    <Icon className={`${iconColor} text-xl`} />
                </div>
            </div>
        </div>
    );
};

StatCard.propTypes = {
    label: String,
    value: [Number, String],
    icon: 'component',
    bgColor: String,
    iconColor: String
};

export default StatCard;
