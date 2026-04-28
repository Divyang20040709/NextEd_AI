const jwt = require('jsonwebtoken');
const Admin = require('../model/Admin');

// Middleware to verify admin authentication via JWT Bearer token
const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.'
      });
    }

    // Ensure the token belongs to an admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Verify admin still exists in DB
    const admin = await Admin.findOne({ email: decoded.email.toLowerCase() });
    if (!admin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin account not found.'
      });
    }

    req.admin = admin;
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Admin verification error:', err);
    res.status(500).json({
      success: false,
      message: 'Error verifying admin credentials'
    });
  }
};

// Generic JWT middleware for student/teacher routes
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.'
      });
    }
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(500).json({
      success: false,
      message: 'Error verifying token'
    });
  }
};

module.exports = { verifyAdmin, verifyToken };
