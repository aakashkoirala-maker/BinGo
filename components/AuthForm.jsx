/**
 * AuthForm.jsx
 * Handles user login/signup input, validation, and role-based actions.
 * Styling: Tailwind CSS - High Fidelity to Figma
 */
import React from 'react';
import { FaUser, FaLock, FaEnvelope, FaEye, FaEyeSlash, FaUserTie, FaUserShield, FaChevronDown } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook, FaApple } from 'react-icons/fa';

// Social Login Component (Internal)
const SocialLogin = () => {
    return (
        <div className="flex justify-center gap-4 mt-8">
            <button
                type="button"
                className="w-20 h-12 rounded-lg border border-gray-300 bg-white flex items-center justify-center transition-all duration-200 hover:bg-gray-50 hover:border-gray-400"
                aria-label="Sign in with Google"
            >
                <FcGoogle size={24} />
            </button>
            <button
                type="button"
                className="w-20 h-12 rounded-lg border border-gray-300 bg-white flex items-center justify-center transition-all duration-200 hover:bg-gray-50 hover:border-gray-400"
                aria-label="Sign in with Facebook"
            >
                <FaFacebook size={24} color="#1877F2" />
            </button>
            <button
                type="button"
                className="w-20 h-12 rounded-lg border border-gray-300 bg-white flex items-center justify-center transition-all duration-200 hover:bg-gray-50 hover:border-gray-400"
                aria-label="Sign in with Apple"
            >
                <FaApple size={24} />
            </button>
        </div>
    );
};

const AuthForm = ({ role, setRole, isLogin, setIsLogin }) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [formData, setFormData] = React.useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

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

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(`Submitting as ${role} (${isLogin ? 'Login' : 'Signup'}):`, formData);

        // Mock Authentication Logic
        if (role === 'admin') {
            if (formData.email === 'admin@bingo.com' && formData.password === 'admin123') {
                alert('Admin Login Successful! Redirecting to Dashboard...');
            } else {
                alert('Invalid Admin Credentials');
            }
        } else if (role === 'worker') {
            if (formData.email === 'worker@bingo.com' && formData.password === 'worker123') {
                alert('Worker Login Successful! Redirecting to Dashboard...');
            } else {
                alert('Invalid Worker Credentials');
            }
        } else {
            if (isLogin) {
                alert('Citizen Login Implementation Pending');
            } else {
                alert('Citizen Registration Implementation Pending');
            }
        }
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

    return (
        <div className="bg-white p-8 md:p-12 w-full h-full flex flex-col justify-center animate-fade-in shadow-none">
            {/* Note: Removed shadow/rounded from container because AuthPage wrapper handles card look */}

            <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                    Welcome to <span className={role === 'citizen' ? 'text-blue-600' : role === 'worker' ? 'text-green-500' : 'text-purple-600'}>BinGo</span>
                </h2>
            </div>

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
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all" />
                        <span className="group-hover:text-gray-900 transition-colors">{isLogin ? "Remember me" : "I agree to Terms & Conditions"}</span>
                    </label>
                    {isLogin && (
                        <a href="#" className="font-medium text-gray-500 hover:text-gray-800 transition-colors">Forget password?</a>
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
                <SocialLogin />

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
                        <span className="italic opacity-75">
                            Workers & Admins cannot create accounts.
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthForm;
