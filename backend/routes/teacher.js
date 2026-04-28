const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');

// Resend request after rejection
router.patch('/resend-request/:teacherId', teacherController.resendRequest);

module.exports = router;
