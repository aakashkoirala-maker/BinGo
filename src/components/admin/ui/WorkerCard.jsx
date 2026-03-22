import React from 'react';
import { FaTrash } from 'react-icons/fa';

/**
 * WorkerCard - Pure presentational component for a worker table row
 * Receives all data and handler functions as props
 * Zero state, zero logic
 */
export const WorkerCard = ({ worker, onViewDetails, onDelete }) => {
    const displayName = worker.full_name || worker.fullName || worker.name || '';
    const createdAt = worker.created_at || worker.createdAt;
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-4 px-4 font-medium text-gray-800">{displayName}</td>
            <td className="py-4 px-4 text-gray-600">{worker.email}</td>
            <td className="py-4 px-4 text-gray-600">{worker.password}</td>
            <td className="py-4 px-4 text-gray-500 text-sm">
                {createdAt ? new Date(createdAt).toLocaleDateString() : '-'}
            </td>
            <td className="py-4 px-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => onViewDetails(worker.id)}
                        className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                    >
                        View Details
                    </button>
                    <button
                        onClick={() => onDelete(worker.id)}
                        className="text-red-600 hover:text-red-800 font-medium text-sm"
                        title="Delete Worker"
                    >
                        <FaTrash />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default WorkerCard;
