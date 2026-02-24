import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Table, Button, Badge, Form, Row, Col, Card } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import ReportBugModal from '../components/ReportBugModal';
import BackButton from '../components/BackButton';

const ProjectDetails = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [project, setProject] = useState(null);
    const [bugs, setBugs] = useState([]);
    const [assignedMembers, setAssignedMembers] = useState([]);
    const [availableMembers, setAvailableMembers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

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
                
                // The newly updated project obj populated team_members from backend
                const tMembers = projectRes.data.team_members || [];
                setAssignedMembers(tMembers);

                if (user.role === 'Admin' || user.role === 'TL') {
                    const usersRes = await axios.get(`http://localhost:5000/api/users`, config);
                    
                    // Exclude already assigned members
                    let avail = usersRes.data.filter(u => !tMembers.some(m => m._id === u._id));
                    
                    if (user.role !== 'Admin') {
                        // TLs only see available Devs and Testers
                        avail = avail.filter(u => u.role === 'Dev' || u.role === 'Tester');
                    }
                    setAvailableMembers(avail);
                }
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

    const isOverdue = (dateString) => {
        if (!dateString) return false;
        return new Date(dateString) < new Date();
    };

    const filteredBugs = bugs.filter(bug => {
        const matchesSearch = bug.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || bug.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleAssignMember = async (userId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`http://localhost:5000/api/projects/${id}/members`, { userId }, config);
            
            // Move from available to assigned locally
            const memberToMove = availableMembers.find(m => m._id === userId);
            setAvailableMembers(availableMembers.filter(m => m._id !== userId));
            setAssignedMembers([...assignedMembers, memberToMove]);
        } catch (error) {
            console.error('Error assigning member:', error);
            alert('Failed to assign member');
        }
    };

    const handleRemoveMember = async (userId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`http://localhost:5000/api/projects/${id}/members/${userId}`, config);
            
            // Move from assigned to available locally
            const memberToMove = assignedMembers.find(m => m._id === userId);
            setAssignedMembers(assignedMembers.filter(m => m._id !== userId));
            
            // Re-check role filtering if TL before throwing back into available
            if (user.role === 'Admin' || memberToMove.role === 'Dev' || memberToMove.role === 'Tester') {
                setAvailableMembers([...availableMembers, memberToMove]);
            }
        } catch (error) {
            console.error('Error removing member:', error);
            alert('Failed to remove member');
        }
    };

    return (
        <Container className="mt-4">
            <BackButton />
            {project && (
                <>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h1>{project.name}</h1>
                            <p className="text-muted">{project.description}</p>
                        </div>
                        {(user?.role === 'Admin' || user?.role === 'Tester') && (
                            <Button variant="primary" onClick={() => setShowModal(true)}>
                                Report Bug
                            </Button>
                        )}
                    </div>

                    {/* Current Team Section */}
                    <div className="mb-4">
                        <h4 className="mb-3 border-bottom pb-2">Current Team Members</h4>
                        {assignedMembers.length === 0 ? (
                            <p className="text-muted">No members explicitly assigned to this project yet.</p>
                        ) : (
                            <Row>
                                {assignedMembers.map(member => (
                                    <Col md={4} lg={3} className="mb-3" key={member._id}>
                                        <Card className="bg-light border-0 shadow-sm h-100 position-relative">
                                            {(user?.role === 'Admin' || user?.role === 'TL') && (
                                                <Button 
                                                    variant="danger" 
                                                    size="sm" 
                                                    className="position-absolute rounded-circle"
                                                    style={{ top: '-10px', right: '-10px', width: '28px', height: '28px', padding: 0 }}
                                                    onClick={() => handleRemoveMember(member._id)}
                                                    title="Remove from Team"
                                                >
                                                    &times;
                                                </Button>
                                            )}
                                            <Card.Body className="d-flex align-items-center p-3">
                                                <div className="bg-success text-white rounded-circle d-flex justify-content-center align-items-center me-3" style={{width: '40px', height: '40px', fontWeight: 'bold', fontSize: '1.2rem'}}>
                                                    {member.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h6 className="mb-0 fw-bold text-dark">{member.username}</h6>
                                                    <small className="text-muted fw-semibold">{member.role}</small>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        )}
                    </div>

                    {/* Available / Unassigned Section */}
                    {(user?.role === 'Admin' || user?.role === 'TL') && (
                        <div className="mb-5">
                            <h4 className="mb-3 border-bottom pb-2 text-primary">Available to Assign</h4>
                            {availableMembers.length === 0 ? (
                                <p className="text-muted">No free users available in the system.</p>
                            ) : (
                                <Row>
                                    {availableMembers.map(member => (
                                        <Col md={4} lg={3} className="mb-3" key={member._id}>
                                            <Card className="border shadow-sm h-100 position-relative">
                                                <div className="position-absolute" style={{ top: '10px', right: '10px' }}>
                                                    <Button 
                                                        variant="outline-primary" 
                                                        size="sm"
                                                        onClick={() => handleAssignMember(member._id)}
                                                    >
                                                        + Add
                                                    </Button>
                                                </div>
                                                <Card.Body className="d-flex align-items-center p-3 mt-4">
                                                    <div className="bg-secondary text-white rounded d-flex justify-content-center align-items-center me-3" style={{width: '35px', height: '35px', fontWeight: 'bold', fontSize: '1.1rem'}}>
                                                        {member.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h6 className="mb-0 fw-bold">{member.username}</h6>
                                                        <small className="text-muted">{member.role}</small>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            )}
                        </div>
                    )}

                    <div className="d-flex justify-content-between align-items-center mt-4 mb-3">
                        <h3 className="mb-0">Bugs</h3>
                        <div className="d-flex gap-2">
                            <Form.Control
                                type="text"
                                placeholder="Search bugs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '250px' }}
                            />
                            <Form.Select 
                                value={filterStatus} 
                                onChange={(e) => setFilterStatus(e.target.value)}
                                style={{ width: '150px' }}
                            >
                                <option value="All">All Statuses</option>
                                <option value="Open">Open</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Closed">Closed</option>
                            </Form.Select>
                        </div>
                    </div>

                    <Table striped bordered hover responsive className="align-middle">
                        <thead className="table-dark">
                            <tr>
                                <th>ID</th>
                                <th>Title</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Due Date</th>
                                <th>Assigned To</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBugs.map((bug) => (
                                <tr key={bug._id}>
                                    <td><small className="text-muted">#{bug._id.substring(bug._id.length - 6)}</small></td>
                                    <td className="fw-semibold">{bug.title}</td>
                                    <td>
                                        <Badge bg={getPriorityBadge(bug.priority)}>{bug.priority}</Badge>
                                    </td>
                                    <td>
                                        <Badge bg={getStatusBadge(bug.status)}>{bug.status}</Badge>
                                    </td>
                                    <td>
                                        {bug.due_date ? (
                                            <span className={isOverdue(bug.due_date) && bug.status !== 'Closed' && bug.status !== 'Resolved' ? 'text-danger fw-bold' : ''}>
                                                {new Date(bug.due_date).toLocaleDateString()}
                                                {isOverdue(bug.due_date) && bug.status !== 'Closed' && bug.status !== 'Resolved' && ' ⚠️'}
                                            </span>
                                        ) : <span className="text-muted">-</span>}
                                    </td>
                                    <td>{bug.assigned_to?.username || <span className="text-muted fst-italic">Unassigned</span>}</td>
                                    <td>
                                        <Link to={`/bugs/${bug._id}`} className="btn btn-sm btn-outline-primary">
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {filteredBugs.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="text-center py-4 text-muted">No bugs found matching your criteria.</td>
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
