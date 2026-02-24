import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Badge, Form, Button, ListGroup, Dropdown, DropdownButton } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import BackButton from '../components/BackButton';

const BugDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [bug, setBug] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [status, setStatus] = useState('');
    const [devs, setDevs] = useState([]);
    const [assignedTo, setAssignedTo] = useState('');

    useEffect(() => {
        const fetchBugData = async () => {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                };
                const bugRes = await axios.get(`http://localhost:5000/api/bugs/${id}`, config);
                setBug(bugRes.data);
                setStatus(bugRes.data.status);

                const commentsRes = await axios.get(`http://localhost:5000/api/comments/${id}`, config);
                setComments(commentsRes.data);

                if (user.role === 'Admin' || user.role === 'TL') {
                    const devsRes = await axios.get(`http://localhost:5000/api/users?role=Dev`, config);
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

    const handleStatusChange = async (e) => {
        const newStatus = e.target.value;
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            await axios.put(`http://localhost:5000/api/bugs/${id}`, { status: newStatus }, config);
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
            await axios.put(`http://localhost:5000/api/bugs/${id}`, { assignedTo: newAssignee }, config);
            setBug({ ...bug, assigned_to: { ...bug.assigned_to, _id: newAssignee } });
            window.location.reload(); 
        } catch (error) {
            console.error('Error updating assignee:', error);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const res = await axios.post(`http://localhost:5000/api/comments/${id}`, { comment_text: newComment }, config);
            setComments([res.data, ...comments]);
            setNewComment('');
        } catch (error) {
            console.error('Error posting comment:', error);
        }
    };

    if (!bug) return <Container className="mt-4">Loading...</Container>;

    return (
        <Container className="mt-4">
            <BackButton />
            
            <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">Bug #{bug._id.substring(bug._id.length - 6)}</h4>
                    
                    {/* Professional Action Pipeline */}
                    <div className="d-flex align-items-center gap-2">
                        {/* Current Status Badge */}
                        <Badge 
                            bg={status === 'Resolved' ? 'success' : status === 'Closed' ? 'secondary' : status === 'In Progress' ? 'warning' : 'danger'}
                            className="me-3 p-2 px-3 fs-6"
                        >
                            {status.toUpperCase()}
                        </Badge>

                        {/* Developer Actions */}
                        {user.role === 'Dev' && status === 'Open' && (
                            <Button variant="outline-primary" size="sm" onClick={() => handleStatusChange({target: {value: 'In Progress'}})}>
                                Start Progress
                            </Button>
                        )}
                        {user.role === 'Dev' && status === 'In Progress' && (
                            <Button variant="success" size="sm" onClick={() => handleStatusChange({target: {value: 'Resolved'}})}>
                                Mark as Resolved
                            </Button>
                        )}

                        {/* Tester Actions */}
                        {user.role === 'Tester' && status === 'Resolved' && (
                            <>
                                <Button variant="success" size="sm" onClick={() => handleStatusChange({target: {value: 'Closed'}})}>
                                    ✔️ Close Ticket (Pass)
                                </Button>
                                <Button variant="danger" size="sm" onClick={() => handleStatusChange({target: {value: 'Open'}})}>
                                    ❌ Reopen Ticket (Fail)
                                </Button>
                            </>
                        )}

                        {/* Admin/TL Force Override */}
                        {(user.role === 'Admin' || user.role === 'TL') && (
                            <DropdownButton 
                                id="dropdown-status-override" 
                                title="Change Status" 
                                variant="outline-secondary" 
                                size="sm"
                            >
                                <Dropdown.Item onClick={() => handleStatusChange({target: {value: 'Open'}})} disabled={status === 'Open'}>Open</Dropdown.Item>
                                <Dropdown.Item onClick={() => handleStatusChange({target: {value: 'In Progress'}})} disabled={status === 'In Progress'}>In Progress</Dropdown.Item>
                                <Dropdown.Item onClick={() => handleStatusChange({target: {value: 'Resolved'}})} disabled={status === 'Resolved'}>Resolved</Dropdown.Item>
                                <Dropdown.Item onClick={() => handleStatusChange({target: {value: 'Closed'}})} disabled={status === 'Closed'}>Closed</Dropdown.Item>
                            </DropdownButton>
                        )}
                    </div>
                </Card.Header>
                <Card.Body>
                    <Card.Title>{bug.title}</Card.Title>
                    <Card.Text>{bug.description}</Card.Text>
                    <div className="d-flex gap-3 mb-3">
                        <div>
                            <strong>Priority: </strong>
                            <Badge bg={bug.priority === 'Critical' ? 'danger' : 'info'}>{bug.priority}</Badge>
                        </div>
                        <div>
                            <strong>Project: </strong>{bug.project_id?.name}
                        </div>
                        <div>
                            <strong>Reported By: </strong>{bug.reported_by?.username}
                        </div>
                        <div>
                            <strong>Assigned To: </strong>
                            {user.role === 'Admin' || user.role === 'TL' ? (
                                <Form.Select 
                                    size="sm" 
                                    value={bug.assigned_to?._id || ''} 
                                    onChange={handleAssignChange}
                                    style={{ display: 'inline-block', width: 'auto', marginLeft: '10px' }}
                                >
                                    <option value="">Unassigned</option>
                                    {devs.map(d => (
                                        <option key={d._id} value={d._id}>{d.username}</option>
                                    ))}
                                </Form.Select>
                            ) : (
                                <span>{bug.assigned_to?.username || 'Unassigned'}</span>
                            )}
                        </div>
                    </div>
                </Card.Body>
            </Card>

            <h4>Comments</h4>
            <Form onSubmit={handleCommentSubmit} className="mb-4">
                <Form.Group className="mb-2">
                    <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        required
                    />
                </Form.Group>
                <Button type="submit" variant="primary">Post Comment</Button>
            </Form>

            <ListGroup>
                {comments.map((comment) => (
                    <ListGroup.Item key={comment._id}>
                        <div className="d-flex justify-content-between">
                            <strong>{comment.user_id?.username}</strong>
                            <small className="text-muted">
                                {new Date(comment.created_at).toLocaleString()}
                            </small>
                        </div>
                        <p className="mb-1">{comment.comment_text}</p>
                    </ListGroup.Item>
                ))}
            </ListGroup>
        </Container>
    );
};

export default BugDetails;
