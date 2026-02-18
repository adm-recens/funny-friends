import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Logout = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        const doLogout = async () => {
            await logout();
            navigate('/');
        };
        doLogout();
    }, [logout, navigate]);

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="text-white text-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-lg font-bold">Logging out...</p>
            </div>
        </div>
    );
};

export default Logout;
