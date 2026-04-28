const express = require('express');
const router = express.Router();
const Post = require('../model/Post');
const Classroom = require('../model/Classroom');

// ==================== POST ROUTES ====================

// Create Post (Teacher)
router.post('/create', async (req, res) => {
  console.log('📮 Create Post Request');
  console.log('Request body:', { ...req.body, files: req.body.files?.length || 0 });
  
  try {
    const { classroomId, title, description, videoLink, files, teacherName, allowStudentUpload } = req.body;
    
    // Validation
    if (!classroomId || !title || !description || !teacherName) {
      return res.status(400).json({ message: 'Required fields: classroomId, title, description, teacherName' });
    }

    // Create post
    const newPost = new Post({
      classroomId,
      title,
      description,
      videoLink: videoLink || '',
      files: files || [],
      teacherName,
      isEdited: false,
      isDeleted: false,
      allowStudentUpload: allowStudentUpload || false
    });

    await newPost.save();
    console.log('✅ Post created:', newPost._id);

    // Emit socket event to students in the classroom
    const io = req.app.get('socketio');
    if (io) {
      const classroom = await Classroom.findById(classroomId);
      if (classroom) {
        classroom.students.forEach(student => {
          io.to(student.email).emit('post-added', {
            classroomId,
            post: newPost
          });
        });
      }
    }

    res.status(201).json({ 
      message: 'Post created successfully',
      post: newPost
    });
  } catch (err) {
    console.error('❌ Create post error:', err);
    res.status(500).json({ message: 'Server error creating post' });
  }
});

// Get All Posts for a Classroom
router.get('/classroom/:classroomId', async (req, res) => {
  console.log('📋 Get Classroom Posts Request');
  
  try {
    const { classroomId } = req.params;
    
    // Find all posts for this classroom, sorted by newest first
    const posts = await Post.find({ classroomId })
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${posts.length} posts for classroom ${classroomId}`);

    res.json({ posts });
  } catch (err) {
    console.error('❌ Get posts error:', err);
    res.status(500).json({ message: 'Server error fetching posts' });
  }
});

// Update Post (Teacher)
router.put('/:id', async (req, res) => {
  console.log('✏️ Update Post Request');
  
  try {
    const { id } = req.params;
    const { title, description, videoLink, files, allowStudentUpload } = req.body;
    
    // Find post
    const post = await Post.findById(id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Update fields
    if (title) post.title = title;
    if (description) post.description = description;
    if (videoLink !== undefined) post.videoLink = videoLink;
    if (files !== undefined) post.files = files;
    if (allowStudentUpload !== undefined) post.allowStudentUpload = allowStudentUpload;
    
    post.isEdited = true;

    await post.save();
    console.log('✅ Post updated:', id);

    const io = req.app.get('socketio');
    if (io) {
      const classroom = await Classroom.findById(post.classroomId);
      if (classroom) {
        classroom.students.forEach(student => {
          io.to(student.email).emit('post-updated', {
            postId: id,
            post
          });
        });
      }
    }

    res.json({ 
      message: 'Post updated successfully',
      post
    });
  } catch (err) {
    console.error('❌ Update post error:', err);
    res.status(500).json({ message: 'Server error updating post' });
  }
});

// Soft Delete Post (Teacher)
router.delete('/:id', async (req, res) => {
  console.log('🗑️ Delete Post Request (Soft Delete)');
  
  try {
    const { id } = req.params;
    const { deletedBy } = req.body;
    
    // Find post
    const post = await Post.findById(id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.isDeleted = true;
    post.deletedBy = deletedBy || 'Teacher';

    await post.save();
    console.log('✅ Post soft deleted:', id);

    const io = req.app.get('socketio');
    if (io) {
      const classroom = await Classroom.findById(post.classroomId);
      if (classroom) {
        classroom.students.forEach(student => {
          io.to(student.email).emit('post-deleted', {
            postId: id,
            deletedBy: post.deletedBy
          });
        });
      }
    }

    res.json({ 
      message: 'Post deleted successfully',
      post
    });
  } catch (err) {
    console.error('❌ Delete post error:', err);
    res.status(500).json({ message: 'Server error deleting post' });
  }
});

module.exports = router;
