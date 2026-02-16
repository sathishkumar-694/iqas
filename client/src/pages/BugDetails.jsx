import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Badge, Form, Button, ListGroup } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';
import axios from 'axios';

const BugDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [bug, setBug] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [status, setStatus] = useState('');

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
            <Button variant="outline-secondary" className="mb-3" onClick={() => navigate(-1)}>
                &larr; Back
            </Button>
            
            <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">Bug #{bug._id.substring(bug._id.length - 6)}</h4>
                    <Form.Select 
                        value={status} 
                        onChange={handleStatusChange} 
                        style={{ width: 'auto' }}
                        disabled={user.role === 'client'} // Example role check
                    >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                    </Form.Select>
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
                            <strong>Assigned To: </strong>{bug.assigned_to?.username || 'Unassigned'}
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
