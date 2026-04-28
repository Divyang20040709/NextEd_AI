const express = require('express');
const router = express.Router();
const PostSubmission = require('../model/PostSubmission');
const Post = require('../model/Post');

// Submit to Post (Student)
router.post('/submit', async (req, res) => {
  console.log('📤 Post Submission Request');
  
  try {
    const { postId, studentId, studentName, message, files } = req.body;
    
    if (!postId || !studentId || !studentName) {
      return res.status(400).json({ message: 'Required fields: postId, studentId, studentName' });
    }

    // Check if post exists and allows uploads
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (!post.allowStudentUpload) {
      return res.status(403).json({ message: 'Submissions are not allowed for this post' });
    }

    // Create or update submission
    let submission = await PostSubmission.findOne({ postId, studentId });
    
    if (submission) {
      submission.message = message || '';
      submission.files = files || [];
      submission.submittedAt = Date.now();
      await submission.save();
      console.log('✅ Submission updated for:', studentName);
    } else {
      submission = new PostSubmission({
        postId,
        studentId,
        studentName,
        message: message || '',
        files: files || []
      });
      await submission.save();
      console.log('✅ New submission created for:', studentName);
    }

    res.status(201).json({ 
      message: 'Submitted successfully',
      submission
    });
  } catch (err) {
    console.error('❌ Submission error:', err);
    res.status(500).json({ message: 'Server error processing submission' });
  }
});

// Get Submissions for a Post (Teacher)
router.get('/post/:postId', async (req, res) => {
  console.log('📋 Get Post Submissions Request');
  
  try {
    const { postId } = req.params;
    
    const submissions = await PostSubmission.find({ postId })
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${submissions.length} submissions for post ${postId}`);

    res.json({ submissions });
  } catch (err) {
    console.error('❌ Get submissions error:', err);
    res.status(500).json({ message: 'Server error fetching submissions' });
  }
});

// Get a single student's submission for a post (Student edit flow)
router.get('/post/:postId/student/:studentId', async (req, res) => {
  console.log('🔍 Get Specific Student Submission Request');
  
  try {
    const { postId, studentId } = req.params;
    
    const submission = await PostSubmission.findOne({ postId, studentId });

    if (!submission) {
      return res.status(404).json({ message: 'No submission found' });
    }

    console.log(`✅ Found submission for student ${studentId} on post ${postId}`);
    res.json({ submission });
  } catch (err) {
    console.error('❌ Get specific submission error:', err);
    res.status(500).json({ message: 'Server error fetching submission' });
  }
});

module.exports = router;
