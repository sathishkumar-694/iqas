import { useState, useEffect, useContext } from 'react';
import { Container, Card, Table, Button, Badge, Form, Pagination, InputGroup, Row, Col } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import { Key, Trash2, Search, Filter } from 'lucide-react';
import { toast } from 'react-toastify';

const AdminUserList = () => {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Pagination & Filtering
    const [filterRole, setFilterRole] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 8;

    const fetchUsers = async () => {
        try {
            const config = { withCredentials: true };
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`, config);
            setUsers(res.data);
            setLoading(false);
        } catch (error) {
            toast.error('Error fetching system users');
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.role === 'Admin') {
            fetchUsers();
        }
    }, [user]);

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filterRole, searchQuery]);

    const handleResetPassword = async (userId, username) => {
        if (!window.confirm(`Are you sure you want to reset password for ${username}?`)) return;
        try {
            const config = { withCredentials: true };
            await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${userId}/reset-password`, {}, config);
            toast.success(`Password for ${username} reset successfully`);
        } catch (error) {
            toast.error('Failed to reset password');
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            const config = { withCredentials: true };
            await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${userId}/role`, { role: newRole }, config);
            setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
            toast.success('Role updated successfully');
        } catch (error) {
            toast.error('Failed to update role');
        }
    };

    const handleDeleteUser = async (userId, username) => {
        if (!window.confirm(`CRITICAL WARNING: Remove ${username} from the system?`)) return;
        try {
            const config = { withCredentials: true };
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, config);
            setUsers(users.filter(u => u._id !== userId));
            toast.success('User deleted successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete user');
        }
    };

    if (user?.role !== 'Admin') {
        return <div className="text-center mt-5">Access Denied. Admins only.</div>;
    }

    // Process data for rendering
    const processedUsers = users.filter(u => {
        const matchesRole = filterRole === 'All' || u.role === filterRole;
        const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              u.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesRole && matchesSearch;
    });

    const totalPages = Math.ceil(processedUsers.length / usersPerPage) || 1;
    const currentUsers = processedUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

    return (
        <div className="bg-body-tertiary" style={{ minHeight: '100vh', paddingBottom: '3rem' }}>
            <Container fluid className="px-4 mt-5">
                <div className="mb-4 pb-2 border-bottom d-flex justify-content-between align-items-end">
                    <div>
                        <h2 className="fw-bold mb-1" style={{ letterSpacing: '-0.5px' }}>User Management</h2>
                        <span className="text-muted" style={{ fontSize: '0.9rem' }}>View system users and manage security interventions.</span>
                    </div>
                </div>

                {/* Filters & Search */}
                <Row className="mb-4 align-items-center">
                    <Col md={6} lg={4} className="mb-3 mb-md-0">
                        <InputGroup>
                            <InputGroup.Text className="bg-body border-end-0">
                                <Search size={18} className="text-muted" />
                            </InputGroup.Text>
                            <Form.Control 
                                placeholder="Search" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-body text-body border-start-0 shadow-none ps-0"
                            />
                        </InputGroup>
                    </Col>
                    <Col md={6} lg={8} className="d-flex justify-content-md-end">
                        <div className="d-flex align-items-center bg-body border rounded-3 p-1">
                            <span className="text-muted ms-2 me-2 d-none d-lg-block"><Filter size={16} /></span>
                            <Form.Select 
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                className="border-0 shadow-none bg-transparent fw-medium text-body"
                                style={{ cursor: 'pointer', minWidth: '140px' }}
                            >
                                <option value="All">Filter by Role</option>
                                <option value="Admin">Admin</option>
                                <option value="TL">Team Lead</option>
                                <option value="Dev">Developer</option>
                                <option value="Tester">Tester</option>
                            </Form.Select>
                        </div>
                    </Col>
                </Row>

                <Card className="custom-card border-0">
                    <Table responsive hover className="mb-0 text-start align-middle" style={{ fontSize: '0.95rem' }}>
                        <thead className="bg-body-secondary text-muted text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                            <tr>
                                <th className="py-3 px-4 border-bottom-0 rounded-top-start w-25">User</th>
                                <th className="py-3 px-4 border-bottom-0 w-25">Email</th>
                                <th className="py-3 px-4 border-bottom-0 text-center">Points</th>
                                <th className="py-3 px-4 border-bottom-0 text-center">Rank</th>
                                <th className="py-3 px-4 border-bottom-0 text-center w-25">Role</th>
                                <th className="py-3 px-4 border-bottom-0 text-end rounded-top-end w-25">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-5 text-muted">Loading directory...</td></tr>
                            ) : currentUsers.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-5 text-muted">No users found matching filter.</td></tr>
                            ) : currentUsers.map((u) => (
                                <tr key={u._id}>
                                    <td className="py-3 px-4 fw-medium text-body">{u.username}</td>
                                    <td className="py-3 px-4 text-muted">{u.email}</td>
                                    <td className="py-3 px-4 text-center fw-bold text-primary">{u.points || 0}</td>
                                    <td className="py-3 px-4 text-center">
                                        <Badge bg={u.rank === 4 ? 'info' : u.rank === 3 ? 'warning' : u.rank === 2 ? 'secondary' : 'dark'}>
                                            {u.rank === 4 ? 'Plat' : u.rank === 3 ? 'Gold' : u.rank === 2 ? 'Silv' : 'Bron'}
                                        </Badge>
                                    </td>
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
                                                className="d-inline-block w-auto text-center cursor-pointer shadow-sm bg-body text-body"
                                                style={{ fontSize: '0.85rem', padding: '0.2rem 1.5rem 0.2rem 0.5rem', borderRadius: '6px' }}
                                            >
                                                <option value="Admin">Admin</option>
                                                <option value="TL">Team Lead</option>
                                                <option value="Dev">Developer</option>
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
                                                <Key size={14} className="me-1 d-none d-xl-block" /> Reset PW
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

                {/* Pagination Controls */}
                {!loading && totalPages > 1 && (
                    <div className="d-flex justify-content-end mt-4">
                        <Pagination className="shadow-sm">
                            <Pagination.Prev 
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                                disabled={currentPage === 1}
                            />
                            {[...Array(totalPages)].map((_, idx) => (
                                <Pagination.Item 
                                    key={idx + 1} 
                                    active={currentPage === idx + 1}
                                    onClick={() => setCurrentPage(idx + 1)}
                                >
                                    {idx + 1}
                                </Pagination.Item>
                            ))}
                            <Pagination.Next 
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                                disabled={currentPage === totalPages}
                            />
                        </Pagination>
                    </div>
                )}
            </Container>
        </div>
    );
};

export default AdminUserList;
