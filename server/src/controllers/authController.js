const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.registerUser = async (req, res) => {
    try {
        // 1. Destructure 'location' from the body
        const { name, email, password, role, phone, skills, bio, location } = req.body;

        // 2. Check if user exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        // 3. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Create user including the GeoJSON location object
        user = new User({
            name,
            email,
            password: hashedPassword,
            role,
            phone,
            skills,
            bio,
            location // This matches the { type: "Point", coordinates: [...] } from the app
        });

        await user.save();
        res.status(201).json({ msg: 'User registered successfully' });

    } catch (err) {
        // Log the actual error to your VS Code terminal so you can debug!
        console.error("Registration Error:", err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

// ─── POST /api/auth/login ────────────────────────────────────────────────────
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find user
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

        // 2. Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        // 3. Sign JWT
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                skills: user.skills,
                location: user.location
            }
        });
    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};