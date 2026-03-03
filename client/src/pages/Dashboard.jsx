import { useState, useEffect, useContext } from 'react';
import { Container, Card, Button, Row, Col, Badge } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import CreateProjectModal from '../components/CreateProjectModal';
import Navigation from '../components/Navigation';
import { Plus } from 'lucide-react';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [projects, setProjects] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                };
                const res = await axios.get('http://localhost:5000/api/projects', config);
                setProjects(res.data);
            } catch (error) {
                console.error('Error fetching projects:', error);
            }
        };

        if (user) {
            fetchProjects();
        }
    }, [user]);

    const handleProjectCreated = (newProject) => {
        setProjects([...projects, newProject]);
    };

    // Determine mock status based on project length/name for visual flair
    const getMockStatus = (projName) => {
        if (projName.toLowerCase().includes('beta') || projName.toLowerCase().includes('pending')) return 'PENDING';
        if (projName.toLowerCase().includes('completed') || projName.toLowerCase().includes('audit')) return 'COMPLETED';
        return 'ACTIVE';
    };

    return (
        <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', paddingBottom: '3rem' }}>
            <Navigation />

            <Container fluid className="px-4 mt-5">
                <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                    <div>
                        <h2 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.5px' }}>Dashboard</h2>
                        <span className="text-muted" style={{ fontSize: '0.9rem' }}>Manage and monitor all active quality assurance projects.</span>
                    </div>
                    {(user?.role === 'Admin' || user?.role === 'TL') && (
                        <Button 
                            variant="success" 
                            className="d-flex align-items-center fw-semibold rounded-pill px-3 py-2 shadow-sm"
                            onClick={() => setShowCreateModal(true)}
                        >
                            <Plus size={18} className="me-1" strokeWidth={2.5} /> Create New Project
                        </Button>
                    )}
                </div>

                <Row>
                    {projects.map((project) => {
                        const status = getMockStatus(project.name);
                        return (
                            <Col key={project._id} md={4} className="mb-4">
                                <Card className="custom-card h-100">
                                    <Card.Body className="p-4 d-flex flex-column">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <Card.Title className="fw-bold mb-0 text-dark" style={{ fontSize: '1.25rem' }}>
                                                {project.name}
                                            </Card.Title>
                                            <Badge bg="transparent" className={`badge-pill-custom badge-${status.toLowerCase()}`}>
                                                {status}
                                            </Badge>
                                        </div>
                                        
                                        <Card.Text className="text-muted mb-4 flex-grow-1" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
                                            {project.description}
                                        </Card.Text>

                                        <div className="d-flex justify-content-between align-items-end mt-auto pt-3 border-top">
                                            <div>
                                                <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                                                    Created By
                                                </small>
                                                <div className="text-dark fw-medium" style={{ fontSize: '0.85rem' }}>
                                                    {project.created_by?.username}
                                                </div>
                                            </div>
                                            <Link to={`/projects/${project._id}`} className="btn btn-primary fw-medium px-4 rounded-3 shadow-sm">
                                                View Project
                                            </Link>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                    {projects.length === 0 && (
                        <Col>
                            <p className="text-muted">No projects found. Create one to get started.</p>
                        </Col>
                    )}
                </Row>
                
                <div className="text-center mt-5">
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>© 2026 IQAS Platform. All rights reserved.</small>
                </div>
            </Container>

            <CreateProjectModal 
                show={showCreateModal} 
                handleClose={() => setShowCreateModal(false)} 
                onProjectCreated={handleProjectCreated}
            />
        </div>
    );
};

export default Dashboard;
