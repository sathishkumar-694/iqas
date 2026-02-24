import { useState, useContext } from 'react';
import { Form, Button, Container, Row, Col, Alert, Card } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import axios from 'axios';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext); // We will use a custom login flow instead
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const { data } = await axios.post('/api/auth/admin-login', { email, password });
            // Save admin token to local storage and update context manually or through a new context method
            localStorage.setItem('user', JSON.stringify(data));
            // Force a reload to let AuthContext pick up the local storage, or ideally we add adminLogin to context
            window.location.href = '/dashboard'; 
        } catch (error) {
            setError(error.response?.data?.message || 'Invalid Admin credentials');
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            <Row>
                <Col md={12}>
                    <Card className="p-4 shadow-sm" style={{ width: '400px', borderTop: '4px solid #dc3545' }}>
                        <Card.Body>
                            <h2 className="text-center mb-4 text-danger">Supreme Admin Login</h2>
                            {error && <Alert variant="danger">{error}</Alert>}
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3" controlId="formBasicEmail">
                                    <Form.Label>Admin Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="Enter admin email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formBasicPassword">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Button variant="danger" type="submit" className="w-100 mt-2">
                                    Secure Login
                                </Button>
                            </Form>
                            <div className="mt-3 text-center">
                                Not an admin? <Link to="/login" className="text-secondary">Return to normal login</Link>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default AdminLogin;
