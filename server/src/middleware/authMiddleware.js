// This simulates a logged-in user so you aren't blocked
exports.protect = (req, res, next) => {
    // Using 'Gimes' ID from your database screenshot
    req.user = {
        id: "69e26c68b4c573d3c940d732"
    };
    console.log("Using Mock Auth for User:", req.user.id);
    next();
};