import { useState, useEffect, useContext } from 'react';
import { Container, Card, Row, Col, Alert, Badge } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import Navigation from '../components/Navigation';
import { BarChart3, TrendingUp, CheckCircle, AlertOctagon } from 'lucide-react';

const Reports = () => {
    const { user } = useContext(AuthContext);
    const [projects, setProjects] = useState([]);
    const [metrics, setMetrics] = useState({ totalProject: 0, totalBugs: 0, critical: 0, resolved: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                // Fetch projects
                const projRes = await axios.get('http://localhost:5000/api/projects', config);
                const fetchedProjects = projRes.data;
                setProjects(fetchedProjects);

                let tBugs = 0;
                let tCritical = 0;
                let tResolved = 0;

                // Aggregate bugs per project for high level reporting
                for (let p of fetchedProjects) {
                    const bRes = await axios.get(`http://localhost:5000/api/bugs/project/${p._id}`, config);
                    const bugs = bRes.data;
                    tBugs += bugs.length;
                    tCritical += bugs.filter(b => b.priority === 'Critical').length;
                    tResolved += bugs.filter(b => b.status === 'Resolved' || b.status === 'Closed').length;
                }

                setMetrics({
                    totalProject: fetchedProjects.length,
                    totalBugs: tBugs,
                    critical: tCritical,
                    resolved: tResolved
                });
                
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to load reporting data.');
                setLoading(false);
            }
        };

        fetchReportData();
    }, [user]);

    return (
        <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', paddingBottom: '3rem' }}>
            <Navigation />
            
            <Container fluid className="px-4 mt-5">
                <div className="mb-4 pb-2 border-bottom">
                    <h2 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.5px' }}>System Reports</h2>
                    <span className="text-muted" style={{ fontSize: '0.9rem' }}>High-level system metrics and bug resolution aggregates.</span>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}

                {!loading && !error && (
                    <>
                        <Row className="mb-4 g-4">
                            <Col md={3}>
                                <Card className="custom-card border-0 h-100">
                                    <Card.Body className="p-4 d-flex align-items-center">
                                        <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-3 me-3">
                                            <BarChart3 size={24} />
                                        </div>
                                        <div>
                                            <div className="text-muted fw-semibold small text-uppercase">Total Projects</div>
                                            <h3 className="fw-bold mb-0">{metrics.totalProject}</h3>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="custom-card border-0 h-100">
                                    <Card.Body className="p-4 d-flex align-items-center">
                                        <div className="bg-info bg-opacity-10 text-info p-3 rounded-3 me-3">
                                            <TrendingUp size={24} />
                                        </div>
                                        <div>
                                            <div className="text-muted fw-semibold small text-uppercase">Total Bugs</div>
                                            <h3 className="fw-bold mb-0">{metrics.totalBugs}</h3>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="custom-card border-0 h-100">
                                    <Card.Body className="p-4 d-flex align-items-center">
                                        <div className="bg-danger bg-opacity-10 text-danger p-3 rounded-3 me-3">
                                            <AlertOctagon size={24} />
                                        </div>
                                        <div>
                                            <div className="text-muted fw-semibold small text-uppercase">Critical Issues</div>
                                            <h3 className="fw-bold mb-0">{metrics.critical}</h3>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="custom-card border-0 h-100">
                                    <Card.Body className="p-4 d-flex align-items-center">
                                        <div className="bg-success bg-opacity-10 text-success p-3 rounded-3 me-3">
                                            <CheckCircle size={24} />
                                        </div>
                                        <div>
                                            <div className="text-muted fw-semibold small text-uppercase">Resolved / Closed</div>
                                            <h3 className="fw-bold mb-0">{metrics.resolved}</h3>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        <Card className="custom-card border-0 mt-2">
                            <Card.Header className="bg-white border-bottom-0 pt-4 pb-0 px-4">
                                <h5 className="fw-bold">Project Breakdown</h5>
                            </Card.Header>
                            <Card.Body className="p-4">
                                {projects.length > 0 ? (
                                    <ul className="list-group list-group-flush">
                                        {projects.map(p => (
                                            <li key={p._id} className="list-group-item d-flex justify-content-between align-items-center py-3 px-0 border-secondary border-opacity-10">
                                                <span className="fw-medium text-dark">{p.name}</span>
                                                <Badge bg="light" text="dark" className="border">Active</Badge>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-muted text-center py-4">No projects available for reporting.</div>
                                )}
                            </Card.Body>
                        </Card>
                    </>
                )}
            </Container>
        </div>
    );
};

export default Reports;
