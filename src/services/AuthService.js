// Centralized auth API helpers

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const jsonHeaders = { 'Content-Type': 'application/json' };

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.message || 'Authentication failed';
    throw new Error(message);
  }
  return data;
};

const persistSession = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  if (user?.role) {
    localStorage.setItem('userRole', user.role);
  }
};

const login = async ({ email, password, role }) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ email, password, role })
  });
  const data = await handleResponse(res);
  persistSession(data.token, data.user);
  return data;
};

const register = async ({ fullName, email, password }) => {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ fullName, email, password, role: 'citizen' })
  });
  const data = await handleResponse(res);
  persistSession(data.token, data.user);
  return data;
};

const googleLogin = async (accessToken) => {
  const res = await fetch(`${API_BASE}/auth/google-login`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ access_token: accessToken })
  });
  const data = await handleResponse(res);
  persistSession(data.token, data.user);
  return data;
};

const forgotPassword = async (email) => {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ email })
  });
  return handleResponse(res);
};

const resetPassword = async ({ email, token, newPassword }) => {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ email, token, newPassword })
  });
  return handleResponse(res);
};

export default {
  login,
  register,
  googleLogin,
  forgotPassword,
  resetPassword
};
