import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Card, Badge, Form, Button, Row, Col, Dropdown, DropdownButton } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import Navigation from '../components/Navigation';
import { MessageSquare, Info, History, AlertTriangle, Monitor, UserCheck, ChevronLeft, Smartphone, Globe } from 'lucide-react';


const BugDetails = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [bug, setBug] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [status, setStatus] = useState('');
    const [devs, setDevs] = useState([]);

    useEffect(() => {
        const fetchBugData = async () => {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                };
                const bugRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/bugs/${id}`, config);
                setBug(bugRes.data);
                setStatus(bugRes.data.status);

                const commentsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/comments/${id}`, config);
                setComments(commentsRes.data);

                if (user.role === 'Admin' || user.role === 'TL') {
                    const devsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/users?role=Dev`, config);
                    setDevs(devsRes.data);
                }
            } catch (error) {
                console.error('Error fetching bug details:', error);
            }
        };

        if (user) {
            fetchBugData();
        }
    }, [id, user]);

    const handleStatusChange = async (newStatus) => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            await axios.put(`${import.meta.env.VITE_API_URL}/api/bugs/${id}`, { status: newStatus }, config);
            setStatus(newStatus);
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleAssignChange = async (e) => {
        const newAssignee = e.target.value;
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            await axios.put(`${import.meta.env.VITE_API_URL}/api/bugs/${id}`, { assignedTo: newAssignee }, config);
            setBug({ ...bug, assigned_to: { ...bug.assigned_to, _id: newAssignee } });
            window.location.reload(); 
        } catch (error) {
            console.error('Error updating assignee:', error);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/comments/${id}`, { comment_text: newComment }, config);
            setComments([res.data, ...comments]);
            setNewComment('');
        } catch (error) {
            console.error('Error posting comment:', error);
        }
    };

    const getPriorityBadgeClass = (priority) => {
        switch (priority) {
            case 'Critical': return 'badge-high';
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
            default: return 'bg-light text-dark';
        }
    };

    if (!bug) return <div className="text-center mt-5">Loading bug data...</div>;

    const bugIdFormat = `#BUG-${bug._id.substring(bug._id.length - 3)}`;

    return (
        <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', paddingBottom: '3rem' }}>
            <Navigation />

            <Container fluid className="px-4 mt-4">
                {/* Improved Back Button UI */}
                <Link 
                    to={bug.project_id ? `/projects/${bug.project_id._id}` : '/dashboard'} 
                    className="text-decoration-none d-inline-flex align-items-center mb-4 px-3 py-2 bg-white rounded-pill text-dark hover-effect" 
                    style={{ fontSize: '0.9rem', fontWeight: '500', transition: 'all 0.2s', border: '1px solid #adb5bd' }}
                >
                    <ChevronLeft size={18} className="me-1" /> Back
                </Link>

                <div className="d-flex justify-content-between align-items-start mb-4 pb-2">
                    <div>
                        <div className="d-flex align-items-center mb-2">
                            <span className="text-muted fw-bold me-3" style={{ fontFamily: 'monospace', fontSize: '1.2rem', letterSpacing: '1px' }}>{bugIdFormat}</span>
                            <Badge bg="transparent" className={`badge-pill-custom ${getStatusBadgeClass(status)}`} style={{ fontSize: '0.8rem', padding: '0.4em 0.8em', border: '2px solid currentColor' }}>
                                {status.toUpperCase()}
                            </Badge>
                        </div>
                        <h2 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.5px', fontSize: '2rem' }}>{bug.title}</h2>
                    </div>
                </div>

                <Row>
                    {/* LEFT COLUMN: MAIN CONTENT */}
                    <Col lg={8} className="bs-border-end-0">
                        {/* Description Section */}
                        <Card className="custom-card mb-4 border-0">
                            <Card.Body className="p-4">
                                <h6 className="fw-bold text-dark mb-3 d-flex align-items-center">
                                    <AlertTriangle size={18} className="me-2 text-warning" /> Bug Description
                                </h6>
                                <p className="text-dark" style={{ lineHeight: '1.7', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
                                    {bug.description}
                                </p>
                            </Card.Body>
                        </Card>

                        {/* Discussion Section */}
                        <Card className="custom-card border-0">
                            <Card.Body className="p-4">
                                <h6 className="fw-bold text-dark mb-4 d-flex align-items-center">
                                    <MessageSquare size={18} className="me-2 text-primary" /> Bug Discussion
                                </h6>

                                <div className="mb-4">
                                    <Form onSubmit={handleCommentSubmit}>
                                        <Form.Group className="mb-3">
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                placeholder="Add your comments, findings, or questions here..."
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                className="bg-light border-0 py-2"
                                                style={{ borderRadius: '12px', fontSize: '0.95rem' }}
                                                required
                                            />
                                        </Form.Group>
                                        <div className="d-flex justify-content-end">
                                            <Button type="submit" variant="primary" className="fw-medium px-4 py-2 shadow-sm rounded-pill">
                                                Post Comment
                                            </Button>
                                        </div>
                                    </Form>
                                </div>

                                <div className="d-flex flex-column gap-3">
                                    {comments.length === 0 ? (
                                        <div className="text-center text-muted p-4 bg-light rounded-3">
                                            No comments yet. Start the discussion!
                                        </div>
                                    ) : (
                                        comments.map((comment) => (
                                            <div key={comment._id} className="d-flex gap-3 p-3 bg-light rounded-3">
                                                <div className="rounded-circle bg-white shadow-sm d-flex justify-content-center align-items-center text-primary" style={{ width: '40px', height: '40px', fontWeight: 'bold', fontSize: '1.1rem', flexShrink: 0 }}>
                                                    {comment.user_id?.username?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="d-flex align-items-baseline gap-2 mb-1">
                                                        <span className="fw-bold text-dark">{comment.user_id?.username}</span>
                                                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                            {new Date(comment.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <div className="text-dark" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
                                                        {comment.comment_text}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* RIGHT COLUMN: SIDEBAR DETAILS & ACTIONS */}
                    <Col lg={4}>
                        {/* Quick Actions Panel */}
                        <div className="mb-4">
                            <h6 className="fw-bold text-dark mb-3 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                                Quick Actions
                            </h6>
                            <Card className="custom-card border-0 bg-white">
                                <Card.Body className="p-3 d-flex flex-column gap-2">
                                    {/* Developer Actions */}
                                    {user.role === 'Dev' && status === 'Open' && (
                                        <Button variant="outline-primary" className="fw-medium text-start rounded-3" onClick={() => handleStatusChange('In Progress')}>
                                            Start Progress
                                        </Button>
                                    )}
                                    {user.role === 'Dev' && status === 'In Progress' && (
                                        <Button variant="success" className="fw-medium text-start shadow-sm border-0 rounded-3 text-white" onClick={() => handleStatusChange('Resolved')}>
                                            Mark as Resolved
                                        </Button>
                                    )}

                                    {/* Tester Actions */}
                                    {user.role === 'Tester' && status === 'Resolved' && (
                                        <>
                                            <Button variant="success" className="fw-medium text-start rounded-3 shadow-sm" onClick={() => handleStatusChange('Closed')}>
                                                Verify & Close Ticket
                                            </Button>
                                            <Button variant="outline-danger" className="fw-medium text-start rounded-3" onClick={() => handleStatusChange('Open')}>
                                                Reopen Ticket (Failed)
                                            </Button>
                                        </>
                                    )}

                                    {/* Admin/TL Force Override */}
                                    {(user.role === 'Admin' || user.role === 'TL') && (
                                        <DropdownButton 
                                            id="dropdown-status-override" 
                                            title="Override Status" 
                                            variant="outline-secondary" 
                                            className="w-100"
                                        >
                                            <Dropdown.Item onClick={() => handleStatusChange('Open')} disabled={status === 'Open'}>Open</Dropdown.Item>
                                            <Dropdown.Item onClick={() => handleStatusChange('In Progress')} disabled={status === 'In Progress'}>In Progress</Dropdown.Item>
                                            <Dropdown.Item onClick={() => handleStatusChange('Resolved')} disabled={status === 'Resolved'}>Resolved</Dropdown.Item>
                                            <Dropdown.Item onClick={() => handleStatusChange('Closed')} disabled={status === 'Closed'}>Closed</Dropdown.Item>
                                        </DropdownButton>
                                    )}

                                    {!(user.role === 'Dev' || (user.role === 'Tester' && status === 'Resolved') || user.role === 'Admin' || user.role === 'TL') && (
                                        <span className="text-muted small text-center">No actions available</span>
                                    )}
                                </Card.Body>
                            </Card>
                        </div>

                        {/* Bug Details Meta Panel */}
                        <div>
                            <h6 className="fw-bold text-dark mb-3 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                                Bug Details
                            </h6>
                            <Card className="custom-card border-0 bg-white">
                                <Card.Body className="p-0">
                                    {/* Property Rows */}
                                    <div className="d-flex justify-content-between py-3 px-4 border-bottom">
                                        <span className="text-muted d-flex align-items-center" style={{ fontSize: '0.85rem' }}>
                                            <Info size={14} className="me-2" /> Project
                                        </span>
                                        <span className="fw-medium text-dark" style={{ fontSize: '0.85rem' }}>{bug.project_id?.name || 'N/A'}</span>
                                    </div>
                                    <div className="d-flex justify-content-between py-3 px-4 border-bottom">
                                        <span className="text-muted d-flex align-items-center" style={{ fontSize: '0.85rem' }}>
                                            <AlertTriangle size={14} className="me-2" /> Priority
                                        </span>
                                        <Badge bg="transparent" className={`badge-pill-custom ${getPriorityBadgeClass(bug.priority)}`} style={{ fontSize: '0.7rem' }}>
                                            {bug.priority}
                                        </Badge>
                                    </div>
                                    <div className="d-flex justify-content-between py-3 px-4 border-bottom">
                                        <span className="text-muted d-flex align-items-center" style={{ fontSize: '0.85rem' }}>
                                            <UserCheck size={14} className="me-2" /> Reported By
                                        </span>
                                        <span className="fw-medium text-dark" style={{ fontSize: '0.85rem' }}>{bug.reported_by?.username || 'System User'}</span>
                                    </div>
                                    <div className="d-flex justify-content-between py-3 px-4 border-bottom">
                                        <span className="text-muted d-flex align-items-center" style={{ fontSize: '0.85rem' }}>
                                            <History size={14} className="me-2" /> Created
                                        </span>
                                        <span className="fw-medium text-dark" style={{ fontSize: '0.85rem' }}>
                                            {new Date(bug.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="py-3 px-4 border-bottom">
                                        <span className="text-muted d-flex align-items-center mb-2" style={{ fontSize: '0.85rem' }}>
                                            <Monitor size={14} className="me-2" /> Assigned To
                                        </span>
                                        {(user.role === 'Admin' || user.role === 'TL') ? (
                                            <Form.Select 
                                                size="sm" 
                                                value={bug.assigned_to?._id || ''} 
                                                onChange={handleAssignChange}
                                                className="bg-light border-0 fw-medium"
                                                style={{ borderRadius: '8px' }}
                                            >
                                                <option value="">Unassigned</option>
                                                {devs.map(d => (
                                                    <option key={d._id} value={d._id}>{d.username}</option>
                                                ))}
                                            </Form.Select>
                                        ) : (
                                            <div className="fw-medium text-dark bg-light p-2 rounded-3 text-center" style={{ fontSize: '0.85rem' }}>
                                                {bug.assigned_to?.username || 'Unassigned'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="py-3 px-4 bg-light rounded-bottom" style={{ borderRadius: '0 0 12px 12px' }}>
                                        <span className="text-muted d-flex align-items-center mb-3 fw-semibold text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                                            <Monitor size={14} className="me-2 text-primary" /> Environment Specs
                                        </span>
                                        
                                        <div className="d-flex flex-column gap-2 text-dark" style={{ fontSize: '0.85rem' }}>
                                            <div className="d-flex justify-content-between align-items-center pb-2 border-bottom border-secondary border-opacity-10">
                                                <span className="text-muted d-flex align-items-center"><Monitor size={14} className="me-2" /> OS</span>
                                                <span className="fw-medium">{bug.os || 'Not Specified'}</span>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center pb-2 border-bottom border-secondary border-opacity-10">
                                                <span className="text-muted d-flex align-items-center"><Globe size={14} className="me-2" /> Browser</span>
                                                <span className="fw-medium">{bug.browser || 'Not Specified'}</span>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center pb-1">
                                                <span className="text-muted d-flex align-items-center"><Smartphone size={14} className="me-2" /> Device</span>
                                                <span className="fw-medium">{bug.device || 'Not Specified'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default BugDetails;
