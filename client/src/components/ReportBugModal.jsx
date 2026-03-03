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
    const [os, setOs] = useState('');
    const [browser, setBrowser] = useState('');
    const [device, setDevice] = useState('');

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
                dueDate,
                os,
                browser,
                device
            }, config);

            // Reset form
            setTitle('');
            setDescription('');
            setPriority('Medium');
            setDueDate('');
            setOs('');
            setBrowser('');
            setDevice('');
            
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
                        <Form.Label>OS (Optional)</Form.Label>
                        <Form.Control 
                            type="text" 
                            placeholder="e.g. Windows 11, macOS Sonoma" 
                            value={os} 
                            onChange={(e) => setOs(e.target.value)} 
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Browser (Optional)</Form.Label>
                        <Form.Control 
                            type="text" 
                            placeholder="e.g. Chrome, Firefox, Safari" 
                            value={browser} 
                            onChange={(e) => setBrowser(e.target.value)} 
                        />
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label>Device (Optional)</Form.Label>
                        <Form.Control 
                            type="text" 
                            placeholder="e.g. Desktop, iPhone 14, Android Tablet" 
                            value={device} 
                            onChange={(e) => setDevice(e.target.value)} 
                        />
                    </Form.Group>

                    <Button variant="primary" type="submit" className="w-100 py-2 fw-bold">
                        Submit Report
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default ReportBugModal;
