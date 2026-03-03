import { useState, useContext } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import Navigation from '../components/Navigation';
import BackButton from '../components/BackButton';
import { Save, UserCircle } from 'lucide-react';

const ProfileSettings = () => {
    const { user, login } = useContext(AuthContext); // we use login to update context user locally
    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };
            
            const payload = { username, email };
            if (password) payload.password = password;

            const res = await axios.put('http://localhost:5000/api/users/profile', payload, config);
            
            // Re-login to update the context (token stays the same technically)
            login({ ...res.data, token: user.token });
            
            setMessage('Profile updated successfully!');
            setPassword(''); // clear password field
        } catch (err) {
            setError(err.response?.data?.message || 'Error updating profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', paddingBottom: '3rem' }}>
            <Navigation />
            
            <Container className="mt-4" style={{ maxWidth: '600px' }}>
                <BackButton fallbackRoute="/dashboard" />
                
                <Card className="custom-card border-0 mb-4 mt-3">
                    <Card.Body className="p-4 p-md-5">
                        <div className="text-center mb-4">
                            <UserCircle size={64} className="text-primary mb-3" strokeWidth={1} />
                            <h2 className="fw-bold text-dark mb-1">Profile Settings</h2>
                            <p className="text-muted">Manage your personal information and security.</p>
                        </div>

                        {message && <Alert variant="success" className="py-2 text-center rounded-3">{message}</Alert>}
                        {error && <Alert variant="danger" className="py-2 text-center rounded-3">{error}</Alert>}

                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-4">
                                <Form.Label className="fw-semibold text-dark small">Username</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    value={username} 
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="py-2 bg-light border-0 rounded-3"
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className="fw-semibold text-dark small">Email Address</Form.Label>
                                <Form.Control 
                                    type="email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="py-2 bg-light border-0 rounded-3"
                                    required
                                />
                            </Form.Group>

                            <div className="border-top pt-4 mb-4">
                                <h6 className="fw-bold text-dark mb-1">Update Password</h6>
                                <p className="text-muted small">Leave blank if you do not wish to change your password.</p>
                                <Form.Group>
                                    <Form.Control 
                                        type="password" 
                                        placeholder="New Password" 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="py-2 bg-light border-0 rounded-3"
                                    />
                                </Form.Group>
                            </div>

                            <Button 
                                type="submit" 
                                variant="primary" 
                                className="w-100 py-3 fw-bold rounded-pill shadow-sm d-flex justify-content-center align-items-center"
                                disabled={loading}
                            >
                                <Save size={18} className="me-2" />
                                {loading ? 'Saving Changes...' : 'Save Changes'}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default ProfileSettings;
