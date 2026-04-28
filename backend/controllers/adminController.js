const TeacherSignup = require("../model/TeacherSignup");
const StudentSignup = require("../model/StudentSignup");
const Classroom = require("../model/Classroom");

// Get all pending teacher requests
const getTeacherRequests = async (req, res) => {
  try {
    const pendingTeachers = await TeacherSignup.find({ status: "pending" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: pendingTeachers,
    });
  } catch (err) {
    console.error("Error fetching teacher requests:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching teacher requests",
    });
  }
};

// Approve teacher
const approveTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { approvalMessage } = req.body;

    const teacher = await TeacherSignup.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    if (teacher.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Teacher is already approved",
      });
    }

    teacher.status = "approved";
    teacher.approvalMessage =
      approvalMessage || "Your account has been approved. You can now login.";
    teacher.isBanned = false;
    teacher.rejectedReason = null;

    await teacher.save();

    // Emit socket event
    const io = req.app.get("socketio");
    if (io) {
      io.to(teacher.email).emit("teacher-status-updated", {
        status: "approved",
        message: "✅ Your account has been approved! You can now login.",
      });
    }

    res.json({
      success: true,
      message: "Teacher approved successfully",
      data: {
        email: teacher.email,
        name: teacher.name,
        status: teacher.status,
      },
    });
  } catch (err) {
    console.error("Error approving teacher:", err);
    res.status(500).json({
      success: false,
      message: "Error approving teacher",
    });
  }
};

// Reject teacher
const rejectTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { rejectedReason } = req.body;

    if (!rejectedReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const teacher = await TeacherSignup.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // Emit socket event before deleting
    const io = req.app.get("socketio");
    if (io) {
      io.to(teacher.email).emit("teacher-status-updated", {
        status: "rejected",
        message: `❌ Your application was rejected. Reason: ${rejectedReason}. You can submit a new application.`,
        reason: rejectedReason,
      });
    }

    // Delete the teacher record to allow immediate re-signup
    await TeacherSignup.findByIdAndDelete(teacherId);

    res.json({
      success: true,
      message: "Teacher rejected and record cleared for re-signup",
      data: {
        email: teacher.email,
        name: teacher.name,
        status: "rejected",
      },
    });
  } catch (err) {
    console.error("Error rejecting teacher:", err);
    res.status(500).json({
      success: false,
      message: "Error rejecting teacher",
    });
  }
};

// Get teacher statistics
const getTeacherStats = async (req, res) => {
  try {
    const totalTeachers = await TeacherSignup.countDocuments();
    const activeTeachers = await TeacherSignup.countDocuments({
      status: "approved",
    });
    const pendingRequests = await TeacherSignup.countDocuments({
      status: "pending",
    });
    const bannedTeachers = await TeacherSignup.countDocuments({
      isBanned: true,
    });

    res.json({
      success: true,
      data: {
        totalTeachers,
        activeTeachers,
        pendingRequests,
        bannedTeachers,
      },
    });
  } catch (err) {
    console.error("Error fetching teacher stats:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching teacher statistics",
    });
  }
};

// Get all approved teachers
const getAllTeachers = async (req, res) => {
  try {
    const teachers = await TeacherSignup.find({
      status: "approved",
      isBanned: false,
    })
      .select("name surname email department subject createdAt status")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: teachers,
    });
  } catch (err) {
    console.error("Error fetching teachers:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching teachers",
    });
  }
};

// Get all banned teachers
const getBannedTeachers = async (req, res) => {
  try {
    const bannedTeachers = await TeacherSignup.find({ isBanned: true })
      .select("name surname email department subject createdAt status")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bannedTeachers,
    });
  } catch (err) {
    console.error("Error fetching banned teachers:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching banned teachers",
    });
  }
};

