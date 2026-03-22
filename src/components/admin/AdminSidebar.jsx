import React from 'react';
import { FaBars, FaHome, FaUserFriends, FaCalendarAlt, FaCheckCircle, FaEye, FaUsers, FaClipboard, FaPhone, FaUser, FaSignOutAlt } from 'react-icons/fa';

const AdminSidebar = ({ 
    isSidebarCollapsed, 
    setIsSidebarCollapsed, 
    activeSection, 
    setActiveSection,
    handleLogout 
}) => {
    const menuItems = [
        { id: 'overview', icon: FaHome, label: 'Dashboard' },
        { id: 'worker-management', icon: FaUserFriends, label: 'Worker Management' },
        { id: 'household-schedule', icon: FaCalendarAlt, label: 'Pickup Schedule & Areas' },
        { id: 'approve-requests', icon: FaCheckCircle, label: 'Approve Requests' },
        { id: 'monitor-requests', icon: FaEye, label: 'Monitor Requests' },
        { id: 'citizen-management', icon: FaUsers, label: 'Citizen Management' },
        { id: 'notice-board', icon: FaClipboard, label: 'Notice Board' },
        { id: 'emergency-contacts', icon: FaPhone, label: 'Emergency Contacts' },
        { id: 'admin-profile', icon: FaUser, label: 'Admin Profile' }
    ];

    return (
        <nav className={`${isSidebarCollapsed ? 'w-20' : 'w-72'} bg-purple-700 text-white flex flex-col transition-all duration-300 shadow-xl h-screen sticky top-0 left-0 flex-none`}>
            <div className="p-4 flex items-center justify-between border-b border-purple-500/40">
                {!isSidebarCollapsed && (
                    <h1 className="text-xl font-bold">BinGO Admin</h1>
                )}
                <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="p-2 rounded-lg hover:bg-white/10"
                    aria-label="Toggle sidebar"
                >
                    <FaBars />
                </button>
            </div>

            <div className="flex-1 py-4 overflow-y-auto">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            activeSection === item.id
                                ? 'bg-white text-purple-700 shadow-sm'
                                : 'text-white/90 hover:bg-white/10'
                        }`}
                    >
                        <item.icon className="text-lg" />
                        {!isSidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                    </button>
                ))}
            </div>

            <div className="p-4 border-t border-purple-500/40">
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-red-100 hover:bg-white/10 transition-colors ${
                        isSidebarCollapsed ? 'justify-center' : ''
                    }`}
                >
                    <FaSignOutAlt className="text-lg" />
                    {!isSidebarCollapsed && <span className="font-medium">Logout</span>}
                </button>
            </div>
        </nav>
    );
};

export default AdminSidebar;
