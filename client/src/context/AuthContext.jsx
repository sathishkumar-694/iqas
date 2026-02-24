import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // MOCK USER FOR UI PREVIEW GENERATION
    const [user, setUser] = useState({
        _id: "preview_admin_123",
        username: "Figma Preview Admin",
        email: "preview@iqas.com",
        role: "Admin",
        token: "dummy_token"
    });
    const [loading, setLoading] = useState(false); // Set to false so it doesn't hang

    useEffect(() => {
        // Disabled local storage check for preview mode
        /*
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        */
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await axios.post('/api/auth/login', { email, password });
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed',
            };
        }
    };

    const adminLogin = async (email, password) => {
        try {
            const { data } = await axios.post('/api/auth/admin-login', { email, password });
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Admin login failed',
            };
        }
    };

    const register = async (username, email, password, role) => {
        try {
            const { data } = await axios.post('/api/auth/register', {
                username,
                email,
                password,
                role,
            });
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed',
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, adminLogin, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