// Get full teacher profile with classrooms
const getTeacherProfile = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacher = await TeacherSignup.findById(teacherId).select("-password");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // Get all classrooms for this teacher
    const classrooms = await Classroom.find({ teacherEmail: teacher.email })
      .select("subject classGrade division code students createdAt")
      .sort({ createdAt: -1 });

    // Format classroom data with counts
    const classroomDetails = classrooms.map((classroom) => ({
      _id: classroom._id,
      classroomName: `${classroom.subject} - ${classroom.classGrade} ${classroom.division}`,
      classroomCode: classroom.code,
      studentsCount: classroom.students ? classroom.students.length : 0,
      materialsCount: 0, // TODO: Add materials count if materials model exists
      createdAt: classroom.createdAt,
    }));

    res.json({
      success: true,
      data: {
        teacher: teacher.toObject(),
        classrooms: classroomDetails,
        totalClassrooms: classrooms.length,
        totalStudents: classrooms.reduce(
          (sum, c) => sum + (c.students ? c.students.length : 0),
          0,
        ),
      },
    });
  } catch (err) {
    console.error("Error fetching teacher profile:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching teacher profile",
    });
  }
};

// Delete teacher (cascade delete classrooms)
const deleteTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacher = await TeacherSignup.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // Delete all classrooms associated with this teacher
    await Classroom.deleteMany({ teacherEmail: teacher.email });

    // Emit socket event before deleting
    const io = req.app.get("socketio");
    if (io) {
      io.to(teacher.email).emit("teacher-status-updated", {
        status: "deleted",
        message: "Your account has been deleted by an admin.",
      });
    }

    // Delete the teacher
    await TeacherSignup.findByIdAndDelete(teacherId);

    res.json({
      success: true,
      message: "Teacher and all associated classrooms deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting teacher:", err);
    res.status(500).json({
      success: false,
      message: "Error deleting teacher",
    });
  }
};

// Ban teacher
const banTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacher = await TeacherSignup.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    if (teacher.isBanned) {
      return res.status(400).json({
        success: false,
        message: "Teacher is already banned",
      });
    }

    teacher.status = "banned";
    teacher.isBanned = true;

    await teacher.save();

    // Emit socket event
    const io = req.app.get("socketio");
    if (io) {
      io.to(teacher.email).emit("teacher-status-updated", {
        status: "banned",
        message: "🚫 Your account has been banned by an admin.",
      });
    }

    res.json({
      success: true,
      message: "Teacher banned successfully",
      data: {
        email: teacher.email,
        name: teacher.name,
        status: teacher.status,
      },
    });
  } catch (err) {
    console.error("Error banning teacher:", err);
    res.status(500).json({
      success: false,
      message: "Error banning teacher",
    });
  }
};

// Unban teacher
const unbanTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacher = await TeacherSignup.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    if (!teacher.isBanned) {
      return res.status(400).json({
        success: false,
        message: "Teacher is not banned",
      });
    }

    teacher.status = "approved";
    teacher.isBanned = false;

    await teacher.save();

    // Emit socket event
    const io = req.app.get("socketio");
    if (io) {
      io.to(teacher.email).emit("teacher-status-updated", {
        status: "approved",
        message: "✅ Your account has been unbanned by an admin.",
      });
    }

    res.json({
      success: true,
      message: "Teacher unbanned successfully",
      data: {
        email: teacher.email,
        name: teacher.name,
        status: teacher.status,
      },
    });
  } catch (err) {
    console.error("Error unbanning teacher:", err);
    res.status(500).json({
      success: false,
      message: "Error unbanning teacher",
    });
  }
};

// ==================== STUDENT MANAGEMENT ====================

// Get all students
const getAllStudents = async (req, res) => {
  try {
    const students = await StudentSignup.find({ status: "approved" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: students,
    });
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching students",
    });
  }
};

// Get student statistics
const getStudentStats = async (req, res) => {
  try {
    const totalStudents = await StudentSignup.countDocuments();
    const activeStudents = await StudentSignup.countDocuments({
      status: "approved",
      isBanned: false,
    });
    const pendingRequests = await StudentSignup.countDocuments({
      status: "pending",
    });
    const bannedStudents = await StudentSignup.countDocuments({
      isBanned: true,
    });

    res.json({
      success: true,
      data: {
        totalStudents,
        activeStudents,
        pendingRequests,
        bannedStudents,
      },
    });
  } catch (err) {
    console.error("Error fetching student stats:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching student statistics",
    });
  }
};

// Get all student requests (pending students)
const getStudentRequests = async (req, res) => {
  try {
    const pendingStudents = await StudentSignup.find({ status: "pending" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: pendingStudents,
    });
  } catch (err) {
    console.error("Error fetching student requests:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching student requests",
    });
  }
};

