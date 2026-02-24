import { useEffect, useContext } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { io } from 'socket.io-client';
import AuthContext from '../context/AuthContext';

const NotificationListener = () => {
    const { user } = useContext(AuthContext);

    useEffect(() => {
        if (!user) return;

        const socket = io('http://localhost:5000');
        
        socket.emit('join_room', user._id);

        socket.on('new_notification', (message) => {
            toast.info(message, {
                position: "top-right",
                autoClose: 6000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);

    return <ToastContainer />;
};

export default NotificationListener;
