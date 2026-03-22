import React from 'react';
import { FaEye, FaUserFriends } from 'react-icons/fa';

/**
 * RequestCard - Pure presentational component for a request table row
 * Used in Monitor Requests section
 * Zero state, zero logic
 */
export const RequestCard = ({ request, onViewDetails, onAssignWorker }) => {
    // Status badge color mapping
    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'Assigned':
                return 'bg-blue-100 text-blue-800';
            case 'In Progress':
                return 'bg-purple-100 text-purple-800';
            case 'Completed':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Priority badge color
    const getPriorityBadgeColor = (priority) => {
        return priority === 'High'
            ? 'bg-red-100 text-red-800'
            : 'bg-gray-100 text-gray-800';
    };

    return (
        <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {request.id}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {request.type}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {request.citizen_name}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500">
                {request.location}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeColor(request.priority)}`}>
                    {request.priority}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(request.status)}`}>
                    {request.status}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {request.assigned_worker ? `Worker ${request.assigned_worker}` : 'Not assigned'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                    <button
                        onClick={() => onViewDetails(request.id, request.type)}
                        className="text-purple-600 hover:text-purple-900"
                        title="View Details"
                    >
                        <FaEye />
                    </button>
                    <button
                        onClick={() => onAssignWorker(request.id, request.type)}
                        className="text-green-600 hover:text-green-900"
                        title="Assign Worker"
                    >
                        <FaUserFriends />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default RequestCard;
