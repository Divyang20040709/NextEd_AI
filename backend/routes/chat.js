const express = require('express');
const router = express.Router();
const axios = require('axios');

// Groq API Configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

router.post('/', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  try {
    const systemMessage = {
      role: 'system',
      content: `You are a helpful educational AI tutor for the EduVoice AI platform. 
      Your goal is to help students with their academic doubts.
      
      INSTRUCTIONS:
      1. Provide a clear, concise, and accurate explanation for the student's doubt.
      2. After your explanation, provide 2-3 practical "Study Tips" related to the topic or general effective learning strategies.
      3. Use a friendly and encouraging tone.
      4. Format your response clearly using markdown.`
    };

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 1024
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const botReply = response.data.choices[0].message.content;
    res.json({ reply: botReply });

  } catch (error) {
    console.error('❌ Groq API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch response from AI',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

module.exports = router;