// Get all banned students
const getBannedStudents = async (req, res) => {
  try {
    const bannedStudents = await StudentSignup.find({
      $or: [{ isBanned: true }, { status: "banned" }],
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bannedStudents,
    });
  } catch (err) {
    console.error("Error fetching banned students:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching banned students",
    });
  }
};

// Ban student
const banStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await StudentSignup.findById(studentId);

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    student.status = "banned";
    student.isBanned = true;
    await student.save();

    // Emit socket event
    const io = req.app.get("socketio");
    if (io) {
      io.to(student.email).emit("student-status-updated", {
        status: "banned",
        message: "🚫 Your account has been banned by an admin.",
      });
    }

    res.json({ success: true, message: "Student banned successfully" });
  } catch (err) {
    console.error("Error banning student:", err);
    res.status(500).json({ success: false, message: "Error banning student" });
  }
};

// Unban student
const unbanStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await StudentSignup.findById(studentId);

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    student.status = "approved";
    student.isBanned = false;
    await student.save();

    // Emit socket event
    const io = req.app.get("socketio");
    if (io) {
      io.to(student.email).emit("student-status-updated", {
        status: "approved",
        message: "✅ Your account has been restored by an admin.",
      });
    }

    res.json({ success: true, message: "Student unbanned successfully" });
  } catch (err) {
    console.error("Error unbanning student:", err);
    res
      .status(500)
      .json({ success: false, message: "Error unbanning student" });
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await StudentSignup.findById(studentId);

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    // Emit socket event before deleting
    const io = req.app.get("socketio");
    if (io) {
      io.to(student.email).emit("student-status-updated", {
        status: "deleted",
        message: "Your account has been deleted by an admin.",
      });
    }

    await StudentSignup.findByIdAndDelete(studentId);

    res.json({ success: true, message: "Student deleted successfully" });
  } catch (err) {
    console.error("Error deleting student:", err);
    res.status(500).json({ success: false, message: "Error deleting student" });
  }
};

// Get full student profile with enrolled classrooms
const getStudentProfile = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await StudentSignup.findById(studentId).select("-password");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Get all classrooms this student is enrolled in
    // Note: Classroom schema has `students` array containing student objects/ids
    // We need to find classrooms where students.email matches student.email
    const classrooms = await Classroom.find({
      "students.email": student.email,
    }).select(
      "subject classGrade division code teacherName teacherEmail createdAt",
    );

    res.json({
      success: true,
      data: {
        student: student.toObject(),
        joinedClassrooms: classrooms,
        totalJoinedClassrooms: classrooms.length,
      },
    });
  } catch (err) {
    console.error("Error fetching student profile:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching student profile",
    });
  }
};

// Approve student
const approveStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { approvalMessage } = req.body;

    const student = await StudentSignup.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (student.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Student is already approved",
      });
    }

    student.status = "approved";
    student.approvedAt = new Date();
    student.isBanned = false;
    student.rejectedReason = null;

    await student.save();

    // Emit socket event
    const io = req.app.get("socketio");
    if (io) {
      io.to(student.email).emit("student-status-updated", {
        status: "approved",
        message: "✅ Your account has been approved! You can now login.",
      });
    }

    res.json({
      success: true,
      message: "Student approved successfully",
      data: {
        email: student.email,
        name: student.name,
        status: student.status,
      },
    });
  } catch (err) {
    console.error("Error approving student:", err);
    res.status(500).json({
      success: false,
      message: "Error approving student",
    });
  }
};

// Reject student
const rejectStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { rejectedReason } = req.body;

    if (!rejectedReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const student = await StudentSignup.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Emit socket event before deleting
    const io = req.app.get("socketio");
    if (io) {
      io.to(student.email).emit("student-status-updated", {
        status: "rejected",
        message: `❌ Your account was rejected. ${rejectedReason}`,
      });
    }

    await StudentSignup.findByIdAndDelete(studentId);

    res.json({
      success: true,
      message: "Student rejected and deleted successfully",
    });
  } catch (err) {
    console.error("Error rejecting student:", err);
    res.status(500).json({
      success: false,
      message: "Error rejecting student",
    });
  }
};

