import React from 'react';
import { FaTrash } from 'react-icons/fa';

/**
 * CitizenRow - Pure presentational component for a citizen table row
 * Zero state, zero logic
 */
export const CitizenRow = ({ citizen, onDelete }) => {
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-4 px-4 font-medium text-gray-800">
                C{String(citizen.id).padStart(3, '0')}
            </td>
            <td className="py-4 px-4 text-gray-600">{citizen.full_name}</td>
            <td className="py-4 px-4 text-gray-600">{citizen.email}</td>
            <td className="py-4 px-4 text-gray-600">{citizen.report_count}</td>
            <td className="py-4 px-4 text-gray-600 font-medium">{citizen.eco_points}</td>
            <td className="py-4 px-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                </span>
            </td>
            <td className="pycd server-4 px-4">
                <button
                    onClick={() => onDelete(citizen.id)}
                    className="text-red-600 hover:text-red-800 font-medium text-sm flex items-center gap-1"
                    title="Delete Citizen"
                >
                    <FaTrash />
                </button>
            </td>
        </tr>
    );
};

export default CitizenRow;
