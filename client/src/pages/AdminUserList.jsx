import { useState, useEffect, useContext } from 'react';
import { Container, Card, Table, Button, Badge, Form } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import Navigation from '../components/Navigation';
import { Key, Trash2 } from 'lucide-react';

const AdminUserList = () => {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`, config);
            setUsers(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching users:', error);
            setLoading(false);
        }
    };
    useEffect(() => {
        if (user && user.role === 'Admin') {
            fetchUsers();
        }
    }, [user]);

    const handleResetPassword = async (userId, username) => {
        if (!window.confirm(`Are you sure you want to reset the password for ${username} to the system default?`)) return;

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${userId}/reset-password`, {}, config);
            alert(`Password for ${username} has been reset to the default value defined in the environment.`);
        } catch (error) {
            console.error('Error resetting password:', error);
            alert('Failed to reset password.');
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${userId}/role`, { role: newRole }, config);
            setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Failed to update role.');
        }
    };

    const handleDeleteUser = async (userId, username) => {
        if (!window.confirm(`CRITICAL WARNING: Are you sure you want to completely remove ${username} from the system?`)) return;

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, config);
            setUsers(users.filter(u => u._id !== userId));
        } catch (error) {
            console.error('Error deleting user:', error);
            alert(error.response?.data?.message || 'Failed to delete user.');
        }
    };

    if (user?.role !== 'Admin') {
        return <div className="text-center mt-5">Access Denied. Admins only.</div>;
    }

    return (
        <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', paddingBottom: '3rem' }}>
            <Navigation />
            
            <Container fluid className="px-4 mt-5">
                <div className="mb-4 pb-2 border-bottom">
                    <h2 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.5px' }}>User Management</h2>
                    <span className="text-muted" style={{ fontSize: '0.9rem' }}>View system users and manage security interventions.</span>
                </div>

                <Card className="custom-card border-0">
                    <Table responsive hover className="mb-0 text-start align-middle" style={{ fontSize: '0.95rem' }}>
                        <thead className="bg-light text-muted text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                            <tr>
                                <th className="py-3 px-4 border-bottom-0 rounded-top-start">User</th>
                                <th className="py-3 px-4 border-bottom-0">Email</th>
                                <th className="py-3 px-4 border-bottom-0 text-center">Role</th>
                                <th className="py-3 px-4 border-bottom-0 text-end rounded-top-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-4">Loading users...</td></tr>
                            ) : users.map((u) => (
                                <tr key={u._id}>
                                    <td className="py-3 px-4 text-dark fw-medium">{u.username}</td>
                                    <td className="py-3 px-4 text-muted">{u.email}</td>
                                    <td className="py-3 px-4 text-center">
                                        {u.email === 'admin@iqas.com' ? (
                                            <Badge bg="transparent" className="badge-pill-custom bg-dark text-white shadow-sm border border-dark">
                                                Supreme Admin
                                            </Badge>
                                        ) : (
                                            <Form.Select 
                                                size="sm"
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                                className="d-inline-block w-auto text-center"
                                                style={{ fontSize: '0.85rem', padding: '0.2rem 1.5rem 0.2rem 0.5rem', borderRadius: '8px' }}
                                            >
                                                <option value="Admin">Admin</option>
                                                <option value="TL">TL</option>
                                                <option value="Dev">Dev</option>
                                                <option value="Tester">Tester</option>
                                            </Form.Select>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-end">
                                        <div className="d-flex justify-content-end gap-2">
                                            <Button 
                                                variant="outline-secondary" 
                                                size="sm" 
                                                className="rounded-3 d-inline-flex align-items-center"
                                                onClick={() => handleResetPassword(u._id, u.username)}
                                            >
                                                <Key size={14} className="me-1" /> Reset PW
                                            </Button>
                                            {u.email !== 'admin@iqas.com' && (
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm" 
                                                    className="rounded-3 d-inline-flex align-items-center"
                                                    onClick={() => handleDeleteUser(u._id, u.username)}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card>
            </Container>
        </div>
    );
};

export default AdminUserList;
