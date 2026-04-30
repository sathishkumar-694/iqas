import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Table, Button, Badge, Form, Row, Col, Card } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import ReportBugModal from '../components/ReportBugModal';
import Navigation from '../components/Navigation';
import { toast } from 'react-toastify';
import { ArrowLeft, BugPlay, Search, Filter, Plus, X } from 'lucide-react';

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
    const [projectStats, setProjectStats] = useState(null);

    useEffect(() => {
        const fetchProjectData = async () => {
            try {
                const config = { withCredentials: true };
                const projectRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects/${id}`, config);

                setProject(projectRes.data);

                const bugsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/bugs/project/${id}?limit=100`, config);
                setBugs(bugsRes.data.data || bugsRes.data);
                
                const tMembers = projectRes.data.team_members || [];
                setAssignedMembers(tMembers);

                if (user.role === 'Admin' || user.role === 'TL') {
                    const statsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/reports/project/${id}`, config);
                    setProjectStats(statsRes.data);

                    const usersRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`, config);
                    let avail = usersRes.data.filter(u => !tMembers.some(m => m._id === u._id) && u.role !== 'Admin');
                    
                    if (user.role !== 'Admin') {
                        avail = avail.filter(u => u.role === 'Dev' || u.role === 'Tester');
                    }
                    setAvailableMembers(avail);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load project details');
            }
        };

        if (user) {
            fetchProjectData();
        }
    }, [id, user, showModal]);

    const getPriorityBadgeClass = (priority) => {
        switch (priority) {
            case 'Critical': return 'badge-high'; // Using high style for critical
            case 'High': return 'badge-high';
            case 'Medium': return 'badge-medium';
            case 'Low': return 'badge-low';
            default: return 'bg-secondary';
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Open': return 'badge-open';
            case 'In Progress': return 'badge-inprogress';
            case 'Resolved': return 'badge-resolved';
            case 'Closed': return 'badge-closed';
            default: return 'bg-body-secondary text-body';
        }
    };

    const isOverdue = (dateString) => {
        if (!dateString) return false;
        return new Date(dateString) < new Date();
    };

    const filteredBugs = bugs.filter(bug => {
        const matchesSearch = bug.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              bug._id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || bug.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleAssignMember = async (userId) => {
        try {
            const config = { withCredentials: true };
            await axios.put(`${import.meta.env.VITE_API_URL}/api/projects/${id}/members`, { userId }, config);
            
            // Move from available to assigned locally
            const memberToMove = availableMembers.find(m => m._id === userId);
            setAvailableMembers(availableMembers.filter(m => m._id !== userId));
            setAssignedMembers([...assignedMembers, memberToMove]);
        } catch (error) {
            console.error('Error assigning member:', error);
            toast.error('Failed to assign team member');
        }
    };

    const handleRemoveMember = async (userId) => {
        try {
            const config = { withCredentials: true };
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/projects/${id}/members/${userId}`, config);
            
            // Move from assigned to available locally
            const memberToMove = assignedMembers.find(m => m._id === userId);
            setAssignedMembers(assignedMembers.filter(m => m._id !== userId));
            if (user.role === 'Admin' || memberToMove.role === 'Dev' || memberToMove.role === 'Tester') {
                setAvailableMembers([...availableMembers, memberToMove]);
            }
        } catch (error) {
            console.error('Error removing member:', error);
            toast.error('Failed to remove team member');
        }
    };

    return (
        <div className="bg-body-tertiary" style={{ minHeight: '100vh', paddingBottom: '3rem' }}>
            

            <Container fluid className="px-4 mt-4">
                <Link 
                    to="/dashboard" 
                    className="text-decoration-none d-inline-flex align-items-center mb-4 px-3 py-2 bg-body border border-secondary-subtle rounded-pill text-body hover-effect" 
                    style={{ fontSize: '0.9rem', fontWeight: '500', transition: 'all 0.2s', border: '1px solid #adb5bd' }}
                >
                    <ArrowLeft size={16} className="me-2" /> Back
                </Link>

                {project && (
                    <>
                        <div className="d-flex justify-content-between align-items-start mb-4 pb-4 border-bottom">
                            <div className="pe-4" style={{ maxWidth: '70%' }}>
                                <h2 className="fw-bold text-body mb-2" style={{ letterSpacing: '-0.5px' }}>{project.name}</h2>
                                <p className="text-muted mb-0" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>{project.description}</p>
                            </div>
                            {(user?.role === 'Admin' || user?.role === 'Tester') && (
                                <Button 
                                    variant="primary" 
                                    className="d-flex align-items-center fw-semibold rounded-3 px-3 py-2 shadow-sm flex-shrink-0"
                                    onClick={() => setShowModal(true)}
                                >
                                    <BugPlay size={18} className="me-2" /> Report Bug
                                </Button>
                            )}
                        </div>

                        {/* Real-time Math Analytics / Report Banner */}
                        {/* Project Performance Dashboard (Admin/TL Only) */}
                        {(user?.role === 'Admin' || user?.role === 'TL') && projectStats && (
                            <Row className="mb-4">
                                <Col md={12}>
                                    <Card className="border-0 shadow-sm rounded-4 bg-dark text-white p-4">
                                        <Row className="align-items-center">
                                            <Col md={3}>
                                                <h5 className="fw-bold text-info mb-1">Project Health</h5>
                                                <div className="display-4 fw-bold">
                                                    {Math.round((bugs.filter(b => b.status === 'Resolved' || b.status === 'Closed').length / (bugs.length || 1)) * 100)}%
                                                </div>
                                                <small className="opacity-75">Completion Rate</small>
                                            </Col>
                                            <Col md={3}>
                                                <h6 className="opacity-75 mb-1">Avg Complexity</h6>
                                                <h3 className="fw-bold">{(projectStats.qualityMetrics?.[0]?.avgComplexity || 0).toFixed(1)} / 5</h3>
                                            </Col>
                                            <Col md={3}>
                                                <h6 className="opacity-75 mb-1">Avg Resolution</h6>
                                                <h3 className="fw-bold">{projectStats.avgResolutionHours} hrs</h3>
                                            </Col>
                                            <Col md={3}>
                                                <h6 className="opacity-75 mb-1">Top Performer</h6>
                                                <h5 className="fw-bold text-warning">{projectStats.topAssignees?.[0]?.username || 'N/A'}</h5>
                                                <small className="opacity-75">{projectStats.topAssignees?.[0]?.points || 0} pts</small>
                                            </Col>
                                        </Row>
                                    </Card>
                                </Col>
                            </Row>
                        )}

                        <Row className="mb-4">
                            <Col md={3} sm={6} className="mb-3 mb-md-0">
                                <Card className="border-0 shadow-sm rounded-4 h-100 overflow-hidden position-relative">
                                    <div className="position-absolute top-0 start-0 w-100 h-100 opacity-10" style={{ background: 'linear-gradient(45deg, #0d6efd, transparent)' }}></div>
                                    <Card.Body className="p-3 d-flex flex-column justify-content-center position-relative z-1">
                                        <h6 className="text-secondary fw-bold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>TOTAL BUGS</h6>
                                        <h2 className="fw-bold mb-0 text-primary">{bugs.length}</h2>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3} sm={6} className="mb-3 mb-md-0">
                                <Card className="border-0 shadow-sm rounded-4 h-100 overflow-hidden position-relative">
                                    <div className="position-absolute top-0 start-0 w-100 h-100 opacity-10" style={{ background: 'linear-gradient(45deg, #dc3545, transparent)' }}></div>
                                    <Card.Body className="p-3 d-flex flex-column justify-content-center position-relative z-1">
                                        <h6 className="text-secondary fw-bold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>OPEN BUGS</h6>
                                        <h2 className="fw-bold mb-0 text-danger">{bugs.filter(b => b.status === 'Open').length}</h2>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3} sm={6} className="mb-3 mb-md-0">
                                <Card className="border-0 shadow-sm rounded-4 h-100 overflow-hidden position-relative">
                                    <div className="position-absolute top-0 start-0 w-100 h-100 opacity-10" style={{ background: 'linear-gradient(45deg, #198754, transparent)' }}></div>
                                    <Card.Body className="p-3 d-flex flex-column justify-content-center position-relative z-1">
                                        <h6 className="text-secondary fw-bold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>RESOLVED</h6>
                                        <h2 className="fw-bold mb-0 text-success">{bugs.filter(b => b.status === 'Resolved' || b.status === 'Closed').length}</h2>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3} sm={6}>
                                <Card className="border-0 shadow-sm rounded-4 h-100 overflow-hidden position-relative">
                                    <div className="position-absolute top-0 start-0 w-100 h-100 opacity-10" style={{ background: 'linear-gradient(45deg, #ffc107, transparent)' }}></div>
                                    <Card.Body className="p-3 d-flex flex-column justify-content-center position-relative z-1">
                                        <h6 className="text-secondary fw-bold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>OVERDUE</h6>
                                        <h2 className="fw-bold mb-0 text-warning">{bugs.filter(b => isOverdue(b.due_date) && b.status !== 'Closed' && b.status !== 'Resolved').length}</h2>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        <Row>
                            {/* LEFT COLUMN: TEAM MEMBERS (Only visible to Admin & TL) */}
                            {(user?.role === 'Admin' || user?.role === 'TL') && (
                                <Col lg={3} md={4} className="mb-4 pe-lg-4">
                                    {/* Current Team Section */}
                                    <div className="mb-4">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h6 className="fw-bold mb-0 text-body d-flex align-items-center">
                                                <span className="text-primary me-2">👥</span> Current Team Members
                                            </h6>
                                            <Badge bg="primary" pill className="opacity-75">{assignedMembers.length}</Badge>
                                        </div>
                                        
                                        <div className="d-flex flex-column gap-2">
                                            {assignedMembers.length === 0 ? (
                                                <div className="text-muted small p-3 text-center bg-body border border-secondary-subtle rounded-3 border">No members assigned</div>
                                            ) : (
                                                assignedMembers.map(member => (
                                                    <Card key={member._id} className="border-0 shadow-sm rounded-3">
                                                        <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                                                            <div className="d-flex align-items-center">
                                                                <div className="rounded-circle d-flex justify-content-center align-items-center me-3 text-secondary" style={{ width: '36px', height: '36px', backgroundColor: '#e5e7eb', fontWeight: 'bold' }}>
                                                                    {member.username.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="fw-bold text-body" style={{ fontSize: '0.9rem' }}>{member.username}</div>
                                                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{member.role}</div>
                                                                </div>
                                                            </div>
                                                            {member.role !== 'Admin' && (
                                                                <Button 
                                                                    variant="link" 
                                                                    className="p-1 text-danger opacity-75 custom-hover-opacity" 
                                                                    onClick={() => handleRemoveMember(member._id)}
                                                                >
                                                                    <X size={16} />
                                                                </Button>
                                                            )}
                                                        </Card.Body>
                                                    </Card>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Available to Assign Section */}
                                    <div>
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h6 className="fw-bold mb-0 text-success d-flex align-items-center">
                                                <span className="text-success me-2">👤+</span> Available to Assign
                                            </h6>
                                        </div>
                                        
                                        <div className="d-flex flex-column gap-2">
                                            {availableMembers.length === 0 ? (
                                                <div className="text-muted small p-3 text-center bg-body border border-secondary-subtle rounded-3 border border-dashed">No users available</div>
                                            ) : (
                                                availableMembers.map(member => (
                                                    <Card key={member._id} className="border border-dashed shadow-sm rounded-3 bg-body border border-secondary-subtle">
                                                        <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                                                            <div className="d-flex align-items-center">
                                                                <div className="rounded-circle d-flex justify-content-center align-items-center me-3 text-muted" style={{ width: '36px', height: '36px', backgroundColor: '#f3f4f6', fontWeight: 'bold' }}>
                                                                    {member.username.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="fw-bold text-body" style={{ fontSize: '0.9rem' }}>{member.username}</div>
                                                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{member.role}</div>
                                                                </div>
                                                            </div>
                                                            <Button 
                                                                variant="outline-primary" 
                                                                size="sm"
                                                                className="rounded-pill d-flex align-items-center"
                                                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                                                                onClick={() => handleAssignMember(member._id)}
                                                            >
                                                                <Plus size={14} className="me-1" /> Add
                                                            </Button>
                                                        </Card.Body>
                                                    </Card>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </Col>
                            )}

                            {/* RIGHT COLUMN: BUG DATA TABLE */}
                            <Col lg={(user?.role === 'Admin' || user?.role === 'TL') ? 9 : 12} md={(user?.role === 'Admin' || user?.role === 'TL') ? 8 : 12}>
                                <Card className="custom-card">
                                    <Card.Body className="p-0">
                                        <div className="d-flex flex-wrap justify-content-between align-items-center p-4 border-bottom">
                                            <h5 className="fw-bold mb-0 text-body d-flex align-items-center">
                                                <span className="text-warning me-2">☰</span> Bug Tracking
                                            </h5>
                                            
                                            <div className="d-flex gap-3 align-items-center">
                                                <div className="position-relative">
                                                    <Search size={16} className="position-absolute text-muted" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="Search bugs..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className="ps-5 bg-body-secondary border-0"
                                                        style={{ width: '220px', borderRadius: '8px' }}
                                                    />
                                                </div>
                                                <Form.Select 
                                                    value={filterStatus} 
                                                    onChange={(e) => setFilterStatus(e.target.value)}
                                                    className="bg-body-secondary border-0 fw-medium text-body"
                                                    style={{ width: '160px', borderRadius: '8px' }}
                                                >
                                                    <option value="All">All Statuses</option>
                                                    <option value="Open">Open</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="Resolved">Resolved</option>
                                                    <option value="Closed">Closed</option>
                                                </Form.Select>
                                            </div>
                                        </div>

                                        <Table hover responsive className="bug-table mb-0 align-middle">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-3 bg-body border border-secondary-subtle border-0 border-bottom text-muted">ID</th>
                                                    <th className="py-3 bg-body border border-secondary-subtle border-0 border-bottom text-muted">TITLE</th>
                                                    <th className="py-3 bg-body border border-secondary-subtle border-0 border-bottom text-muted">PRIORITY</th>
                                                    <th className="py-3 bg-body border border-secondary-subtle border-0 border-bottom text-muted">STATUS</th>
                                                    <th className="py-3 bg-body border border-secondary-subtle border-0 border-bottom text-muted">DUE DATE</th>
                                                    <th className="py-3 bg-body border border-secondary-subtle border-0 border-bottom text-muted">ASSIGNED TO</th>
                                                    <th className="px-4 py-3 bg-body border border-secondary-subtle border-0 border-bottom text-muted text-end">ACTION</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredBugs.map((bug) => (
                                                    <tr key={bug._id}>
                                                        <td className="px-4 py-3">
                                                            <span className="text-muted fw-medium" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                                                #BUG-{bug._id.substring(bug._id.length - 3)}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 fw-semibold text-body">{bug.title}</td>
                                                        <td className="py-3">
                                                            <Badge bg="transparent" className={`badge-pill-custom ${getPriorityBadgeClass(bug.priority || 'Medium')}`}>
                                                                {bug.priority || 'Medium'}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-3">
                                                            <Badge bg="transparent" className={`badge-pill-custom ${getStatusBadgeClass(bug.status || 'Open')}`}>
                                                                {bug.status || 'Open'}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-3">
                                                            <div className="d-flex flex-column">
                                                                {bug.due_date ? (
                                                                    <>
                                                                        <span className={`fw-medium ${isOverdue(bug.due_date) && bug.status !== 'Closed' && bug.status !== 'Resolved' ? 'text-danger fw-bold' : 'text-body'}`} style={{ fontSize: '0.85rem' }}>
                                                                            {new Date(bug.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}
                                                                        </span>
                                                                        {isOverdue(bug.due_date) && bug.status !== 'Closed' && bug.status !== 'Resolved' && (
                                                                            <span className="text-danger" style={{ fontSize: '0.7rem', fontWeight: 600 }}>OVERDUE</span>
                                                                        )}
                                                                    </>
                                                                ) : <span className="text-muted">-</span>}
                                                            </div>
                                                        </td>
                                                        <td className="py-3">
                                                            {bug.assigned_to ? (
                                                                <div className="d-flex align-items-center">
                                                                     <div className="rounded-circle d-flex justify-content-center align-items-center me-2 text-white bg-dark" style={{ width: '24px', height: '24px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                                        {bug.assigned_to.username.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <span className="text-body fw-medium" style={{ fontSize: '0.85rem' }}>
                                                                        {bug.assigned_to.username}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted fst-italic" style={{ fontSize: '0.85rem' }}>Unassigned</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-end">
                                                            <Link to={`/bugs/${bug._id}`} className="btn btn-sm btn-outline-primary rounded-pill fw-medium px-3">
                                                                View Details
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {filteredBugs.length === 0 && (
                                                    <tr>
                                                        <td colSpan="7" className="text-center py-5 text-muted">
                                                            <div className="mb-2"><Search size={32} className="opacity-50" /></div>
                                                            No bugs found matching your criteria.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        <ReportBugModal 
                            show={showModal} 
                            handleClose={() => setShowModal(false)} 
                            projectId={id}
                        />
                    </>
                )}
            </Container>
        </div>
    );
};

export default ProjectDetails;
