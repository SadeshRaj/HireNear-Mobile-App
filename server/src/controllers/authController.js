const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const formatPhone = (phone) => {
    return phone.startsWith('0') ? '94' + phone.substring(1) : phone;
};

// ─── POST /api/auth/register ─────────────────────────────────────────────────
// Sends OTP via SMS for phone verification
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, role, phone, skills, bio, location } = req.body;

        let userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ msg: 'User already exists' });

        const formattedPhone = formatPhone(phone);
        const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

        // DEV BYPASS: If SMS credentials not configured, skip SMS and auto-verify
        if (!process.env.TEXTLK_API_TOKEN || !process.env.TEXTLK_SENDER_ID) {
            console.warn('⚠️  SMS credentials missing — DEV MODE: auto-verifying user');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const newUser = new User({
                name, email, password: hashedPassword, role,
                phone: formattedPhone, skills, bio, location,
                otp: null, isVerified: true, // skip OTP step
            });
            await newUser.save();
            return res.status(201).json({ msg: 'Registered (dev mode — SMS skipped)', phone: formattedPhone });
        }

        try {
            const smsResponse = await axios.post('https://app.text.lk/api/v3/sms/send',
                {
                    recipient: formattedPhone,
                    sender_id: process.env.TEXTLK_SENDER_ID,
                    type: 'plain',
                    message: `Your HireNear verification code is: ${generatedOtp}. Do not share this code.`
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.TEXTLK_API_TOKEN}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });

            if (smsResponse.data.status === 'success' || smsResponse.data.status === true) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                const newUser = new User({
                    name,
                    email,
                    password: hashedPassword,
                    role,
                    phone: formattedPhone,
                    skills,
                    bio,
                    location,
                    otp: generatedOtp,
                    isVerified: false,
                    expireAt: new Date()
                });

                await newUser.save();
                return res.status(201).json({ msg: 'OTP sent', phone: formattedPhone });
            } else {
                return res.status(400).json({ error: 'Failed to send SMS' });
            }

        } catch (smsErr) {
            console.error("SMS Gateway Error:", smsErr.response ? smsErr.response.data : smsErr.message);
            return res.status(500).json({ error: 'SMS Service Unreachable.' });
        }

    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── POST /api/auth/verify-otp ───────────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        const formattedPhone = formatPhone(phone);
        const stringOtp = String(otp);

        const user = await User.findOne({ phone: formattedPhone, otp: stringOtp });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.otp = null;
        user.expireAt = undefined; // Cancel the TTL delete timer

        await user.save();

        res.status(200).json({ msg: 'Account verified successfully' });
    } catch (err) {
        console.error("Verification Error:", err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── POST /api/auth/login ────────────────────────────────────────────────────
// Returns JWT token for use with protected routes
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find user
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

        // 2. Check if verified
        if (!user.isVerified) {
            return res.status(401).json({
                msg: 'Account not verified. Please complete OTP verification.',
                unverified: true
            });
        }

        // 3. Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        // 4. Sign JWT
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