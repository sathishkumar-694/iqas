import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Table, Button, Badge } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import ReportBugModal from '../components/ReportBugModal';

const ProjectDetails = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [project, setProject] = useState(null);
    const [bugs, setBugs] = useState([]);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchProjectData = async () => {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                };
                const projectRes = await axios.get(`http://localhost:5000/api/projects/${id}`, config);
                setProject(projectRes.data);

                const bugsRes = await axios.get(`http://localhost:5000/api/bugs/project/${id}`, config);
                setBugs(bugsRes.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        if (user) {
            fetchProjectData();
        }
    }, [id, user, showModal]);

    const getPriorityBadge = (priority) => {
        switch (priority) {
            case 'Critical': return 'danger';
            case 'High': return 'warning';
            case 'Medium': return 'primary';
            case 'Low': return 'success';
            default: return 'secondary';
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Open': return 'danger';
            case 'In Progress': return 'warning';
            case 'Resolved': return 'success';
            case 'Closed': return 'secondary';
            default: return 'light';
        }
    };

    return (
        <Container className="mt-4">
            {project && (
                <>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h1>{project.name}</h1>
                            <p className="text-muted">{project.description}</p>
                        </div>
                        <Button variant="primary" onClick={() => setShowModal(true)}>
                            Report Bug
                        </Button>
                    </div>

                    <h3>Bugs</h3>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Title</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Reported By</th>
                                <th>Assigned To</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bugs.map((bug) => (
                                <tr key={bug._id}>
                                    <td>{bug._id.substring(bug._id.length - 6)}</td>
                                    <td>{bug.title}</td>
                                    <td>
                                        <Badge bg={getPriorityBadge(bug.priority)}>{bug.priority}</Badge>
                                    </td>
                                    <td>
                                        <Badge bg={getStatusBadge(bug.status)}>{bug.status}</Badge>
                                    </td>
                                    <td>{bug.reported_by?.username}</td>
                                    <td>{bug.assigned_to?.username || 'Unassigned'}</td>
                                    <td>
                                        <Link to={`/bugs/${bug._id}`} className="btn btn-sm btn-info text-white">
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {bugs.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="text-center">No bugs reported yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>

                    <ReportBugModal 
                        show={showModal} 
                        handleClose={() => setShowModal(false)} 
                        projectId={id}
                    />
                </>
            )}
        </Container>
    );
};

export default ProjectDetails;
