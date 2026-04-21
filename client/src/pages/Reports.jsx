import { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Spinner, Button, Table, Badge } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Layers, Bug, Users, Clock, Download, TrendingUp, BarChart3, PieChart as PieIcon } from 'lucide-react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import BackButton from '../components/BackButton';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6', '#14b8a6'];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-recharts-tooltip">
                <p className="label">{`${label}`}</p>
                <p className="desc" style={{ color: payload[0].fill || payload[0].stroke }}>
                    {`${payload[0].name}: ${payload[0].value}`}
                </p>
            </div>
        );
    }
    return null;
};

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
        <Container className="mt-4 mb-5 animate-fade-in">
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div className="d-flex align-items-center gap-3">
                    <BackButton />
                    <div>
                        <h2 className="mb-0 fw-bold text-gradient">Analytics Dashboard</h2>
                        <small className="text-muted">Monitor project quality and bug metrics</small>
                    </div>
                </div>
                {(user.role === 'Admin' || user.role === 'TL') && (
                    <Button variant="primary" className="shadow-sm px-4 d-flex align-items-center gap-2" onClick={handleExportCSV}>
                        <Download size={18} /> Export Data
                    </Button>
                )}
            </div>

            {/* Summary Cards */}
            <Row className="mb-5 g-4">
                {[
                    { label: 'Total Projects', value: stats.totalProjects, icon: <Layers size={24} />, class: 'bg-gradient-indigo' },
                    { label: 'Active Bugs', value: stats.totalBugs, icon: <Bug size={24} />, class: 'bg-gradient-rose' },
                    { label: 'Platform Users', value: stats.totalUsers, icon: <Users size={24} />, class: 'bg-gradient-emerald' },
                    { label: 'Overdue Bugs', value: stats.overdueBugs, icon: <Clock size={24} />, class: 'bg-gradient-amber' }
                ].map((item, idx) => (
                    <Col md={3} key={idx}>
                        <Card className={`stat-card ${item.class}`}>
                            <div className="icon-blob"></div>
                            <div className="position-relative z-1">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    {item.icon}
                                    <TrendingUp size={16} className="opacity-50" />
                                </div>
                                <h2 className="fw-bold mb-0">{item.value}</h2>
                                <small className="opacity-75 fw-medium uppercase tracking-wider">{item.label}</small>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {stats.avgResolutionHours > 0 && (
                <Row className="mb-5">
                    <Col>
                        <Card className="glass-card border-0 p-4 text-center">
                            <div className="d-flex align-items-center justify-content-center gap-3">
                                <div className="p-3 bg-light rounded-circle text-primary">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <h4 className="mb-0 fw-bold">{stats.avgResolutionHours} Hours</h4>
                                    <small className="text-muted">Average Bug Resolution Time</small>
                                </div>
                            </div>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Charts Row */}
            <Row className="mb-5 g-4 text-center">
                <Col md={6}>
                    <Card className="chart-card p-4 border-0 h-100">
                        <div className="d-flex align-items-center gap-2 mb-4">
                            <PieIcon size={20} className="text-indigo" />
                            <h5 className="mb-0 fw-bold">Bugs by Status</h5>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie 
                                    data={statusData} 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius={70} 
                                    outerRadius={100} 
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="d-flex flex-wrap justify-content-center gap-3 mt-3">
                            {statusData.map((s, i) => (
                                <div key={i} className="small d-flex align-items-center gap-2">
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length] }}></div>
                                    <span className="text-muted">{s.name} ({s.value})</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="chart-card p-4 border-0 h-100">
                        <div className="d-flex align-items-center gap-2 mb-4">
                            <BarChart3 size={20} className="text-indigo" />
                            <h5 className="mb-0 fw-bold">Severity Analysis</h5>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={priorityData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40}>
                                    {priorityData.map((entry, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
            </Row>


            {/* Bugs by Project & Top Assignees */}
            <Row className="mb-5 g-4">
                <Col md={7}>
                    <Card className="chart-card p-4 border-0 h-100">
                        <div className="d-flex align-items-center gap-2 mb-4">
                            <Layers size={20} className="text-indigo" />
                            <h5 className="mb-0 fw-bold">Project Distribution</h5>
                        </div>
                        {stats.bugsByProject.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={stats.bugsByProject} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="projectName" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <div className="text-center py-5 text-muted">No distribution data available</div>}
                    </Card>
                </Col>
                <Col md={5}>
                    <Card className="chart-card p-4 border-0 h-100">
                        <div className="d-flex align-items-center gap-2 mb-4">
                            <Users size={20} className="text-indigo" />
                            <h5 className="mb-0 fw-bold">Productivity Leaderboard</h5>
                        </div>
                        {stats.topAssignees.length > 0 ? (
                            <div className="table-responsive">
                                <Table borderless hover className="align-middle mb-0">
                                    <thead>
                                        <tr className="text-muted small uppercase">
                                            <th className="fw-medium">Developer</th>
                                            <th className="fw-medium text-end">Handled</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.topAssignees.map((a, i) => (
                                            <tr key={i}>
                                                <td>
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center fw-bold text-primary" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                                                            {a.username.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="fw-medium">{a.username}</span>
                                                    </div>
                                                </td>
                                                <td className="text-end font-monospace"><Badge className="bg-indigo-soft text-indigo px-3">{a.count}</Badge></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        ) : <div className="text-center py-5 text-muted">No productivity data available</div>}
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Reports;
