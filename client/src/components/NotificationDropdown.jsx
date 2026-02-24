import { useState, useEffect, useContext } from 'react';
import { Dropdown, Badge } from 'react-bootstrap';
import { Bell } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import AuthContext from '../context/AuthContext';

const NotificationDropdown = () => {
    const { user } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/notifications`, config);
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.is_read).length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        if (!user) return;

        fetchNotifications();

        const socket = io(import.meta.env.VITE_API_URL);
        socket.emit('join_room', user._id);

        socket.on('new_notification', () => {
            // When a new signal arrives, fetch the latest list from the DB
            fetchNotifications();
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);

    const markAsRead = async (id) => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };
            await axios.put(`${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`, {}, config);
            
            // Update local state to instantly remove the "unread" status
            setNotifications(notifications.map(n => 
                n._id === id ? { ...n, is_read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    return (
        <Dropdown align="end" className="me-3">
            <Dropdown.Toggle variant="dark" id="dropdown-notifications" className="position-relative bg-transparent border-0 px-2">
                <Bell size={20} color="white" />
                {unreadCount > 0 && (
                    <Badge 
                        bg="danger" 
                        pill 
                        className="position-absolute" 
                        style={{ top: '0px', right: '0px', fontSize: '0.65em' }}
                    >
                        {unreadCount}
                    </Badge>
                )}
            </Dropdown.Toggle>

            <Dropdown.Menu style={{ width: '320px', maxHeight: '400px', overflowY: 'auto' }}>
                <Dropdown.Header>Notifications</Dropdown.Header>
                {notifications.length === 0 ? (
                    <Dropdown.Item disabled>No notifications</Dropdown.Item>
                ) : (
                    notifications.map(n => (
                        <Dropdown.Item 
                            key={n._id} 
                            onClick={() => !n.is_read && markAsRead(n._id)}
                            className={n.is_read ? 'text-muted' : 'fw-bold'}
                            style={{ 
                                whiteSpace: 'normal', 
                                borderBottom: '1px solid #eee',
                                backgroundColor: n.is_read ? 'transparent' : '#f8f9fa'
                            }}
                        >
                            <div className="d-flex justify-content-between align-items-start mb-1">
                                <small style={{ fontSize: '0.8em' }}>
                                    {new Date(n.created_at).toLocaleString()}
                                </small>
                                {!n.is_read && <Badge bg="primary" style={{ fontSize: '0.6em' }}>New</Badge>}
                            </div>
                            <div style={{ fontSize: '0.9em' }}>{n.message}</div>
                        </Dropdown.Item>
                    ))
                )}
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default NotificationDropdown;
