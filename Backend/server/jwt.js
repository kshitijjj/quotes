// jwt.js
const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;


// Middleware to authenticate JWT
const jwtAuthMiddleware = (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).json({ error: "No authorization header" });
    }

    const token = authorization.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        // Verify the JWT token
        const decoded = jwt.verify(token,JWT_SECRET)
        req.user = decoded; // Store the decoded user info in the request
        next();
    } catch (err) {
        console.error("Error during token verification:", err);
        res.status(401).json({ error: "Invalid token" });
    }
};

// Function to generate a JWT
const generateToken = (userData) => {
    return jwt.sign(userData,JWT_SECRET); // Token expires in 1 hour
};

module.exports = {
    jwtAuthMiddleware,
    generateToken,
};
