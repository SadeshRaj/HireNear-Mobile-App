const User = require('../models/User');
const bcrypt = require('bcryptjs');
const axios = require('axios');

const formatPhone = (phone) => {
    return phone.startsWith('0') ? '94' + phone.substring(1) : phone;
};

exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, role, phone, skills, bio, location } = req.body;

        let userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ msg: 'User already exists' });

        const formattedPhone = formatPhone(phone);
        const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

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
                    expireAt: new Date() // Start the 5-minute timer
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

exports.verifyOTP = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        const formattedPhone = formatPhone(phone);
        const stringOtp = String(otp);

        const user = await User.findOne({ phone: formattedPhone, otp: stringOtp });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid or expired OTP' });
        }

        // VERIFICATION SUCCESSFUL
        user.isVerified = true;
        user.otp = null;

        // IMPORTANT: Unset expireAt so the user is NOT deleted after 5 minutes
        user.expireAt = undefined;

        await user.save();

        res.status(200).json({ msg: 'Account verified successfully' });
    } catch (err) {
        console.error("Verification Error:", err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // 2. Check if account is verified
        if (!user.isVerified) {
            return res.status(401).json({
                msg: 'Account not verified. Please register again or verify your phone.',
                unverified: true
            });
        }

        // 3. Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // 4. Success - Send user data back (excluding the password)
        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.otp;

        res.status(200).json({
            msg: 'Login successful',
            user: userResponse
        });

    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).json({ error: 'Server error' });
    }
};