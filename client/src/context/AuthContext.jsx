import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AuthContext = createContext();

// Axios response interceptor for automatic token refresh
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // If 401 and not already retrying, and not the login/refresh route
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login') && !originalRequest.url.includes('/auth/refresh')) {
            originalRequest._retry = true;
            try {
                // Attempt to refresh token
                await axios.get(`${import.meta.env.VITE_API_URL || ''}/api/auth/refresh`, { withCredentials: true });
                // If successful, retry original request
                return axios(originalRequest);
            } catch (refreshError) {
                // If refresh fails, let the user be logged out (handled by AuthContext state)
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL || ''}/api/auth/me`, { withCredentials: true });
            setUser(data);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL || ''}/api/auth/login`, { email, password }, { withCredentials: true });
            setUser(data);
            toast.success('Logged in successfully');
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            toast.error(message);
            return { success: false, message };
        }
    };

    const adminLogin = async (email, password) => {
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL || ''}/api/auth/admin-login`, { email, password }, { withCredentials: true });
            setUser(data);
            toast.success('Admin login successful');
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Admin login failed';
            toast.error(message);
            return { success: false, message };
        }
    };

    const register = async (username, email, password, role) => {
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL || ''}/api/auth/register`, {
                username,
                email,
                password,
                role,
            }, { withCredentials: true });
            setUser(data);
            toast.success('Registration successful');
            return { success: true };
        } catch (error) {
            const message ='Registration failed';
            toast.error(message);
            return { success: false, message };
        }
    };

    const logout = async () => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || ''}/api/auth/logout`, {}, { withCredentials: true });
        } catch (error) {
            // failed to logout cleanly, fallback state triggered
        }
        setUser(null);
        toast.info('Logged out successfully');
    };

    return (
        <AuthContext.Provider value={{ user, login, adminLogin, register, logout, loading, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
