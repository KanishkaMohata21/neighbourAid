const JWT = require('jsonwebtoken');
const userModel = require('../models/user.js');

const authenticateUser = async (req, res, next) => {
    try {
        const token = req.headers.authorization;
        console.log(req.headers.authorization)
        if (!token) {
            return res.status(401).json({ msg: "Authorization header missing" });
        }
        const decodedToken = JWT.verify(token, process.env.JWT_SECRET_KEY);
        if (!decodedToken) {
            return res.status(401).json({ msg: "Invalid token" });
        }
        console.log(decodedToken);
        req.user = decodedToken;
        console.log(req.user);
        next();
    } catch (error) {
        console.log(error);
        return res.status(401).json({ msg: "Internal Server Error" });
    }
};

const isAdmin = async (req, res, next) => {
    try {
        const user = await userModel.findById(req.user.id);
        console.log("User from database:", user);
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        if (user.role === "admin") {
            next();
        } else {
            return res.status(401).json({ msg: "User is not admin" });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Internal Server Error" });
    }
};

module.exports = { authenticateUser, isAdmin };
