import { Routes, Route, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import AuthPage from '@/components/common/AuthPage'
import CitizenProfileSetup from '@/components/citizen/CitizenProfileSetup'
import ResetPassword from '@/pages/ResetPassword'

import AdminDashboard from '@/components/admin/AdminDashboard'
import WorkerDashboard from '@/components/worker/WorkerDashboard'
import WorkerLeaderboard from '@/components/worker/WorkerLeaderboard'
import CitizenDashboard from '@/components/citizen/CitizenDashboard'
import ErrorBoundary from '@/components/common/ErrorBoundary'

function App() {
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if citizen needs profile setup
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (token && userRole === 'citizen') {
      // Fetch user profile to check if profile is complete
      fetch(`${import.meta.env.VITE_API_URL}/citizen/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        // If profile is not complete, show profile setup
        // Note: We'll check on first API call
      })
      .catch(err => console.error('Error checking profile:', err));
    }
  }, []);

  const handleProfileComplete = () => {
    setNeedsProfileSetup(false);
    // Refresh to ensure dashboard gets updated data
    window.location.reload();
  };

  // Show profile setup for citizens who haven't completed it
  if (needsProfileSetup) {
    return <CitizenProfileSetup onComplete={handleProfileComplete} />;
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/citizen-profile-setup" element={<CitizenProfileSetup onComplete={handleProfileComplete} />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/worker-dashboard" element={<WorkerDashboard />} />
        <Route path="/worker-leaderboard" element={<WorkerLeaderboard />} />
        <Route path="/citizen-dashboard" element={<CitizenDashboard />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App