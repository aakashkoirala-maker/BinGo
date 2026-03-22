import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { FaTrophy, FaSignOutAlt } from 'react-icons/fa';

// Custom SVG Icons - More organic and hand-drawn feel
const MenuIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="12" cy="5" r="1.5" />
        <circle cx="12" cy="19" r="1.5" />
    </svg>
);

// Emoji Avatar Icons (Black and White Style)
const EmojiAvatars = [
    () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" fill="currentColor" />
            <circle cx="8" cy="10" r="1.5" fill="white" />
            <circle cx="16" cy="10" r="1.5" fill="white" />
            <path d="M8 15s2 2 4 2 4-2 4-2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    ),
    () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" fill="currentColor" />
            <circle cx="8" cy="9" r="1.5" fill="white" />
            <circle cx="16" cy="9" r="1.5" fill="white" />
            <path d="M8 14s2 3 4 3 4-3 4-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    ),
    () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" fill="currentColor" />
            <circle cx="8" cy="10" r="1.5" fill="white" />
            <circle cx="16" cy="10" r="1.5" fill="white" />
            <path d="M8 16s2-2 4-2 4 2 4 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    ),
    () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" fill="currentColor" />
            <circle cx="8" cy="10" r="1.5" fill="white" />
            <circle cx="16" cy="10" r="1.5" fill="white" />
            <circle cx="12" cy="15" r="2" fill="white" />
        </svg>
    ),
    () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" fill="currentColor" />
            <circle cx="8" cy="9" r="1.5" fill="white" />
            <circle cx="16" cy="9" r="1.5" fill="white" />
            <path d="M8 16s1 1 2 1 2-1 2-1M14 16s1 1 2 1 2-1 2-1" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
];

const CitizenHeader = ({ onNavigate }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const menuRef = useRef(null);

    // Get user's first name from localStorage
    const getFirstName = () => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user && user.fullName) {
                    return user.fullName.split(' ')[0];
                }
            }
        } catch (e) {
            console.warn('Error parsing user data:', e);
        }
        return 'Citizen';
    };

    // Get user's avatar based on their ID or name (consistent random assignment)
    const getUserAvatar = () => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user && user.id) {
                    // Use user ID to consistently assign the same avatar
                    const avatarIndex = user.id % EmojiAvatars.length;
                    const AvatarComponent = EmojiAvatars[avatarIndex];
                    return <AvatarComponent />;
                }
            }
        } catch (e) {
            console.warn('Error getting user avatar:', e);
        }
        // Fallback to first avatar
        const AvatarComponent = EmojiAvatars[0];
        return <AvatarComponent />;
    };

    // Get avatar background color based on user
    const getAvatarColor = () => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user && user.id) {
                    const colors = ['bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-yellow-400', 'bg-pink-400'];
                    return colors[user.id % colors.length];
                }
            }
        } catch (e) {
            console.warn('Error getting avatar color:', e);
        }
        return 'bg-blue-400';
    };

    const handleLogout = () => {
        try {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        } catch (e) {
            console.warn('Error clearing localStorage:', e);
        }
        navigate('/');
    };

    const handleMenuToggle = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center shadow-lg relative">
            {/* Subtle animated background */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-white rounded-full blur-2xl animate-pulse delay-1000"></div>
            </div>
            
            {/* Welcome Section */}
            <div className="flex items-center gap-4 relative z-20">
                <div className={`${getAvatarColor()} p-3 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg`}>
                    {getUserAvatar()}
                </div>
                <div>
                    <h1 className="text-2xl font-semibold transition-all duration-300 hover:text-blue-100">Welcome, {getFirstName()}</h1>
                    <p className="text-blue-100 text-sm transition-all duration-300 hover:text-blue-50">Let's keep our city clean together</p>
                </div>
            </div>

            {/* Action Menu */}
            <div className="relative z-50" ref={menuRef}>
                <button
                    onClick={handleMenuToggle}
                    className={`p-2 rounded-full transition-all duration-200 cursor-pointer focus:outline-none ${isMenuOpen ? 'bg-white/20 ring-2 ring-white/30' : 'hover:bg-white/15'}`}
                    aria-label="Open menu"
                >
                    <MenuIcon className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-90' : ''}`} />
                </button>

                {/* Dropdown Menu — simplified to mirror worker */}
                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[9999]">
                        <button
                            onClick={() => { setIsMenuOpen(false); onNavigate && onNavigate('leaderboard'); }}
                            className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                        >
                            <FaTrophy className="text-green-600 text-lg flex-shrink-0" />
                            <span className="font-medium text-sm">Leaderboard</span>
                        </button>
                        <button
                            onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-3"
                        >
                            <FaSignOutAlt className="text-lg flex-shrink-0" />
                            <span className="font-medium text-sm">Log Out</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CitizenHeader;