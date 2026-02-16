import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_URL, SOCKET_CONFIG } from '../config';

const AuthContext = createContext(null);

// Initialize Socket (Lazy connect)
const socket = io(API_URL, SOCKET_CONFIG);



export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing session on mount using httpOnly cookie
        const checkSession = async () => {
            try {
                const res = await fetch(`${API_URL}/api/auth/me`, {
                    credentials: 'include'
                });

                const data = await res.json();

                if (data.user) {
                    setUser(data.user);
                    // Connect socket (auth handled by cookie)
                    socket.connect();
                }
            } catch (e) {
                // Silent fail - user not logged in
            } finally {
                setLoading(false);
            }
        };
        checkSession();
    }, []);

    const login = async (username, password) => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include',
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            const data = await res.json();

            if (data.success) {
                setUser(data.user);
                socket.connect();
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.error };
            }
        } catch (e) {
            return { success: false, error: 'Network error. Please try again.' };
        }
    };

    const loginAsGuest = () => {
        setUser({ username: 'Guest', role: 'VIEWER' });
        socket.connect();
    };

    const logout = async () => {
        try {
            await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
        } catch (e) {
            // Silent fail
        }
        setUser(null);
        socket.disconnect();
    };

    return (
        <AuthContext.Provider value={{ user, login, loginAsGuest, logout, socket, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
