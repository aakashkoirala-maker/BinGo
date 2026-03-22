import React from 'react';
import { FaBars, FaHome, FaTruck, FaTrash, FaRecycle, FaPaw, FaPlusCircle, FaPhone, FaSignOutAlt } from 'react-icons/fa';

const WorkerSidebar = ({ 
    isSidebarCollapsed, 
    setIsSidebarCollapsed, 
    activeSection, 
    setActiveSection,
    handleLogout 
}) => {
    const menuItems = [
        { id: 'overview', icon: FaHome, label: 'Dashboard' },
        { id: 'household', icon: FaTruck, label: 'Household Waste' },
        { id: 'garbage', icon: FaTrash, label: 'Garbage & Waste' },
        { id: 'dustbin-maint', icon: FaRecycle, label: 'Dustbin Maintenance' },
        { id: 'dead-animal', icon: FaPaw, label: 'Dead Animal' },
        { id: 'dustbin-install', icon: FaPlusCircle, label: 'Dustbin Install' },
        { id: 'notices', icon: FaHome, label: 'Notices' },
        { id: 'contact', icon: FaPhone, label: 'Emergency Contacts' }
    ];

    return (
        <nav className={`${isSidebarCollapsed ? 'w-20' : 'w-72'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
            <div className="p-4 flex items-center justify-between border-b border-gray-200">
                {!isSidebarCollapsed && (
                    <h1 className="text-xl font-bold text-green-600">BinGO Worker</h1>
                )}
                <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="p-2 rounded-lg hover:bg-gray-100"
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
                                ? 'bg-green-600 text-white'
                                : 'text-gray-700 hover:bg-green-50'
                        }`}
                    >
                        <item.icon className="text-lg" />
                        {!isSidebarCollapsed && <span>{item.label}</span>}
                    </button>
                ))}
            </div>

            <div className="p-4 border-t border-gray-200">
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors ${
                        isSidebarCollapsed ? 'justify-center' : ''
                    }`}
                >
                    <FaSignOutAlt className="text-lg" />
                    {!isSidebarCollapsed && <span>Logout</span>}
                </button>
            </div>
        </nav>
    );
};

export default WorkerSidebar;
