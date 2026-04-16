const User = require('../models/User');
const bcrypt = require('bcryptjs');
const axios = require('axios');

// Helper function to ensure consistent phone formatting
const formatPhone = (phone) => {
    return phone.startsWith('0') ? '94' + phone.substring(1) : phone;
};

exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, role, phone, skills, bio, location } = req.body;

        // 1. Check if user exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        // 2. Format phone IMMEDIATELY (e.g., convert 070... to 9470...)
        const formattedPhone = formatPhone(phone);

        // 3. Generate a 4-digit OTP
        const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

        // 4. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 5. Create user using the FORMATTED phone number
        user = new User({
            name,
            email,
            password: hashedPassword,
            role,
            phone: formattedPhone, // Saved as 94...
            skills,
            bio,
            location,
            otp: generatedOtp,
            isVerified: false
        });

        await user.save();

        // 6. Send SMS via text.lk
        try {
            const smsResponse = await axios.get('https://app.text.lk/api/v3/sms/send', {
                params: {
                    api_token: '4304|ajHZ0BfcOjdCeJcwsqMXzT1ULJOf3JQ75uuxL8Gd1d90bd2a', //
                    recipient: formattedPhone,
                    sender_id: 'HireNear',
                    message: `Your HireNear verification code is: ${generatedOtp}. Do not share this code.`
                }
            });
            // LOG THIS: This will tell you if the SMS actually went through or if your balance is 0
            console.log("Text.lk API Response:", smsResponse.data);
            console.log(`OTP ${generatedOtp} sent to ${formattedPhone}`);
        } catch (smsErr) {
            console.error("SMS Gateway Error:", smsErr.response ? smsErr.response.data : smsErr.message);
        }

        res.status(201).json({
            msg: 'Registration successful. OTP sent.',
            phone: formattedPhone // Send formatted phone back to frontend
        });

    } catch (err) {
        console.error("Registration Error:", err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

// 7. UPDATED: Verification Logic
exports.verifyOTP = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        // Format the incoming phone number so it matches the DB (94...)
        const formattedPhone = formatPhone(phone);

        // Find user by FORMATTED phone and OTP
        const user = await User.findOne({ phone: formattedPhone, otp: otp });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid or expired OTP' });
        }

        // Update user status
        user.isVerified = true;
        user.otp = null;
        await user.save();

        res.status(200).json({ msg: 'Account verified successfully' });

    } catch (err) {
        console.error("Verification Error:", err.message);
        res.status(500).json({ error: 'Server error' });
    }
};