const PortfolioItem = require('../models/PortfolioItem');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
            { folder: 'portfolio_images' },
            (error, result) => {
                if (result) resolve(result.secure_url);
                else reject(error);
            }
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
};

exports.createPortfolioItem = async (req, res) => {
    try {
        const { title, description, address, lat, lng } = req.body;

        if (!title || !description) {
            return res.status(400).json({ msg: 'Title and description are required' });
        }
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ msg: 'At least one image is required' });
        }

        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            imageUrls = await Promise.all(req.files.map(f => uploadToCloudinary(f.buffer)));
        }

        let locationObj = undefined;
        if (address || lat || lng) {
            locationObj = {};
            if (address) locationObj.address = address;
            if (lat && !isNaN(lat)) locationObj.lat = Number(lat);
            if (lng && !isNaN(lng)) locationObj.lng = Number(lng);
        }

        const newItem = new PortfolioItem({
            workerId: req.user.id,
            title,
            description,
            images: imageUrls,
            location: locationObj
        });

        await newItem.save();
        res.status(201).json({ msg: 'Portfolio item added successfully', item: newItem });
    } catch (error) {
        console.error('createPortfolioItem error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.getWorkerPortfolio = async (req, res) => {
    try {
        const targetWorkerId = req.params.workerId || req.user.id;
        const items = await PortfolioItem.find({ workerId: targetWorkerId }).sort({ createdAt: -1 });
        res.status(200).json(items);
    } catch (error) {
        console.error('getWorkerPortfolio error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.updatePortfolioItem = async (req, res) => {
    try {
        const { title, description, address } = req.body;
        let item = await PortfolioItem.findById(req.params.id);

        if (!item) return res.status(404).json({ msg: 'Item not found' });
        if (item.workerId.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        let existingImages = [];
        if (req.body.existingImages) {
            existingImages = Array.isArray(req.body.existingImages) ? req.body.existingImages : [req.body.existingImages];
        }

        let newImageUrls = [];
        if (req.files && req.files.length > 0) {
            newImageUrls = await Promise.all(req.files.map(f => uploadToCloudinary(f.buffer)));
        }

        // Always update images to the combination of retained existing images and new ones
        const finalImages = [...existingImages, ...newImageUrls];
        if (finalImages.length === 0) {
            return res.status(400).json({ msg: 'At least one image is required' });
        }
        item.images = finalImages;

        item.title = title || item.title;
        item.description = description || item.description;
        if (address) item.location.address = address;

        await item.save();
        res.status(200).json({ msg: 'Portfolio item updated', item });
    } catch (error) {
        console.error('updatePortfolioItem error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.deletePortfolioItem = async (req, res) => {
    try {
        const item = await PortfolioItem.findById(req.params.id);
        if (!item) return res.status(404).json({ msg: 'Item not found' });
        if (item.workerId.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        await item.deleteOne();
        res.status(200).json({ msg: 'Portfolio item removed' });
    } catch (error) {
        console.error('deletePortfolioItem error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
};