import React, { useState, useEffect } from 'react';
import { Container, Table, Badge, Card, Row, Col, Spinner } from 'react-bootstrap';
import { Trophy, Star, TrendingUp, Zap } from 'lucide-react';
import axios from 'axios';

const Leaderboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/ranking/leaderboard`, { withCredentials: true });
                setLeaderboard(res.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching leaderboard:', error);
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    const getRankBadge = (rank) => {
        switch (rank) {
            case 4: return <Badge bg="info">Platinum</Badge>;
            case 3: return <Badge bg="warning">Gold</Badge>;
            case 2: return <Badge bg="secondary">Silver</Badge>;
            default: return <Badge bg="dark">Bronze</Badge>;
        }
    };

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" variant="primary" /></Container>;

    return (
        <Container className="mt-4 mb-5">
            <div className="text-center mb-5">
                <Trophy size={48} className="text-warning mb-2" />
                <h2 className="fw-bold">IQAS Quality Leaderboard</h2>
                <p className="text-muted">Top contributors ranked by their resolution points and work quality.</p>
            </div>

            <Row className="mb-4">
                {leaderboard.slice(0, 3).map((user, index) => (
                    <Col md={4} key={user._id}>
                        <Card className={`text-center shadow-sm border-0 mb-3 ${index === 0 ? 'bg-light border-warning' : ''}`} style={{ borderTop: index === 0 ? '4px solid gold' : 'none' }}>
                            <Card.Body>
                                <div className="display-6 mb-2">
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                </div>
                                <Card.Title className="fw-bold">{user.username}</Card.Title>
                                <div className="mb-2">{getRankBadge(user.rank)}</div>
                                <h3 className="text-primary">{user.points} <small className="fs-6 text-muted">pts</small></h3>
                                <div className="text-muted small">Resolved: {user.bugs_resolved_count || 0} bugs</div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Card className="shadow-sm border-0">
                <Card.Body className="p-0">
                    <Table responsive hover className="mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="ps-4">#</th>
                                <th>User</th>
                                <th>Rank</th>
                                <th>Efficiency</th>
                                <th>Resolved</th>
                                <th className="text-end pe-4">Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((user, index) => (
                                <tr key={user._id} className="align-middle">
                                    <td className="ps-4 text-muted">{index + 1}</td>
                                    <td className="fw-bold text-dark">{user.username}</td>
                                    <td>{getRankBadge(user.rank)}</td>
                                    <td>
                                        <Badge pill bg="success" style={{ opacity: 0.8 }}>
                                            {(user.efficiency_score || 0).toFixed(1)}%
                                        </Badge>
                                    </td>
                                    <td>{user.bugs_resolved_count || 0}</td>
                                    <td className="text-end pe-4 text-primary fw-bold">{user.points}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <div className="mt-4 p-3 bg-light rounded text-muted small">
                <Zap size={14} className="me-1" /> <strong>How are points calculated?</strong> Points are awarded based on bug complexity and priority. High-priority, complex bugs grant more points. Reopening a bug results in a penalty.
            </div>
        </Container>
    );
};

export default Leaderboard;
