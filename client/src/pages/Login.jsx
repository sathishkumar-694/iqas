import { useState, useContext } from 'react';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Shield, Mail, Lock } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(email, password);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="login-container">
            {/* Logo Section */}
            <div className="text-center mb-4">
                <div className="d-inline-flex justify-content-center align-items-center bg-primary text-white rounded shadow-sm mb-3" style={{ width: '56px', height: '56px', borderRadius: '14px' }}>
                    <Shield size={32} strokeWidth={2.5} />
                </div>
                <h2 className="fw-bold mb-1" style={{ letterSpacing: '-0.5px' }}>IQAS</h2>
                <p className="text-muted" style={{ fontSize: '0.9rem' }}>IT Quality Assurance System</p>
            </div>

            {/* Form Card */}
            <Card className="login-card">
                <Card.Body className="p-0">
                    <h4 className="fw-bold mb-1">Login</h4>
                    <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>Please enter your credentials to access the portal.</p>
                    
                    {error && <Alert variant="danger" className="py-2 text-center" style={{ fontSize: '0.9rem' }}>{error}</Alert>}
                    
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-4" controlId="formBasicEmail">
                            <Form.Label className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>Email Address</Form.Label>
                            <div className="input-icon-wrapper">
                                <Mail size={18} className="icon" />
                                <Form.Control
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="py-2"
                                />
                            </div>
                        </Form.Group>

                        <Form.Group className="mb-4" controlId="formBasicPassword">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <Form.Label className="fw-semibold text-dark mb-0" style={{ fontSize: '0.85rem' }}>Password</Form.Label>
                                <a href="#" className="text-decoration-none text-primary" style={{ fontSize: '0.8rem' }}>Forgot password?</a>
                            </div>
                            <div className="input-icon-wrapper">
                                <Lock size={18} className="icon" />
                                <Form.Control
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="py-2"
                                />
                            </div>
                        </Form.Group>

                        <Form.Group className="mb-4" controlId="formBasicCheckbox">
                            <Form.Check 
                                type="checkbox" 
                                label={<span className="text-muted" style={{ fontSize: '0.9rem' }}>Keep me logged in</span>}
                            />
                        </Form.Group>

                        <Button variant="primary" type="submit" className="w-100 py-2 fw-semibold shadow-sm mb-4" style={{ borderRadius: '8px' }}>
                            Sign In
                        </Button>
                    </Form>

                    <div className="text-center mb-4 border-bottom pb-4">
                        <span className="text-muted" style={{ fontSize: '0.9rem' }}>Don't have an account? </span>
                        <Link to="/register" className="text-decoration-none fw-semibold">Register</Link>
                    </div>

                    <div className="text-center">
                        <Link to="/admin-login" className="text-muted text-decoration-none d-inline-flex align-items-center" style={{ fontSize: '0.75rem' }}>
                            <Lock size={12} className="me-1" /> Admin Login
                        </Link>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Login;
