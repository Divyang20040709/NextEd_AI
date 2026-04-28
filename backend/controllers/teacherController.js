const TeacherSignup = require('../model/TeacherSignup');

// Resend Request (Teacher can resend after rejection)
const resendRequest = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacher = await TeacherSignup.findById(teacherId);
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    if (teacher.status === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Your request is already pending'
      });
    }

    if (teacher.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Your account is already approved'
      });
    }

    // Reset to pending
    teacher.status = 'pending';
    teacher.rejectedReason = null;

    await teacher.save();

    res.json({
      success: true,
      message: 'Request resent successfully. Please wait for admin approval.',
      data: {
        email: teacher.email,
        status: teacher.status
      }
    });
  } catch (err) {
    console.error('Error resending request:', err);
    res.status(500).json({
      success: false,
      message: 'Error resending request'
    });
  }
};

module.exports = {
  resendRequest
};
