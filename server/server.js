import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import connectDB from './shared/utils/db.js';
import startCronJobs from './shared/utils/cronJobs.js';
import { notFound, errorHandler } from './shared/middleware/error.middleware.js';
import morgan from 'morgan';
import { stream } from './shared/utils/logger.js';

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

app.set('io', io);

io.on('connection', (socket) => {
    socket.on('join_room', (userId) => {
        socket.join(userId);
    });

    socket.on('disconnect', () => {
    });
});

// Security & parsing middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream }));
// Use a secret for signing cookies, ideally from .env
app.use(cookieParser(process.env.COOKIE_SECRET || 'iqas_super_secret_cookie_key_2026'));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Feature routes
import authRoutes from './features/auth/auth.routes.js';
import projectRoutes from './features/projects/project.routes.js';
import bugRoutes from './features/bugs/bug.routes.js';
import commentRoutes from './features/comments/comment.routes.js';
import userRoutes from './features/users/user.routes.js';
import notificationRoutes from './features/notifications/notification.routes.js';
import attachmentRoutes from './features/attachments/attachment.routes.js';
import reportRoutes from './features/reports/report.routes.js';

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/bugs', bugRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running', status: 'OK' });
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Start cron jobs
startCronJobs(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server & WebSockets running on port ${PORT}`);
});
