const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const AiTutorChatHistory = require('../model/AiTutorChatHistory');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Get tutor sessions for a specific user
router.get('/history', async (req, res) => {
    try {
        const { userId } = req.query;
        const filter = userId ? { userId } : {};
        const histories = await AiTutorChatHistory.find(filter).sort({ updatedAt: -1 });
        res.json(histories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new tutor session for a specific user
router.post('/history', async (req, res) => {
    try {
        const { userId } = req.body;
        const newChat = new AiTutorChatHistory({ messages: [], userId: userId || null });
        await newChat.save();
        res.status(201).json(newChat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete tutor session
router.delete('/history/:id', async (req, res) => {
    try {
        await AiTutorChatHistory.findByIdAndDelete(req.params.id);
        res.json({ message: 'Tutor session deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Chat with AI Tutor
router.post('/chat', async (req, res) => {
    const { chatId, message, language = 'English', userId } = req.body;

    try {
        let history = await AiTutorChatHistory.findById(chatId);
        if (!history) {
            history = new AiTutorChatHistory({ _id: chatId, messages: [], userId: userId || null });
        }

        let languageRule = "";
        if (language === 'Hindi') {
            languageRule = "6. You MUST reply ONLY in Hindi. Do not use English words unless absolutely necessary.";
        } else if (language === 'Gujarati') {
            languageRule = "6. You MUST reply ONLY in Gujarati. Do not use English words unless absolutely necessary.";
        } else {
            languageRule = "6. Reply in English.";
        }

        const systemPrompt = `You are NextEd AI, a professional, supportive, and brilliant Talking AI Tutor. 
        Your goal is to guide students through their doubts with a natural, conversational vibe—like a real-time conversation between two people.
        
        STRICT RULES for "Talking AI" mode:
        1. NEVER use markdown (NO **, NO #, NO lists). Use plain text only.
        2. Keep your turns SHORT (2-3 sentences max). Long monologues are boring in a voice conversation.
        3. Use conversational "fillers" or prompts to keep the student engaged (e.g., "Does that make sense?", "What do you think?").
        4. If a student interrupts you, acknowledge it naturally in your next reply.
        5. Be concise, informative, and high-vibe.
        ${languageRule}`;

        const groqMessages = [
            { role: 'system', content: systemPrompt },
            ...history.messages.map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text
            })),
            { role: 'user', content: message }
        ];

        const chatCompletion = await groq.chat.completions.create({
            messages: groqMessages,
            model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
        });

        const responseText = chatCompletion.choices[0]?.message?.content || "";

        // Update History
        history.messages.push({ sender: 'user', text: message });
        history.messages.push({ sender: 'ai', text: responseText });
        history.updatedAt = Date.now();

        if (history.title === 'AI Tutor Session' && message.length > 5) {
            history.title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
        }

        await history.save();
        res.json({ text: responseText, history });
    } catch (err) {
        console.error("AI Tutor Error:", err);
        res.status(500).json({ error: "Tutor Error: " + err.message });
    }
});

module.exports = router;

