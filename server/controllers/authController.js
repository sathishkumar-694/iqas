import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

const registerUser = async (req, res) => {
    const { username, email, password, role } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    if (role === 'Admin') {
        return res.status(403).json({ message: 'Admin registration is not allowed via this endpoint' });
    }

    const user = await User.create({
        username,
        email,
        password,
        role,
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

const adminLogin = async (req, res) => {
    const { email, password } = req.body;

    if (email === 'admin@iqas.com' && password === 'admin123') {
        let adminUser = await User.findOne({ email: 'admin@iqas.com' });
        
        if (!adminUser) {
            adminUser = await User.create({
                username: 'Supreme Admin',
                email: 'admin@iqas.com',
                password: 'admin123',
                role: 'Admin'
            });
        }

        res.json({
            _id: adminUser._id,
            username: adminUser.username,
            email: adminUser.email,
            role: adminUser.role,
            token: generateToken(adminUser._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid Admin credentials' });
    }
};

export { loginUser, registerUser, adminLogin };
