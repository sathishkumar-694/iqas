import { useContext, useEffect, useState } from 'react';
import { Navbar, Container, Nav, Dropdown, Form } from 'react-bootstrap';
import { Shield, UserCircle, LogOut, Settings, Moon, Sun } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

const Navigation = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    // Theme state
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('iqas-theme') === 'dark');

    const toggleTheme = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        if (newMode) {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
            localStorage.setItem('iqas-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-bs-theme');
            localStorage.setItem('iqas-theme', 'light');
        }
    };

    useEffect(() => {
        // Global Theme Initializer on mount
        const isDark = localStorage.getItem('iqas-theme') === 'dark';
        if (isDark) {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
            setIsDarkMode(true);
        }
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <Navbar expand="lg" className="iqas-navbar sticky-top py-2 bg-body-tertiary shadow-sm">
            <Container fluid className="px-4">
                <Navbar.Brand as={Link} to="/dashboard" className="d-flex align-items-center me-4">
                    <Shield size={24} className="text-primary me-2" strokeWidth={2.5} />
                    <span className="fw-bold" style={{ letterSpacing: '-0.5px' }}>IQAS</span>
                </Navbar.Brand>
                
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto gap-2">
                        <Nav.Link as={Link} to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
                            Dashboard
                        </Nav.Link>
                        {(user?.role === 'Admin' || user?.role === 'TL') && (
                            <Nav.Link as={Link} to="/reports" className={location.pathname === '/reports' ? 'active' : ''}>
                                Reports
                            </Nav.Link>
                        )}
                        {(user?.role === 'Admin' || user?.role === 'TL') && (
                            <Nav.Link as={Link} to="/users" className={location.pathname === '/users' ? 'active' : ''}>
                                Users
                            </Nav.Link>
                        )}
                    </Nav>
                </Navbar.Collapse>

                {/* Right Side Icons */}
                <div className="d-flex align-items-center gap-3 ms-auto ms-lg-3">
                    <NotificationDropdown />
                    
                    {/* Profile Dropdown */}
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

                        <Dropdown.Menu className="shadow-sm border-0 mt-2 rounded-3" style={{ minWidth: '220px' }}>
                            <Dropdown.Header className="text-muted d-md-none">
                                Signed in as {user?.role}
                            </Dropdown.Header>
                            
                            <Dropdown.Item as={Link} to="/profile" className="d-flex align-items-center py-2">
                                <Settings size={16} className="me-2 text-muted" />
                                <span className="fw-medium">Profile Settings</span>
                            </Dropdown.Item>

                            <Dropdown.Divider />
                            
                            {/* Theme Switch exactly as requested inside dropdown */}
                            <div className="px-3 py-2 d-flex justify-content-between align-items-center" onClick={toggleTheme} style={{ cursor: 'pointer' }}>
                                <div className="d-flex align-items-center">
                                    {isDarkMode ? <Moon size={16} className="me-2 text-warning" /> : <Sun size={16} className="me-2 text-warning" />}
                                    <span className="fw-medium" style={{ fontSize: '0.9rem' }}>Dark Mode</span>
                                </div>
                                <Form.Check 
                                    type="switch"
                                    id="theme-switch"
                                    checked={isDarkMode}
                                    onChange={toggleTheme}
                                    className="m-0"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>

                            <Dropdown.Divider />

                            <Dropdown.Item onClick={handleLogout} className="d-flex align-items-center py-2 text-danger">
                                <LogOut size={16} className="me-2" />
                                <span className="fw-semibold">Logout</span>
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            </Container>
        </Navbar>
    );
};

export default Navigation;
