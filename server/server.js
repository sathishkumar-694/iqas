import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './shared/utils/db.js';

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

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

// Feature routes
import authRoutes from './features/auth/auth.routes.js';
import projectRoutes from './features/projects/project.routes.js';
import bugRoutes from './features/bugs/bug.routes.js';
import commentRoutes from './features/comments/comment.routes.js';
import userRoutes from './features/users/user.routes.js';
import notificationRoutes from './features/notifications/notification.routes.js';

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/bugs', bugRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running', status: 'OK' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server & WebSockets running on port ${PORT}`);
});