// Delete classroom (Admin)
const deleteClassroomAsAdmin = async (req, res) => {
  try {
    const { classroomId } = req.params;

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res
        .status(404)
        .json({ success: false, message: "Classroom not found" });
    }

    // Delete all posts associated with this classroom
    const Post = require("../model/Post");
    await Post.deleteMany({ classroomId });

    // Delete the classroom
    await Classroom.findByIdAndDelete(classroomId);

    // Real-time update: Notify all students in this classroom
    const io = req.app.get("socketio");
    if (io) {
      classroom.students.forEach((student) => {
        io.to(student.email).emit("classroom-deleted", {
          classroomId,
          message: `Classroom "${classroom.subject}" has been deleted by an admin.`,
        });
      });
    }

    res.json({
      success: true,
      message: "Classroom and all associated posts deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting classroom as admin:", err);
    res
      .status(500)
      .json({ success: false, message: "Error deleting classroom" });
  }
};

// Get classroom posts (Admin)
const getClassroomPostsAsAdmin = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const Post = require("../model/Post");

    const posts = await Post.find({ classroomId, isDeleted: false }).sort({
      createdAt: -1,
    });

    res.json({ success: true, data: posts });
  } catch (err) {
    console.error("Error fetching classroom posts as admin:", err);
    res.status(500).json({ success: false, message: "Error fetching posts" });
  }
};

// Create post as admin
const createPostAsAdmin = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { title, description, videoLink, files, teacherName } = req.body;
    const Post = require("../model/Post");

    const newPost = new Post({
      classroomId,
      title,
      description,
      videoLink: videoLink || "",
      files: files || [],
      teacherName: teacherName || "Admin",
      allowStudentUpload: req.body.allowStudentUpload || false,
    });

    await newPost.save();

    // Real-time update: Notify students
    const io = req.app.get("socketio");
    if (io) {
      const classroom = await Classroom.findById(classroomId);
      if (classroom) {
        classroom.students.forEach((student) => {
          io.to(student.email).emit("post-added", {
            classroomId,
            post: newPost,
          });
        });

        // Notify teacher
        if (classroom.teacherEmail) {
          io.to(classroom.teacherEmail).emit("post-added", {
            classroomId,
            post: newPost,
          });
        }
      }
    }

    res.status(201).json({ success: true, data: newPost });
  } catch (err) {
    console.error("Error creating post as admin:", err);
    res.status(500).json({ success: false, message: "Error creating post" });
  }
};

// Update post as admin
const updatePostAsAdmin = async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, description, videoLink, files } = req.body;
    const Post = require("../model/Post");

    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    post.title = title || post.title;
    post.description = description || post.description;
    post.videoLink = videoLink !== undefined ? videoLink : post.videoLink;
    post.files = files || post.files;
    post.allowStudentUpload =
      req.body.allowStudentUpload !== undefined
        ? req.body.allowStudentUpload
        : post.allowStudentUpload;
    post.isEdited = true;

    await post.save();

    // Real-time update: Notify students
    const io = req.app.get("socketio");
    if (io) {
      const classroom = await Classroom.findById(post.classroomId);
      if (classroom) {
        classroom.students.forEach((student) => {
          io.to(student.email).emit("post-updated", {
            postId,
            post,
          });
        });

        // Notify teacher
        if (classroom.teacherEmail) {
          io.to(classroom.teacherEmail).emit("post-updated", {
            postId,
            post,
          });
        }
      }
    }

    res.json({ success: true, data: post });
  } catch (err) {
    console.error("Error updating post as admin:", err);
    res.status(500).json({ success: false, message: "Error updating post" });
  }
};

// Delete post as admin (Soft delete to match existing pattern, or hard delete)
const deletePostAsAdmin = async (req, res) => {
  try {
    const { postId } = req.params;
    const { adminEmail } = req.body;
    const Post = require("../model/Post");

    // For "Full access", we'll do a hard delete as requested "admin can delete specific messages"
    // But since the model has isDeleted, let's stick to the pattern but mark it deleted by admin
    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    post.isDeleted = true;
    post.deletedBy = "Admin"; // Mask the admin's email for privacy
    await post.save();

    // Real-time update: Notify students
    const io = req.app.get("socketio");
    if (io) {
      const classroom = await Classroom.findById(post.classroomId);
      if (classroom) {
        classroom.students.forEach((student) => {
          io.to(student.email).emit("post-deleted", {
            postId,
            deletedBy: post.deletedBy,
          });
        });

        // Notify teacher
        if (classroom.teacherEmail) {
          io.to(classroom.teacherEmail).emit("post-deleted", {
            postId,
            deletedBy: post.deletedBy,
          });
        }
      }
    }

    res.json({ success: true, message: "Post deleted successfully by admin" });
  } catch (err) {
    console.error("Error deleting post as admin:", err);
    res.status(500).json({ success: false, message: "Error deleting post" });
  }
};

