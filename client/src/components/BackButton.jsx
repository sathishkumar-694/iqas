import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { ArrowLeft } from 'lucide-react';

const BackButton = () => {
    const navigate = useNavigate();

    return (
        <Button 
            variant="outline-secondary" 
            onClick={() => navigate(-1)}
            className="mb-3 d-flex align-items-center"
            style={{ width: 'fit-content' }}
        >
            <ArrowLeft size={18} className="me-2" />
            Back
        </Button>
    );
};

export default BackButton;
