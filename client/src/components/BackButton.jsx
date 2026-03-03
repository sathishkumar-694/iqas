import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { ChevronLeft } from 'lucide-react';

const BackButton = ({ fallbackRoute = '/dashboard' }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate(fallbackRoute);
        }
    };

    return (
        <Button 
            variant="light" 
            onClick={handleBack}
            className="mb-3 d-flex align-items-center rounded-pill px-3 py-2 bg-white text-dark hover-effect"
            style={{ width: 'fit-content', border: '1px solid #adb5bd' }}
        >
            <ChevronLeft size={18} className="me-1" />
            Back
        </Button>
    );
};

export default BackButton;
