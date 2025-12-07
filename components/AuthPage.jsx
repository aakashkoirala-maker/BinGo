/**
 * AuthPage.jsx
 * Main entry page for Authentication.
 * Handles role-based background themes and responsive layout with illustrations.
 */
import React, { useState } from 'react';
import AuthForm from './AuthForm';
import citizenImg from '../assets/citizen_final.png';
import workerImg from '../assets/worker_final.png';
import adminImg from '../assets/admin_final.png';

const AuthPage = () => {
    const [role, setRole] = useState('citizen');
    const [isLogin, setIsLogin] = useState(true);

    const getPageStyle = () => {
        switch (role) {
            case 'worker':
                return {
                    wrapper: 'bg-[#6EDAB1]',
                };
            case 'admin':
                return {
                    wrapper: 'bg-[#9B6DD6]',
                };
            default:
                return {
                    wrapper: 'bg-[#5B8FF6]',
                };
        }
    };

    const getIllustration = () => {
        switch (role) {
            case 'worker': return workerImg;
            case 'admin': return adminImg;
            default: return citizenImg;
        }
    };

    const styles = getPageStyle();

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 md:p-8 transition-colors duration-500 ease-in-out ${styles.wrapper} relative overflow-hidden`}>

            {/* Main Content Container */}
            <div className="w-full max-w-[1200px] flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16 relative z-10">

                {/* Left Side - Illustration (Floating on Background) */}
                <div className="flex-1 hidden md:flex flex-col items-center justify-center max-w-[600px] animate-fade-in-up">
                    <img
                        src={getIllustration()}
                        alt={`${role} illustration`}
                        className="w-full h-auto max-h-[500px] object-contain drop-shadow-2xl transition-all duration-500 transform hover:scale-105"
                    />
                </div>

                {/* Vertical Divider Line */}
                <div className="hidden md:block w-[3px] h-[500px] bg-white opacity-90 rounded-full mx-4 shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>

                {/* Right Side - Form Card (White Box) */}
                <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all hover:shadow-3xl animate-fade-in-up delay-100">
                    <AuthForm
                        role={role}
                        setRole={setRole}
                        isLogin={isLogin}
                        setIsLogin={setIsLogin}
                    />
                </div>

            </div>

            {/* Background Texture/Shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] bg-white/10 rounded-full blur-3xl"></div>
            </div>
        </div>
    );
};

export default AuthPage;
