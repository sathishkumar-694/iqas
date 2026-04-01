import { useState, useContext, useEffect, useRef } from 'react';
import { Form, Button, Alert, Card, Row, Col } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Shield, Mail, Lock, User as UserIcon, Briefcase } from 'lucide-react';

const Auth = () => {
    const location = useLocation();
    const [isRegistering, setIsRegistering] = useState(location.pathname === '/register');
    const [cardHeight, setCardHeight] = useState('auto');
    const registerRef = useRef(null);
    const loginRef = useRef(null);
    
    // Global Auth States
    const { login, register, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');

    // Login Form States
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register Form States
    const [regUsername, setRegUsername] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regRole, setRegRole] = useState('');

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    useEffect(() => {
        setIsRegistering(location.pathname === '/register');
        setError('');
    }, [location.pathname]);

    useEffect(() => {
        // Dynamically adjust wrapper height depending on which card is active
        if (isRegistering && registerRef.current) {
            setCardHeight(registerRef.current.offsetHeight);
        } else if (!isRegistering && loginRef.current) {
            setCardHeight(loginRef.current.offsetHeight);
        }
    }, [isRegistering, error]);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(loginEmail, loginPassword);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await register(regUsername, regEmail, regPassword, regRole);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="login-container px-3">
            <div className="w-100 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '100vh', paddingBottom: '5vh' }}>
                
                {/* Logo Section */}
                <div className="text-center mb-4 text-dark z-index-1" style={{ position: 'relative', zIndex: 2 }}>
                    <div className="d-inline-flex justify-content-center align-items-center bg-primary text-white rounded shadow-sm mb-2" style={{ width: '56px', height: '56px', borderRadius: '16px' }}>
                        <Shield size={30} strokeWidth={2.5} />
                    </div>
                    <h2 className="fw-bold mb-0" style={{ letterSpacing: '-0.5px' }}>IQAS Portal</h2>
                </div>

                {/* Fade Transition Wrapper */}
                <div className="auth-wrapper" style={{ height: cardHeight, transition: 'height 0.4s ease' }}>
                    
                    {/* LOGIN CARD */}
                    <div className={`fade-card ${!isRegistering ? 'fade-in' : 'fade-out'}`} ref={loginRef}>
                        <Card className="login-card p-4 mx-auto w-100">
                            <Card.Body className="p-0 d-flex flex-column">
                                <h5 className="fw-bold mb-1">Welcome Back</h5>
                                <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>Enter your credentials to access your account.</p>
                                
                                {error && !isRegistering && <Alert variant="danger" className="py-1 px-2 text-center mb-3" style={{ fontSize: '0.8rem' }}>{error}</Alert>}
                                
                                <Form onSubmit={handleLoginSubmit}>
                                    <Form.Group className="mb-3" controlId="loginEmail">
                                        <div className="input-icon-wrapper">
                                            <Mail size={16} className="icon" />
                                            <Form.Control
                                                type="email"
                                                placeholder="Email Address"
                                                value={loginEmail}
                                                onChange={(e) => setLoginEmail(e.target.value)}
                                                required
                                                className="py-2"
                                                style={{ fontSize: '0.9rem' }}
                                                tabIndex={isRegistering ? -1 : 0}
                                            />
                                        </div>
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="loginPassword">
                                        <div className="input-icon-wrapper">
                                            <Lock size={16} className="icon" />
                                            <Form.Control
                                                type="password"
                                                placeholder="Password"
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                required
                                                className="py-2"
                                                style={{ fontSize: '0.9rem' }}
                                                tabIndex={isRegistering ? -1 : 0}
                                            />
                                        </div>
                                    </Form.Group>

                                    <Button variant="primary" type="submit" className="w-100 py-2 fw-semibold shadow-sm mt-2" style={{ borderRadius: '8px', fontSize: '0.95rem' }} tabIndex={isRegistering ? -1 : 0}>
                                        Sign In
                                    </Button>
                                </Form>

                                <div className="text-center mt-4 pt-3 border-top">
                                    <span className="text-muted" style={{ fontSize: '0.9rem' }}>Don't have an account? </span>
                                    <span 
                                        className="text-primary fw-semibold" 
                                        style={{ cursor: 'pointer', fontSize: '0.9rem' }} 
                                        onClick={() => setIsRegistering(true)}
                                    >
                                        Register Here
                                    </span>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>

                    {/* REGISTER CARD */}
                    <div className={`fade-card ${isRegistering ? 'fade-in' : 'fade-out'}`} ref={registerRef}>
                        <Card className="login-card p-4 mx-auto w-100">
                            <Card.Body className="p-0 d-flex flex-column">
                                <h5 className="fw-bold mb-1">Create Account</h5>
                                <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>Join the QA system platform.</p>
                                
                                {error && isRegistering && <Alert variant="danger" className="py-1 px-2 text-center mb-3" style={{ fontSize: '0.8rem' }}>{error}</Alert>}
                                
                                <Form onSubmit={handleRegisterSubmit}>
                                    <Row className="gx-2 mb-3">
                                        <Col xs={7}>
                                            <Form.Group controlId="regUsername">
                                                <div className="input-icon-wrapper">
                                                    <UserIcon size={16} className="icon" />
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="Username"
                                                        value={regUsername}
                                                        onChange={(e) => setRegUsername(e.target.value)}
                                                        required
                                                        className="py-2"
                                                        style={{ fontSize: '0.9rem' }}
                                                        tabIndex={!isRegistering ? -1 : 0}
                                                    />
                                                </div>
                                            </Form.Group>
                                        </Col>
                                        <Col xs={5}>
                                            <Form.Group controlId="regRole">
                                                <div className="input-icon-wrapper">
                                                    <Briefcase size={16} className="icon" />
                                                    <Form.Select 
                                                        value={regRole} 
                                                        onChange={(e) => setRegRole(e.target.value)}
                                                        className="py-2"
                                                        style={{ fontSize: '0.9rem', paddingLeft: '35px' }}
                                                        tabIndex={!isRegistering ? -1 : 0}
                                                        required
                                                    >
                                                        <option value="" disabled>-</option>
                                                        <option value="Tester">Tester</option>
                                                        <option value="Dev">Developer</option>
                                                        <option value="TL">Lead</option>
                                                    </Form.Select>
                                                </div>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Form.Group className="mb-3" controlId="regEmail">
                                        <div className="input-icon-wrapper">
                                            <Mail size={16} className="icon" />
                                            <Form.Control
                                                type="email"
                                                placeholder="Email Address"
                                                value={regEmail}
                                                onChange={(e) => setRegEmail(e.target.value)}
                                                required
                                                className="py-2"
                                                style={{ fontSize: '0.9rem' }}
                                                tabIndex={!isRegistering ? -1 : 0}
                                            />
                                        </div>
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="regPassword">
                                        <div className="input-icon-wrapper">
                                            <Lock size={16} className="icon" />
                                            <Form.Control
                                                type="password"
                                                placeholder="Password (min 6 char)"
                                                value={regPassword}
                                                onChange={(e) => setRegPassword(e.target.value)}
                                                required
                                                className="py-2"
                                                style={{ fontSize: '0.9rem' }}
                                                tabIndex={!isRegistering ? -1 : 0}
                                            />
                                        </div>
                                    </Form.Group>

                                    <Button variant="success" type="submit" className="w-100 py-2 fw-semibold shadow-sm mt-2" style={{ borderRadius: '8px', fontSize: '0.95rem' }} tabIndex={!isRegistering ? -1 : 0}>
                                        Confirm
                                    </Button>
                                </Form>

                                <div className="text-center mt-4 pt-3 border-top">
                                    <span className="text-muted" style={{ fontSize: '0.9rem' }}>Already registered? </span>
                                    <span 
                                        className="text-primary fw-semibold" 
                                        style={{ cursor: 'pointer', fontSize: '0.9rem' }} 
                                        onClick={() => setIsRegistering(false)}
                                    >
                                        Switch to Login
                                    </span>
                                </div>
                            </Card.Body>
                        </Card>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
