const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('spothai_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw { status: res.status, ...data };
    return data;
  } catch (err) {
    if (err.status) throw err;
    throw { success: false, message: 'Network error. Please check your connection.' };
  }
}

// Auth
export const authAPI = {
  register: (data) => request('/users/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/users/login', { method: 'POST', body: JSON.stringify(data) }),
  verifyOTP: (data) => request('/users/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
  resendOTP: (data) => request('/users/resend-otp', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (data) => request('/users/forgot-password', { method: 'POST', body: JSON.stringify(data) }),
  resetPassword: (data) => request('/users/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  googleAuth: (data) => request('/users/google-auth', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: () => request('/users/profile'),
  updateProfile: (data) => request('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
};

// Spots
export const spotsAPI = {
  search: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/spots?${query}`);
  },
  getById: (id) => request(`/spots/${id}`),
  getCities: () => request('/spots/cities'),
};

// Bookings
export const bookingsAPI = {
  create: (data) => request('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/bookings?${query}`);
  },
  getById: (id) => request(`/bookings/${id}`),
  cancel: (id) => request(`/bookings/${id}/cancel`, { method: 'PUT' }),
  confirm: (id) => request(`/bookings/${id}/confirm`, { method: 'PUT' }),
};

// Payments
export const paymentsAPI = {
  process: (data) => request('/payments', { method: 'POST', body: JSON.stringify(data) }),
  createRazorpayOrder: (data) => request('/payments/create-order', { method: 'POST', body: JSON.stringify(data) }),
  verifyPayment: (data) => request('/payments/verify', { method: 'POST', body: JSON.stringify(data) }),
  getHistory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/payments?${query}`);
  },
  getReceipt: (id) => request(`/payments/${id}/receipt`),
};

// Operator
export const operatorAPI = {
  getDashboard: () => request('/operator/dashboard'),
  getAnalytics: () => request('/operator/analytics'),
  getBookings: () => request('/operator/bookings'),
  addSpot: (data) => request('/operator/spots', { method: 'POST', body: JSON.stringify(data) }),
  updateSpot: (id, data) => request(`/operator/spots/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};
