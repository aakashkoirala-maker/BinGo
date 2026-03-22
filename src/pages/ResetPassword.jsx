import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthService from '@/services/AuthService';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = searchParams.get('token');
    const e = searchParams.get('email');
    if (t) {
      setToken(t);
    }
    if (e) {
      setEmail(e);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!searchParams.get('token')) {
      setError('Reset token is missing. Please use the link from your reset email.');
    }
  }, [searchParams]);

  const validate = () => {
    if (!email.trim()) return 'Email is required';
    if (!token.trim()) return 'Reset token is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      await AuthService.resetPassword({ email: email.trim(), token: token.trim(), newPassword: password });
      setMessage('Password reset successful. You can now sign in.');
      setPassword('');
      setConfirmPassword('');
      // optional redirect after short delay
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setError(err.message || 'Password reset failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white shadow-sm border border-gray-200 rounded-xl p-6">
        <h1 className="text-xl font-semibold text-gray-800 mb-4">Reset Password</h1>
        <p className="text-sm text-gray-600 mb-4">Enter your email, the reset token you received, and choose a new password.</p>

        {message && <div className="mb-3 text-green-700 bg-green-50 border border-green-200 rounded-md p-3 text-sm">{message}</div>}
        {error && <div className="mb-3 text-red-700 bg-red-50 border border-red-200 rounded-md p-3 text-sm">{error}</div>}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your account email"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Reset Token</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste your reset token"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="At least 8 characters"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              {showPassword ? 'Hide password' : 'Show password'}
            </button>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Re-enter password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              {showConfirm ? 'Hide password' : 'Show password'}
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting…' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