// Get students enrolled in a classroom (Admin)
const getClassroomStudents = async (req, res) => {
  try {
    const { classroomId } = req.params;

    const classroom = await Classroom.findById(classroomId).select(
      "students subject classGrade division code teacherName",
    );
    if (!classroom) {
      return res
        .status(404)
        .json({ success: false, message: "Classroom not found" });
    }

    // Enrich each student with full details from StudentSignup
    const enrichedStudents = await Promise.all(
      classroom.students.map(async (s) => {
        const fullStudent = await StudentSignup.findOne({
          email: s.email,
        }).select(
          "name email mobileNumber studentId programName courseDepartment year institutionName status isBanned",
        );
        if (fullStudent) {
          return {
            name: fullStudent.name || s.name,
            email: fullStudent.email || s.email,
            mobileNumber: fullStudent.mobileNumber || "N/A",
            studentId: fullStudent.studentId || "N/A",
            programName: fullStudent.programName || "N/A",
            courseDepartment: fullStudent.courseDepartment || "N/A",
            year: fullStudent.year || "N/A",
            institutionName: fullStudent.institutionName || "N/A",
            status: fullStudent.isBanned
              ? "banned"
              : fullStudent.status || "approved",
            joinedAt: s.joinedAt,
          };
        }
        // Fallback: just use what the classroom has
        return {
          name: s.name,
          email: s.email,
          mobileNumber: "N/A",
          studentId: "N/A",
          programName: "N/A",
          courseDepartment: "N/A",
          year: "N/A",
          institutionName: "N/A",
          status: "approved",
          joinedAt: s.joinedAt,
        };
      }),
    );

    res.json({
      success: true,
      data: {
        classroom: {
          _id: classroom._id,
          subject: classroom.subject,
          classGrade: classroom.classGrade,
          division: classroom.division,
          code: classroom.code,
          teacherName: classroom.teacherName,
        },
        students: enrichedStudents,
        totalStudents: enrichedStudents.length,
      },
    });
  } catch (err) {
    console.error("Error fetching classroom students:", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching classroom students" });
  }
};

// Get all global posts for Super Admin
const getAllGlobalPosts = async (req, res) => {
  try {
    const Post = require("../model/Post");
    // We populate classroomId to get details like subject, classGrade, division
    const posts = await Post.find({ isDeleted: { $ne: true } })
      .populate({
        path: "classroomId",
        select: "subject classGrade division code teacherName",
        model: "Classroom",
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: posts });
  } catch (err) {
    console.error("Error fetching global posts:", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching global posts" });
  }
};

// Get all global exams for Super Admin
const getAllGlobalExams = async (req, res) => {
  try {
    const Exam = require("../model/Exam");
    // We populate classroomId
    const exams = await Exam.find()
      .populate({
        path: "classroomId",
        select: "subject classGrade division code teacherName",
        model: "Classroom",
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: exams });
  } catch (err) {
    console.error("Error fetching global exams:", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching global exams" });
  }
};

module.exports = {
  getTeacherRequests,
  approveTeacher,
  rejectTeacher,
  getTeacherStats,
  getAllTeachers,
  getBannedTeachers,
  getTeacherProfile,
  deleteTeacher,
  banTeacher,
  unbanTeacher,

  // Student
  getAllStudents,
  getStudentStats,
  getStudentRequests,
  approveStudent,
  rejectStudent,
  getBannedStudents,
  getStudentProfile,
  banStudent,
  unbanStudent,
  deleteStudent,

  // Classroom & Post Management (Admin)
  deleteClassroomAsAdmin,
  getClassroomPostsAsAdmin,
  getClassroomStudents,
  createPostAsAdmin,
  updatePostAsAdmin,
  deletePostAsAdmin,
  getAllGlobalPosts,
  getAllGlobalExams,
};
