import { useContext, useState, useEffect } from 'react';
import { Navbar, Container, Nav, Dropdown } from 'react-bootstrap';
import { Shield, UserCircle, Moon, Sun } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

const Navigation = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('iqas-theme') === 'dark';
    });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
            localStorage.setItem('iqas-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-bs-theme');
            localStorage.setItem('iqas-theme', 'light');
        }
    }, [darkMode]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Navbar bg={darkMode ? 'dark' : 'white'} expand="lg" className="iqas-navbar sticky-top py-2" data-bs-theme={darkMode ? 'dark' : 'light'}>
            <Container fluid className="px-4">
                <Navbar.Brand as={Link} to="/dashboard" className="d-flex align-items-center me-4">
                    <Shield size={24} className="text-primary me-2" strokeWidth={2.5} />
                    <span className="fw-bold" style={{ letterSpacing: '-0.5px' }}>IQAS</span>
                </Navbar.Brand>
                
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto gap-2">
                        <Nav.Link 
                            as={Link} 
                            to="/dashboard" 
                            className={location.pathname === '/dashboard' ? 'active' : ''}
                        >
                            Dashboard
                        </Nav.Link>

                        <Nav.Link as={Link} to="/reports" className={location.pathname === '/reports' ? 'active' : ''}>
                            Reports
                        </Nav.Link>
                        {(user?.role === 'Admin' || user?.role === 'TL') && (
                            <Nav.Link as={Link} to="/users" className={location.pathname === '/users' ? 'active' : ''}>
                                Users
                            </Nav.Link>
                        )}
                    </Nav>

                    <Nav className="align-items-center gap-3">
                        {/* Dark Mode Toggle */}
                        <Nav.Link onClick={() => setDarkMode(!darkMode)} className="p-1">
                            {darkMode ? <Sun size={20} className="text-warning" /> : <Moon size={20} />}
                        </Nav.Link>

                        {/* Notification Bell */}
                        <NotificationDropdown />
                        
                        {/* Profile Section */}
                        <Dropdown align="end">
                            <Dropdown.Toggle 
                                variant="light" 
                                id="dropdown-profile" 
                                className="d-flex align-items-center bg-transparent border-0 px-2 shadow-none"
                            >
                                <div className="text-end me-2 d-none d-md-block">
                                    <div className="fw-semibold" style={{ fontSize: '0.9rem', lineHeight: '1.2' }}>
                                        {user?.username}
                                    </div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>
                                        {user?.role === 'Admin' ? 'System Administrator' : user?.role + ' User'}
                                    </div>
                                </div>
                                <UserCircle size={32} strokeWidth={1.5} className="text-secondary" />
                            </Dropdown.Toggle>

                            <Dropdown.Menu className="shadow-sm border-0 mt-2 rounded-3">
                                <Dropdown.Header className="text-muted d-md-none">
                                    Signed in as {user?.role}
                                </Dropdown.Header>
                                <Dropdown.Item as={Link} to="/profile" className="fw-medium">Profile Settings</Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={handleLogout} className="text-danger fw-semibold">
                                    Logout
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default Navigation;
