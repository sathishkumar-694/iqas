import { useState, useContext } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';
import axios from 'axios';

const CreateProjectModal = ({ show, onHide, onCreated }) => {
    const { user } = useContext(AuthContext);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/projects`, {
                name,
                description,
            }, { withCredentials: true });

            // Reset form
            setName('');
            setDescription('');
            
            if (onCreated) onCreated(res.data);
            onHide();
        } catch (error) {
            console.error('Error creating project:', error);
            alert(error.response?.data?.message || 'Error creating project');
        }
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Create New Project</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Project Name</Form.Label>
                        <Form.Control 
                            type="text" 
                            placeholder="Enter project name" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            required 
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control 
                            as="textarea" 
                            rows={3} 
                            placeholder="Enter project description"
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                        />
                    </Form.Group>

                    <Button variant="primary" type="submit">
                        Create Project
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default CreateProjectModal;

