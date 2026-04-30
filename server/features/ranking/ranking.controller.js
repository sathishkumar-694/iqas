import User from '../users/user.model.js';
import asyncHandler from 'express-async-handler';

// GET /api/ranking/leaderboard
const getLeaderboard = asyncHandler(async (req, res) => {
    const leaderboard = await User.find({ points: { $gt: 0 } })
        .select('username avatar points rank efficiency_score bugs_resolved_count')
        .sort({ points: -1 })
        .limit(20);

    res.json(leaderboard);
});

// GET /api/ranking/stats/:userId
const getUserQualityStats = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId)
        .select('points rank efficiency_score bugs_resolved_count bugs_reported_count bugs_reopened_count');

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Calculate dynamic rank name
    const rankNames = { 1: 'Bronze', 2: 'Silver', 3: 'Gold', 4: 'Platinum' };
    const stats = {
        ...user.toObject(),
        rankName: rankNames[user.rank] || 'Unranked'
    };

    res.json(stats);
});

export { getLeaderboard, getUserQualityStats };
