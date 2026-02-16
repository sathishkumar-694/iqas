import { useState, useContext } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';
import axios from 'axios';

const ReportBugModal = ({ show, handleClose, projectId }) => {
    const { user } = useContext(AuthContext);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [dueDate, setDueDate] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            await axios.post('http://localhost:5000/api/bugs', {
                title,
                description,
                priority,
                projectId,
                dueDate
            }, config);

            // Reset form
            setTitle('');
            setDescription('');
            setPriority('Medium');
            setDueDate('');
            
            handleClose();
        } catch (error) {
            console.error('Error creating bug:', error);
            alert(error.response?.data?.message || 'Error creating bug');
        }
    };

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Report Bug</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Title</Form.Label>
                        <Form.Control 
                            type="text" 
                            placeholder="Bug title" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            required 
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control 
                            as="textarea" 
                            rows={3} 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Priority</Form.Label>
                        <Form.Select 
                            value={priority} 
                            onChange={(e) => setPriority(e.target.value)}
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Due Date</Form.Label>
                        <Form.Control 
                            type="date" 
                            value={dueDate} 
                            onChange={(e) => setDueDate(e.target.value)} 
                        />
                    </Form.Group>

                    <Button variant="primary" type="submit">
                        Submit Report
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default ReportBugModal;
