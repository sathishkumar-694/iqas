import { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, InputGroup, Spinner, Pagination as BsPagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import CreateProjectModal from '../components/CreateProjectModal';
import { Search, Plus, FolderOpen } from 'lucide-react';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

    const fetchProjects = async (searchTerm = '', pageNum = 1) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects?search=${searchTerm}&page=${pageNum}&limit=12`, { withCredentials: true });
            setProjects(res.data.data || res.data);
            if (res.data.pagination) setPagination(res.data.pagination);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching projects:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects(search, page);
    }, [page]);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (page !== 1) setPage(1); // Auto-reset page on new search
            fetchProjects(search, 1);
        }, 500); // 500ms live search delay

        return () => clearTimeout(debounceTimer);
    }, [search]); // Runs smoothly whenever search changes

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchProjects(search, 1);
    };

    const handleProjectCreated = () => {
        setShowModal(false);
        fetchProjects(search, page);
    };

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;

    return (
        <Container className="mt-4 mb-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>📁 Projects</h2>
                {(user.role === 'Admin' || user.role === 'TL') && (
                    <Button variant="primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} className="me-1" /> New Project
                    </Button>
                )}
            </div>

            {/* Live Search Bar */}
            <Form onSubmit={handleSearch} className="mb-4">
                <InputGroup className="shadow-sm">
                    <InputGroup.Text className="bg-white"><Search size={18} className="text-primary" /></InputGroup.Text>
                    <Form.Control
                        placeholder="Live search projects by name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="py-2 border-start-0"
                    />
                </InputGroup>
            </Form>

            {projects.length === 0 ? (
                <div className="text-center text-muted mt-5">
                    <FolderOpen size={64} className="mb-3" />
                    <p>No projects found. {search && 'Try a different search.'}</p>
                </div>
            ) : (
                <>
                    <Row>
                        {projects.map((project) => (
                            <Col md={4} key={project._id} className="mb-3">
                                <Card
                                    className="h-100 shadow-sm border-0"
                                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                                    onClick={() => navigate(`/projects/${project._id}`)}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <Card.Body>
                                        <Card.Title>{project.name}</Card.Title>
                                        <Card.Text className="text-muted small">
                                            {project.description || 'No description'}
                                        </Card.Text>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <Badge bg="secondary">{project.team_members?.length || 0} members</Badge>
                                            <small className="text-muted">
                                                {project.created_by?.username || 'Unknown'}
                                            </small>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="d-flex justify-content-center mt-4">
                            <BsPagination>
                                <BsPagination.Prev disabled={page === 1} onClick={() => setPage(page - 1)} />
                                {[...Array(pagination.totalPages)].map((_, i) => (
                                    <BsPagination.Item key={i + 1} active={page === i + 1} onClick={() => setPage(i + 1)}>
                                        {i + 1}
                                    </BsPagination.Item>
                                ))}
                                <BsPagination.Next disabled={page === pagination.totalPages} onClick={() => setPage(page + 1)} />
                            </BsPagination>
                        </div>
                    )}
                </>
            )}

            <CreateProjectModal show={showModal} onHide={() => setShowModal(false)} onCreated={handleProjectCreated} />
        </Container>
    );
};

export default Dashboard;
