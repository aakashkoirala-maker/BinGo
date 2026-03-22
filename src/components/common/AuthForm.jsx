/**
 * AuthForm.jsx
 * Handles user login/signup input, validation, and role-based actions.
 * Styling: Tailwind CSS - High Fidelity to Figma
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEnvelope, FaEye, FaEyeSlash, FaUserTie, FaUserShield, FaChevronDown } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook, FaApple } from 'react-icons/fa';
import CustomModal from '@/components/citizen/CustomModal';
import AuthService from '@/services/AuthService';

// Social Login Component (Internal)
const SocialLogin = ({ onSocialLogin }) => {
    return (
        <div className="flex justify-center gap-4 mt-8">
            <button
                type="button"
                onClick={() => onSocialLogin('google')}
                className="w-20 h-12 rounded-lg border border-gray-300 bg-white flex items-center justify-center transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm transform active:scale-95"
                aria-label="Sign in with Google"
            >
                <FcGoogle size={24} />
            </button>
            <button
                type="button"
                onClick={() => onSocialLogin('facebook')}
                className="w-20 h-12 rounded-lg border border-gray-300 bg-white flex items-center justify-center transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm transform active:scale-95"
                aria-label="Sign in with Facebook"
            >
                <FaFacebook size={24} color="#1877F2" />
            </button>
            <button
                type="button"
                onClick={() => onSocialLogin('apple')}
                className="w-20 h-12 rounded-lg border border-gray-300 bg-white flex items-center justify-center transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm transform active:scale-95"
                aria-label="Sign in with Apple"
            >
                <FaApple size={24} />
            </button>
        </div>
    );
};

const AuthForm = ({ role, setRole, isLogin, setIsLogin }) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [agreeTerms, setAgreeTerms] = React.useState(false);
    const [resetEmail, setResetEmail] = React.useState('');
    const [resetSubmitting, setResetSubmitting] = React.useState(false);
    const [formData, setFormData] = React.useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [modal, setModal] = React.useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        isReactNode: false,
        mode: 'default', // 'default' | 'reset'
    });
    const [authSuccess, setAuthSuccess] = React.useState(false);

    // Role Configurations
    const roleConfig = {
        citizen: {
            btnColor: 'bg-blue-600 hover:bg-blue-700',
            icon: <FaUser className="text-white" />,
            iconBg: 'bg-blue-600',
            allowSignup: true,
            label: 'Citizen',
            placeholderIconColor: 'text-gray-400'
        },
        worker: {
            btnColor: 'bg-green-500 hover:bg-green-600',
            icon: <FaUserTie className="text-white" />,
            iconBg: 'bg-green-500',
            allowSignup: false,
            label: 'Worker',
            placeholderIconColor: 'text-gray-400'
        },
        admin: {
            btnColor: 'bg-purple-700 hover:bg-purple-800',
            icon: <FaUserShield className="text-white" />,
            iconBg: 'bg-purple-700',
            allowSignup: false,
            label: 'Admin',
            placeholderIconColor: 'text-gray-400'
        }
    };

    React.useEffect(() => {
        if (!roleConfig[role].allowSignup) {
            setIsLogin(true);
        }
    }, [role, setIsLogin]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const showModal = (title, message, type = 'info', isReactNode = false, mode = 'default') => {
        setModal({
            isOpen: true,
            title,
            message,
            type,
            isReactNode,
            mode
        });
    };

    const closeModal = () => {
        // Get actual user role from stored data
        const storedUser = localStorage.getItem('user');
        let userRole = role; // Default to selected role
        
        if (storedUser && authSuccess) {
            try {
                const userData = JSON.parse(storedUser);
                userRole = userData.role || role;
            } catch (e) {
                // Use selected role as fallback
            }
        }
        
        setModal({
            isOpen: false,
            title: '',
            message: '',
            type: 'info',
            isReactNode: false,
            mode: 'default'
        });
        // If this was a successful auth, navigate to the appropriate dashboard
        if (authSuccess) {
            setAuthSuccess(false);
            
            // Check if citizen needs profile completion
            if (userRole === 'citizen') {
                const token = localStorage.getItem('token');
                fetch(`${import.meta.env.VITE_API_URL}/citizen/profile-status`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(res => res.json())
                .then(data => {
                    if (!data.profile_complete) {
                        navigate('/citizen-profile-setup');
                    } else {
                        navigate('/citizen-dashboard');
                    }
                })
                .catch(() => {
                    navigate('/citizen-dashboard');
                });
            } else if (userRole === 'worker') {
                navigate('/worker-dashboard');
            } else if (userRole === 'admin') {
                navigate('/admin-dashboard');
            }
        }
    };

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isLogin && !agreeTerms) {
            showModal('Validation Error', "You must agree to Terms & Conditions to sign up!", 'warning');
            return;
        }
        if (!isLogin && formData.password !== formData.confirmPassword) {
            showModal('Password Mismatch', "Passwords do not match!", 'warning');
            return;
        }
        if (!isLogin && formData.password.length < 8) {
            showModal('Weak Password', 'Password must be at least 8 characters for signup.', 'warning');
            return;
        }

        try {
            const data = isLogin
                ? await AuthService.login({ email: formData.email, password: formData.password, role })
                : await AuthService.register({ fullName: `${formData.firstName} ${formData.lastName}`, email: formData.email, password: formData.password });

            showModal(
                'Success!', 
                isLogin ? "Login Successful!" : "Registration Successful!", 
                'success'
            );

            setAuthSuccess(true);
        } catch (error) {
            console.error('Auth Error:', error);
            showModal('Authentication Failed', error.message || 'Authentication failed', 'error');
        }
    };

    const renderResetForm = () => (
        <div className="space-y-3">
            <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Citizen Email</label>
                <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your citizen email"
                />
            </div>
            <button
                type="button"
                disabled={resetSubmitting}
                onClick={async () => {
                    if (!resetEmail.trim()) {
                        showModal('Email Required', 'Enter your account email to reset your password.', 'warning');
                        return;
                    }
                    try {
                        setResetSubmitting(true);
                        const data = await AuthService.forgotPassword(resetEmail.trim());
                        const resetLink = data.resetLink || `${window.location.origin}/reset-password?token=${data.token || ''}&email=${encodeURIComponent(resetEmail.trim())}`;
                        const content = (
                            <div className="space-y-3">
                                <p>{data.message || 'Reset instructions sent.'}</p>
                                {data.email && (
                                    <p className="text-sm text-gray-700">This reset token is tied to: <strong>{data.email}</strong></p>
                                )}
                                {data.token && (
                                    <div className="text-xs text-gray-600 break-all">Dev token: {data.token}</div>
                                )}
                                <a
                                    href={resetLink}
                                    className="inline-block px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
                                >
                                    Open reset page
                                </a>
                            </div>
                        );
                        showModal('Password Reset', content, 'info', true);
                    } catch (error) {
                        showModal('Reset Failed', error.message || 'Could not start password reset.', 'error');
                    } finally {
                        setResetSubmitting(false);
                    }
                }}
                className="w-full h-11 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {resetSubmitting ? 'Sending…' : 'Send reset link'}
            </button>
        </div>
    );

    const handleForgotPassword = async () => {
        if (role !== 'citizen') {
            showModal('Not available', 'Forgot Password is only available for citizen accounts.', 'warning');
            return;
        }

        setResetEmail('');
        // We set mode to 'reset' so the modal renders the live form (keeps value in sync)
        setModal({
            isOpen: true,
            title: 'Password Reset',
            message: '',
            type: 'info',
            isReactNode: true,
            mode: 'reset'
        });
    };

    // Role Icon for the Dropdown (Colored box variant as per screenshot style inference or just simple icon)
    // Screenshot shows: Icon inside the select box, left aligned.
    const getRoleIcon = () => {
        const commonClasses = "absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none";
        // To match the screenshot "Square with icon inside" style if present, or just simple icon. 
        // Screenshot 1 & 2 show a simple icon (User/Tie/Shield) inside the input.
        // Actually, screenshot 1 shows a square colored icon for role? Let's stick to simple clean icons first as per text description, 
        // but maybe color coordinate them.
        switch (role) {
            case 'worker': return <FaUserTie className={`${commonClasses} text-green-600`} size={18} />;
            case 'admin': return <FaUserShield className={`${commonClasses} text-purple-600`} size={18} />;
            default: return <FaUser className={`${commonClasses} text-blue-600`} size={16} />;
        }
    };

    const handleSocialLogin = async (provider) => {
        if (provider === 'apple') {
            showModal('Coming Soon', 'Apple Sign-In is coming soon!', 'info');
            return;
        }

        if (provider === 'facebook') {
            showModal('Coming Soon', 'Facebook Sign-In coming soon! Please use Google or email/password for now.', 'info');
            return;
        }

        if (provider === 'google') {
            // Real Google Sign-In using OAuth2 popup
            if (!window.google || !window.google.accounts) {
                showModal('Loading', 'Google Sign-In is loading. Please try again in a moment.', 'warning');
                return;
            }

            const tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: '557758283638-ijg525etvnplcm2u0cfadsnt0h3pji43.apps.googleusercontent.com',
                scope: 'email profile',
                callback: async (tokenResponse) => {
                    if (tokenResponse.error) {
                        console.error('Google token error:', tokenResponse);
                        return;
                    }

                    try {
                        await AuthService.googleLogin(tokenResponse.access_token);
                        showModal(
                            'Success!', 
                            'Google Login Successful!', 
                            'success'
                        );
                        setAuthSuccess(true);
                    } catch (error) {
                        console.error('Google Auth Error:', error);
                        showModal('Login Failed', error.message || 'Google Login failed', 'error');
                    }
                }
            });

            tokenClient.requestAccessToken();
        }
    };

    return (
        <div className="bg-white p-8 md:p-12 w-full h-full flex flex-col justify-center animate-fade-in shadow-none">
            {/* Custom Modal */}
            <CustomModal
                isOpen={modal.isOpen}
                onClose={closeModal}
                title={modal.title}
                message={modal.mode === 'reset' ? renderResetForm() : modal.message}
                type={modal.type}
                isReactNode={modal.mode === 'reset' ? true : modal.isReactNode}
            />

            {/* Note: Removed shadow/rounded from container because AuthPage wrapper handles card look */}

            <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                    Welcome to <span className={role === 'citizen' ? 'text-blue-600' : role === 'worker' ? 'text-green-500' : 'text-purple-600'}>BinGo</span>
                </h2>
            </div>

            {/* ... Form Code ... */}
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Role Selection - Custom Styled */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Select Your Role</label>
                    <div className="relative">
                        {/* Custom Icon */}
                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded flex items-center justify-center pointer-events-none 
                            ${role === 'citizen' ? 'bg-blue-100 text-blue-600' :
                                role === 'worker' ? 'bg-green-100 text-green-600' :
                                    'bg-purple-100 text-purple-600'}`}>
                            {role === 'citizen' && <FaUser size={14} />}
                            {role === 'worker' && <FaUserTie size={14} />}
                            {role === 'admin' && <FaUserShield size={14} />}
                        </div>

                        <select
                            className="w-full h-12 pl-14 pr-10 bg-white border border-gray-300 rounded-xl text-gray-900 text-sm font-medium focus:ring-2 focus:ring-opacity-20 outline-none appearance-none transition-all cursor-pointer hover:border-gray-400
                            focus:border-blue-500 focus:ring-blue-500"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="citizen">Citizen</option>
                            <option value="worker">Worker</option>
                            <option value="admin">Admin</option>
                        </select>

                        {/* Custom chevron */}
                        <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
                    </div>
                </div>

                {/* Signup Fields */}
                {!isLogin && (
                    <div className="flex gap-4">
                        <div className="w-1/2 space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700">First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                placeholder="First Name"
                                className="w-full h-12 px-4 border border-gray-300 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                required
                                onChange={handleChange}
                            />
                        </div>
                        <div className="w-1/2 space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700">Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                placeholder="Last Name"
                                className="w-full h-12 px-4 border border-gray-300 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                required
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                )}

                {/* Email Field */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <FaEnvelope size={16} />
                        </div>
                        <input
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            className="w-full h-12 pl-11 pr-4 border border-gray-300 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <FaLock size={16} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Enter your password"
                            className="w-full h-12 pl-11 pr-12 border border-gray-300 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        <button
                            type="button"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                    </div>
                </div>

                {/* Confirm Password */}
                {!isLogin && (
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <FaLock size={16} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="confirmPassword"
                                placeholder="Confirm your password"
                                className="w-full h-12 pl-11 pr-4 border border-gray-300 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                required
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                )}

                {/* Options Row */}
                <div className="flex justify-between items-center text-sm pt-1">
                    <label className="flex items-center gap-2 text-gray-600 cursor-pointer select-none group">
                        <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all"
                            checked={!isLogin && agreeTerms}
                            onChange={(e) => { if (!isLogin) setAgreeTerms(e.target.checked); }}
                        />
                        <span className="group-hover:text-gray-900 transition-colors">
                            {isLogin ? "Remember me" : <span>I agree to <span className="text-blue-600 font-medium">Terms & Conditions</span> <span className="text-red-500">*</span></span>}
                        </span>
                    </label>
                    {isLogin && role === 'citizen' && (
                        <button
                            type="button"
                            onClick={handleForgotPassword}
                            className="font-medium text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            Forget password?
                        </button>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className={`w-full h-12 rounded-xl text-white font-semibold text-sm tracking-wide transition-all transform active:scale-[0.98] shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${roleConfig[role].btnColor}`}
                >
                    {isLogin && <span className="opacity-90">{roleConfig[role].icon}</span>}
                    {isLogin ? `Sign in as ${roleConfig[role].label}` : `Sign up as ${roleConfig[role].label}`}
                </button>
            </form>

            {/* Footer */}
            <div className="text-center mt-auto pt-6">
                <SocialLogin onSocialLogin={handleSocialLogin} />

                <div className="mt-8 text-sm text-gray-600">
                    {roleConfig[role].allowSignup ? (
                        <>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors ml-1"
                            >
                                {isLogin ? "Sign up now" : "Sign in here"}
                            </button>
                        </>
                    ) : (
                        <div className="text-center space-y-1">
                            <span className="italic opacity-75 block">
                                {role === 'admin' 
                                    ? "Admin accounts are pre-configured by developers." 
                                    : "Workers & Admins cannot create accounts."}
                            </span>
                            {role === 'admin' && (
                                <div className="text-xs text-gray-500 bg-purple-50 p-2 rounded-lg mt-2">
                                    <strong>Admin Credentials:</strong><br/>
                                    Email: admin@bingo.com<br/>
                                    Password: Bingo@2024#Admin
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthForm;
