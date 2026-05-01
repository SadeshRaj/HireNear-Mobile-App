const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
            { folder: 'profile_images' },
            (error, result) => {
                if (result) resolve(result.secure_url);
                else reject(error);
            }
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
};

const formatPhone = (phone) => {
    return phone.startsWith('0') ? '94' + phone.substring(1) : phone;
};

// ─── POST /api/auth/register ─────────────────────────────────────────────────
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, role, phone, skills, bio, location } = req.body;

        let userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ msg: 'User already exists' });

        const formattedPhone = formatPhone(phone);
        const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

        if (!process.env.TEXTLK_API_TOKEN || !process.env.TEXTLK_SENDER_ID) {
            console.warn('⚠️  SMS credentials missing — DEV MODE: auto-verifying user');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const newUser = new User({
                name, email, password: hashedPassword, role,
                phone: formattedPhone, skills, bio, location,
                otp: null, isVerified: true,
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
                    name, email, password: hashedPassword, role,
                    phone: formattedPhone, skills, bio,
                    location: location || { type: 'Point', coordinates: [0, 0] },
                    otp: generatedOtp, isVerified: false, expireAt: new Date()
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

        if (!user) return res.status(400).json({ msg: 'Invalid or expired OTP' });

        user.isVerified = true;
        user.otp = null;
        user.expireAt = undefined;

        await user.save();

        const payload = { user: { id: user.id } };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.status(200).json({ msg: 'Account verified successfully', token, user });
        });
    } catch (err) {
        console.error("Verification Error:", err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── POST /api/auth/login ────────────────────────────────────────────────────
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

        if (!user.isVerified) {
            return res.status(401).json({ msg: 'Account not verified. Please complete OTP verification.', unverified: true });
        }

        if (user.accountStatus === 'Suspended') {
            return res.status(403).json({ msg: 'Your account has been temporarily suspended by the administrator.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                skills: user.skills,
                location: user.location,
                profileImage: user.profileImage,
                bio: user.bio,
                status: user.status
            }
        });
    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

// ─── PUT /api/auth/change-password ───────────────────────────────────────────
exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) return res.status(404).json({ msg: 'User not found' });

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Incorrect current password' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({ msg: 'Password updated successfully' });
    } catch (err) {
        console.error('Change Password Error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── PUT /api/auth/profile ───────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
    try {
        const { bio, status, name } = req.body;
        // The file info is in req.file if uploaded
        const user = await User.findById(req.user._id || req.user.id);

        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (bio !== undefined) user.bio = bio;
        if (status !== undefined) user.status = status;
        if (name !== undefined) user.name = name;

        // If a new image was passed via multipart/form-data
        if (req.file) {
            const imageUrl = await uploadToCloudinary(req.file.buffer);
            user.profileImage = imageUrl;
        }

        await user.save();

        res.status(200).json({
            msg: 'Profile updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                bio: user.bio,
                status: user.status,
                profileImage: user.profileImage
            }
        });
    } catch (err) {
        console.error('Update Profile Error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getWorkerById = async (req, res) => {
    try {
        const worker = await User.findById(req.params.workerId).select('name bio profileImage status');
        if (!worker) return res.status(404).json({ msg: 'Worker not found' });
        res.json(worker);
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
};