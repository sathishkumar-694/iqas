import cron from 'node-cron';
import Bug from '../../features/bugs/bug.model.js';
import Notification from '../../features/notifications/notification.model.js';

const startCronJobs = (io) => {
    // Run every day at 9:00 AM — check for overdue bugs
    cron.schedule('0 9 * * *', async () => {
        console.log('[CRON] Checking for overdue bugs...');

        try {
            const overdueBugs = await Bug.find({
                due_date: { $lt: new Date() },
                status: { $nin: ['Closed', 'Resolved'] },
                assigned_to: { $ne: null },
            }).populate('assigned_to', 'username');

            for (const bug of overdueBugs) {
                const message = `⏰ Bug "${bug.title}" is overdue! Due date was ${bug.due_date.toISOString().split('T')[0]}`;

                // Notify the assigned developer
                const existing = await Notification.findOne({
                    user_id: bug.assigned_to._id,
                    message: { $regex: `Bug "${bug.title}" is overdue` },
                    created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Don't spam — once per day
                });

                if (!existing) {
                    await Notification.create({
                        user_id: bug.assigned_to._id,
                        message,
                    });

                    if (io) {
                        io.to(bug.assigned_to._id.toString()).emit('new_notification', message);
                    }
                }
            }

            console.log(`[CRON] Found ${overdueBugs.length} overdue bugs`);
        } catch (error) {
            console.error('[CRON] Error checking overdue bugs:', error.message);
        }
    });

    // Run every day at 8:00 AM — warn about bugs due today
    cron.schedule('0 8 * * *', async () => {
        console.log('[CRON] Checking for bugs due today...');

        try {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            const dueTodayBugs = await Bug.find({
                due_date: { $gte: startOfDay, $lte: endOfDay },
                status: { $nin: ['Closed', 'Resolved'] },
                assigned_to: { $ne: null },
            });

            for (const bug of dueTodayBugs) {
                const message = `⚠️ Bug "${bug.title}" is due today!`;
                await Notification.create({
                    user_id: bug.assigned_to,
                    message,
                });

                if (io) {
                    io.to(bug.assigned_to.toString()).emit('new_notification', message);
                }
            }

            console.log(`[CRON] Found ${dueTodayBugs.length} bugs due today`);
        } catch (error) {
            console.error('[CRON] Error checking due-today bugs:', error.message);
        }
    });

    console.log('[CRON] Scheduled: overdue check (9 AM), due-today check (8 AM)');
};

export default startCronJobs;
