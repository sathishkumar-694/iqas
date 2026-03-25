import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Spinner, Container } from 'react-bootstrap';
import Navigation from './Navigation';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
                <Spinner animation="border" variant="primary" />
            </Container>
        );
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    return (
        <>
            <Navigation />
            {children}
        </>
    );
};

export default ProtectedRoute;
