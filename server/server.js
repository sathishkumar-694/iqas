import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './utils/db.js';

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"]
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

app.use(express.json());
app.use(cors());

import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import bugRoutes from './routes/bugRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

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
