import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Card, Row, Col, Form, Button, Badge, ListGroup, Spinner, Accordion, Table } from 'react-bootstrap';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import BackButton from '../components/BackButton';
import { Clock, User, Tag, Paperclip, MessageSquare, Activity } from 'lucide-react';

const PRIORITY_COLORS = { 'Low': 'success', 'Medium': 'warning', 'High': 'danger', 'Critical': 'dark' };
const STATUS_COLORS = { 'Open': 'danger', 'In Progress': 'warning', 'Resolved': 'info', 'Closed': 'success' };

const BugDetails = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [bug, setBug] = useState(null);
    const [status, setStatus] = useState('');
    const [devs, setDevs] = useState([]);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [activity, setActivity] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const bugRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/bugs/${id}`, config);
                setBug(bugRes.data);
                setStatus(bugRes.data.status);

                const commentsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/comments/${id}`, config);
                setComments(commentsRes.data);

                const activityRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/bugs/${id}/activity`, config);
                setActivity(activityRes.data);

                const attachRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/attachments/bug/${id}`, config);
                setAttachments(attachRes.data);

                if (user.role === 'Admin' || user.role === 'TL') {
                    const devsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/users?role=Dev`, config);
                    setDevs(devsRes.data);
                }
            } catch (error) {
                console.error('Error fetching bug:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, user]);

    const handleStatusChange = async (newStatus) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`${import.meta.env.VITE_API_URL}/api/bugs/${id}`, { status: newStatus }, config);
            setStatus(newStatus);
        } catch (error) {
            console.error('Error updating status:', error);
            alert(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleAssigneeChange = async (newAssignee) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`${import.meta.env.VITE_API_URL}/api/bugs/${id}`, { assignedTo: newAssignee }, config);
            setBug({ ...bug, assigned_to: { ...bug.assigned_to, _id: newAssignee } });
            window.location.reload();
        } catch (error) {
            console.error('Error assigning:', error);
            alert(error.response?.data?.message || 'Failed to assign');
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/comments/${id}`, { comment_text: newComment }, config);
            setComments([res.data, ...comments]);
            setNewComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/attachments/bug/${id}`, formData);
            setAttachments([res.data, ...attachments]);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('File upload failed.');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteAttachment = async (attachId) => {
        if (!window.confirm('Delete this attachment?')) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/attachments/${attachId}`, config);
            setAttachments(attachments.filter(a => a._id !== attachId));
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
    if (!bug) return <Container className="mt-4"><p>Bug not found.</p></Container>;

    return (
        <Container className="mt-4 mb-5">
            <div className="d-flex align-items-center gap-3 mb-4">
                <BackButton />
                <div>
                    <h2 className="mb-0">{bug.title}</h2>
                    <small className="text-muted">in {bug.project_id?.name || 'Unknown Project'}</small>
                </div>
            </div>

            <Row>
                {/* Main Content */}
                <Col md={8}>
                    <Card className="border-0 shadow-sm mb-3">
                        <Card.Body>
                            <h5>Description</h5>
                            <p>{bug.description || 'No description provided.'}</p>

                            {bug.labels && bug.labels.length > 0 && (
                                <div className="mb-3">
                                    <Tag size={14} className="me-2" />
                                    {bug.labels.map((label, i) => (
                                        <Badge key={i} bg="secondary" className="me-1">{label}</Badge>
                                    ))}
                                </div>
                            )}

                            {(bug.os || bug.browser || bug.device) && (
                                <div className="mt-3">
                                    <h6>Environment</h6>
                                    <Table size="sm" bordered>
                                        <tbody>
                                            {bug.os && <tr><td><strong>OS</strong></td><td>{bug.os}</td></tr>}
                                            {bug.browser && <tr><td><strong>Browser</strong></td><td>{bug.browser}</td></tr>}
                                            {bug.device && <tr><td><strong>Device</strong></td><td>{bug.device}</td></tr>}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Attachments */}
                    <Card className="border-0 shadow-sm mb-3">
                        <Card.Body>
                            <h5><Paperclip size={18} className="me-2" />Attachments ({attachments.length})</h5>
                            <Form.Group className="mb-3">
                                <Form.Control type="file" onChange={handleFileUpload} disabled={uploading} />
                                {uploading && <small className="text-muted">Uploading...</small>}
                            </Form.Group>
                            {attachments.length > 0 ? (
                                <ListGroup variant="flush">
                                    {attachments.map(att => (
                                        <ListGroup.Item key={att._id} className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <a href={`${import.meta.env.VITE_API_URL}${att.file_url}`} target="_blank" rel="noopener noreferrer">
                                                    📎 {att.file_name}
                                                </a>
                                                <small className="text-muted ms-2">by {att.uploaded_by?.username}</small>
                                            </div>
                                            {(att.uploaded_by?._id === user._id || user.role === 'Admin') && (
                                                <Button variant="outline-danger" size="sm" onClick={() => handleDeleteAttachment(att._id)}>✕</Button>
                                            )}
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            ) : <p className="text-muted small">No attachments yet.</p>}
                        </Card.Body>
                    </Card>

                    {/* Comments */}
                    <Card className="border-0 shadow-sm mb-3">
                        <Card.Body>
                            <h5><MessageSquare size={18} className="me-2" />Comments ({comments.length})</h5>
                            <Form onSubmit={handleCommentSubmit} className="mb-3">
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    placeholder="Write a comment... (use @username to mention someone)"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                />
                                <Button type="submit" variant="primary" size="sm" className="mt-2">Post Comment</Button>
                            </Form>
                            {comments.map(c => (
                                <div key={c._id} className="border-bottom py-2">
                                    <strong>{c.user_id?.username}</strong>
                                    <small className="text-muted ms-2">{new Date(c.created_at).toLocaleString()}</small>
                                    <p className="mb-0 mt-1">{c.comment_text}</p>
                                </div>
                            ))}
                        </Card.Body>
                    </Card>

                    {/* Activity Timeline */}
                    <Accordion className="mb-3">
                        <Accordion.Item eventKey="0">
                            <Accordion.Header><Activity size={18} className="me-2" /> Activity Timeline ({activity.length})</Accordion.Header>
                            <Accordion.Body>
                                {activity.length > 0 ? activity.map(log => (
                                    <div key={log._id} className="d-flex gap-2 py-2 border-bottom">
                                        <Badge bg="light" text="dark" className="align-self-start">
                                            {new Date(log.timestamp).toLocaleDateString()}
                                        </Badge>
                                        <div>
                                            <strong>{log.user_id?.username}</strong>
                                            <span className="text-muted ms-1">— {log.action}</span>
                                        </div>
                                    </div>
                                )) : <p className="text-muted">No activity yet.</p>}
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>
                </Col>

                {/* Sidebar */}
                <Col md={4}>
                    <Card className="border-0 shadow-sm mb-3">
                        <Card.Body>
                            <h6>Status</h6>
                            <Form.Select value={status} onChange={(e) => handleStatusChange(e.target.value)} className="mb-3">
                                {['Open', 'In Progress', 'Resolved', 'Closed'].map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </Form.Select>

                            <h6>Priority</h6>
                            <Badge bg={PRIORITY_COLORS[bug.priority]} className="mb-3">{bug.priority}</Badge>

                            <h6><User size={14} className="me-1" />Reporter</h6>
                            <p>{bug.reported_by?.username || 'Unknown'}</p>

                            <h6><User size={14} className="me-1" />Assignee</h6>
                            {(user.role === 'Admin' || user.role === 'TL') ? (
                                <Form.Select
                                    value={bug.assigned_to?._id || ''}
                                    onChange={(e) => handleAssigneeChange(e.target.value)}
                                    className="mb-3"
                                >
                                    <option value="">Unassigned</option>
                                    {devs.map(d => (
                                        <option key={d._id} value={d._id}>{d.username}</option>
                                    ))}
                                </Form.Select>
                            ) : (
                                <p>{bug.assigned_to?.username || 'Unassigned'}</p>
                            )}

                            {bug.due_date && (
                                <>
                                    <h6><Clock size={14} className="me-1" />Due Date</h6>
                                    <p className={new Date(bug.due_date) < new Date() && status !== 'Closed' ? 'text-danger fw-bold' : ''}>
                                        {new Date(bug.due_date).toLocaleDateString()}
                                        {new Date(bug.due_date) < new Date() && status !== 'Closed' && ' (OVERDUE)'}
                                    </p>
                                </>
                            )}

                            <h6>Created</h6>
                            <small className="text-muted">{new Date(bug.created_at).toLocaleString()}</small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default BugDetails;
