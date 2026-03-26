import { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Spinner, Button, Table, Badge } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import BackButton from '../components/BackButton';

const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

const Reports = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/reports/dashboard`, { withCredentials: true });
                setStats(res.data);
            } catch (error) {
                console.error('Error fetching reports:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [user]);

    const handleExportCSV = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/reports/export`, {
                withCredentials: true,
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'bugs_report.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. You may not have permission.');
        }
    };

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
    if (!stats) return <Container className="mt-4"><p>Failed to load reports.</p></Container>;

    const statusData = Object.entries(stats.bugsByStatus).map(([name, value]) => ({ name, value }));
    const priorityData = Object.entries(stats.bugsByPriority).map(([name, value]) => ({ name, value }));

    return (
        <Container className="mt-4 mb-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-3">
                    <BackButton />
                    <h2 className="mb-0">📊 Reports & Analytics</h2>
                </div>
                {(user.role === 'Admin' || user.role === 'TL') && (
                    <Button variant="outline-primary" onClick={handleExportCSV}>
                        📥 Export CSV
                    </Button>
                )}
            </div>

            {/* Summary Cards */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="text-center p-3 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white' }}>
                        <h3>{stats.totalProjects}</h3>
                        <small>Total Projects</small>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center p-3 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)', color: 'white' }}>
                        <h3>{stats.totalBugs}</h3>
                        <small>Total Bugs</small>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center p-3 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)', color: 'white' }}>
                        <h3>{stats.totalUsers}</h3>
                        <small>Total Users</small>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center p-3 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #fa709a, #fee140)', color: 'white' }}>
                        <h3>{stats.overdueBugs}</h3>
                        <small>Overdue Bugs</small>
                    </Card>
                </Col>
            </Row>

            {stats.avgResolutionHours > 0 && (
                <Row className="mb-4">
                    <Col>
                        <Card className="p-3 border-0 shadow-sm text-center">
                            <small className="text-muted">Average Resolution Time</small>
                            <h4 className="mb-0">{stats.avgResolutionHours} hours</h4>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Charts Row */}
            <Row className="mb-4">
                <Col md={6}>
                    <Card className="p-3 border-0 shadow-sm">
                        <h5 className="mb-3">Bugs by Status</h5>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={statusData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                                    {statusData.map((entry, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="p-3 border-0 shadow-sm">
                        <h5 className="mb-3">Bugs by Priority</h5>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={priorityData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]}>
                                    {priorityData.map((entry, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
            </Row>

            {/* Bugs Over Time */}
            {stats.bugsOverTime.length > 0 && (
                <Row className="mb-4">
                    <Col>
                        <Card className="p-3 border-0 shadow-sm">
                            <h5 className="mb-3">Bug Trend Over Time</h5>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={stats.bugsOverTime}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} name="Bugs Created" />
                                </LineChart>
                            </ResponsiveContainer>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Bugs by Project & Top Assignees */}
            <Row className="mb-4">
                <Col md={6}>
                    <Card className="p-3 border-0 shadow-sm">
                        <h5 className="mb-3">Bugs by Project</h5>
                        {stats.bugsByProject.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={stats.bugsByProject} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="projectName" type="category" width={120} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <p className="text-muted">No data yet</p>}
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="p-3 border-0 shadow-sm">
                        <h5 className="mb-3">Top Bug Assignees</h5>
                        {stats.topAssignees.length > 0 ? (
                            <Table hover size="sm">
                                <thead>
                                    <tr><th>Developer</th><th>Assigned Bugs</th></tr>
                                </thead>
                                <tbody>
                                    {stats.topAssignees.map((a, i) => (
                                        <tr key={i}>
                                            <td>{a.username}</td>
                                            <td><Badge bg="primary">{a.count}</Badge></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        ) : <p className="text-muted">No data yet</p>}
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Reports;
