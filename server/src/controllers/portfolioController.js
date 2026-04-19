const PortfolioItem = require('../models/PortfolioItem');

exports.createPortfolioItem = async (req, res) => {
    try {
        const { title, description, address, lat, lng } = req.body;
        const imageUrls = req.files ? req.files.map(file => file.path) : [];

        const newItem = new PortfolioItem({
            workerId: req.user.id,
            title, description,
            images: imageUrls,
            location: { address, lat: Number(lat), lng: Number(lng) }
        });

        await newItem.save();
        res.status(201).json({ msg: 'Portfolio item added successfully', item: newItem });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.getWorkerPortfolio = async (req, res) => {
    try {
        const targetWorkerId = req.params.workerId || req.user.id;
        const items = await PortfolioItem.find({ workerId: targetWorkerId }).sort({ createdAt: -1 });
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.updatePortfolioItem = async (req, res) => {
    try {
        const { title, description, address } = req.body;
        let item = await PortfolioItem.findById(req.params.id);

        if (!item) return res.status(404).json({ msg: 'Item not found' });
        if (item.workerId.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        // If new images were uploaded, add them to the existing array (or replace them based on your preference)
        const newImageUrls = req.files ? req.files.map(file => file.path) : [];
        if (newImageUrls.length > 0) {
            item.images = newImageUrls; // Overwriting images for simplicity in edit
        }

        item.title = title || item.title;
        item.description = description || item.description;
        if (address) item.location.address = address;

        await item.save();
        res.status(200).json({ msg: 'Portfolio item updated', item });
    } catch (error) {
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
        res.status(500).json({ msg: 'Server error' });
    }
};