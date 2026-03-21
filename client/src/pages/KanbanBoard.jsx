import { useState, useEffect, useContext } from 'react';
import { Container, Card, Badge, Spinner, Row, Col, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import BackButton from '../components/BackButton';

const STATUS_COLUMNS = ['Open', 'In Progress', 'Resolved', 'Closed'];
const STATUS_COLORS = { 'Open': 'danger', 'In Progress': 'warning', 'Resolved': 'info', 'Closed': 'success' };
const PRIORITY_COLORS = { 'Low': '#10b981', 'Medium': '#f59e0b', 'High': '#ef4444', 'Critical': '#991b1b' };

const KanbanBoard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [bugs, setBugs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects`, config);
                const projectList = res.data.data || res.data;
                setProjects(projectList);
                if (projectList.length > 0) {
                    setSelectedProject(projectList[0]._id);
                }
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [user]);

    useEffect(() => {
        if (!selectedProject) return;
        const fetchBugs = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/bugs/project/${selectedProject}?limit=100`, config);
                setBugs(res.data.data || res.data);
            } catch (error) {
                console.error('Error fetching bugs:', error);
            }
        };
        fetchBugs();
    }, [selectedProject, user]);

    const handleStatusChange = async (bugId, newStatus) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`${import.meta.env.VITE_API_URL}/api/bugs/${bugId}`, { status: newStatus }, config);
            setBugs(bugs.map(b => b._id === bugId ? { ...b, status: newStatus } : b));
        } catch (error) {
            console.error('Error updating status:', error);
            alert(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleDragStart = (e, bugId) => {
        e.dataTransfer.setData('bugId', bugId);
    };

    const handleDrop = (e, newStatus) => {
        e.preventDefault();
        const bugId = e.dataTransfer.getData('bugId');
        handleStatusChange(bugId, newStatus);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;

    return (
        <Container fluid className="mt-4 mb-5 px-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-3">
                    <BackButton />
                    <h2 className="mb-0">📋 Kanban Board</h2>
                </div>
                <Form.Select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    style={{ maxWidth: '300px' }}
                >
                    {projects.map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                </Form.Select>
            </div>

            <Row>
                {STATUS_COLUMNS.map(status => (
                    <Col key={status} md={3}>
                        <div
                            className="rounded p-3"
                            style={{ backgroundColor: 'var(--bs-tertiary-bg, #f8f9fa)', minHeight: '70vh' }}
                            onDrop={(e) => handleDrop(e, status)}
                            onDragOver={handleDragOver}
                        >
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="mb-0">
                                    <Badge bg={STATUS_COLORS[status]}>{status}</Badge>
                                </h6>
                                <Badge bg="secondary" pill>
                                    {bugs.filter(b => b.status === status).length}
                                </Badge>
                            </div>

                            {bugs.filter(b => b.status === status).map(bug => (
                                <Card
                                    key={bug._id}
                                    className="mb-2 border-0 shadow-sm"
                                    style={{ cursor: 'grab', borderLeft: `4px solid ${PRIORITY_COLORS[bug.priority]}` }}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, bug._id)}
                                    onClick={() => navigate(`/bugs/${bug._id}`)}
                                >
                                    <Card.Body className="p-2">
                                        <Card.Title className="fs-6 mb-1">{bug.title}</Card.Title>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <Badge
                                                style={{ backgroundColor: PRIORITY_COLORS[bug.priority], fontSize: '0.7rem' }}
                                            >
                                                {bug.priority}
                                            </Badge>
                                            <small className="text-muted">
                                                {bug.assigned_to?.username || 'Unassigned'}
                                            </small>
                                        </div>
                                        {bug.labels && bug.labels.length > 0 && (
                                            <div className="mt-1">
                                                {bug.labels.slice(0, 3).map((label, i) => (
                                                    <Badge key={i} bg="outline-secondary" className="me-1" style={{ fontSize: '0.6rem', border: '1px solid #ddd', color: '#666', background: 'transparent' }}>
                                                        {label}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                        {bug.due_date && (
                                            <small className={`d-block mt-1 ${new Date(bug.due_date) < new Date() && bug.status !== 'Closed' ? 'text-danger' : 'text-muted'}`}>
                                                📅 {new Date(bug.due_date).toLocaleDateString()}
                                            </small>
                                        )}
                                    </Card.Body>
                                </Card>
                            ))}
                        </div>
                    </Col>
                ))}
            </Row>
        </Container>
    );
};

export default KanbanBoard;
