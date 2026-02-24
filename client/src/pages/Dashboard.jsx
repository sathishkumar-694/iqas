import { useState, useEffect, useContext } from 'react';
import { Container, Card, Button, Navbar, Nav, Row, Col, Dropdown } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import CreateProjectModal from '../components/CreateProjectModal';
import NotificationDropdown from '../components/NotificationDropdown';
import { UserCircle } from 'lucide-react';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
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

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleProjectCreated = (newProject) => {
        setProjects([...projects, newProject]);
    };

    return (
        <>
            <Navbar bg="dark" variant="dark" expand="lg">
                <Container>
                    <Navbar.Brand href="#home">IQAS</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
                        <Nav className="align-items-center">
                            <NotificationDropdown />
                            <Dropdown align="end">
                                <Dropdown.Toggle variant="dark" id="dropdown-profile" className="d-flex align-items-center bg-transparent border-0 px-2 text-white shadow-none">
                                    <UserCircle size={24} className="me-2" />
                                    <span className="fw-semibold">{user?.username}</span>
                                </Dropdown.Toggle>

                                <Dropdown.Menu>
                                    <Dropdown.Header className="text-muted">Signed in as {user?.role}</Dropdown.Header>
                                    <Dropdown.Divider />
                                    <Dropdown.Item onClick={handleLogout} className="text-danger fw-semibold">
                                        Logout
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <Container className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1>Dashboard</h1>
                    {(user?.role === 'Admin' || user?.role === 'TL') && (
                        <Button variant="success" onClick={() => setShowCreateModal(true)}>
                            Create New Project
                        </Button>
                    )}
                </div>

                <Row>
                    {projects.map((project) => (
                        <Col key={project._id} md={4} className="mb-4">
                            <Card>
                                <Card.Body>
                                    <Card.Title>{project.name}</Card.Title>
                                    <Card.Text>
                                        {project.description}
                                    </Card.Text>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <small className="text-muted">
                                            Created by: {project.created_by?.username}
                                        </small>
                                        <Link to={`/projects/${project._id}`} className="btn btn-primary">
                                            View Project
                                        </Link>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                    {projects.length === 0 && (
                        <Col>
                            <p className="text-muted">No projects found. Create one to get started.</p>
                        </Col>
                    )}
                </Row>
            </Container>

            <CreateProjectModal 
                show={showCreateModal} 
                handleClose={() => setShowCreateModal(false)} 
                onProjectCreated={handleProjectCreated}
            />
        </>
    );
};

export default Dashboard;
