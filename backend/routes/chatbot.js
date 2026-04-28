const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const ChatHistory = require('../model/ChatHistory');
const Knowledge = require('../model/Knowledge');
const StudyTips = require('../model/StudyTips');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Diagnostic log for Groq API Key
console.log('--- GROQ SETUP ---');
if (process.env.GROQ_API_KEY) {
    console.log(`Key found: ${process.env.GROQ_API_KEY.substring(0, 10)}...`);
} else {
    console.warn('CRITICAL: No GROQ_API_KEY found in process.env!');
}
console.log('--------------------');

// Get chat sessions for a specific user
router.get('/history', async (req, res) => {
    try {
        const { userId } = req.query;
        const filter = userId ? { userId } : {};
        const histories = await ChatHistory.find(filter).sort({ updatedAt: -1 });
        res.json(histories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new chat session for a specific user
router.post('/history', async (req, res) => {
    try {
        const { userId } = req.body;
        const newChat = new ChatHistory({ messages: [], userId: userId || null });
        await newChat.save();
        res.status(201).json(newChat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete chat session
router.delete('/history/:id', async (req, res) => {
    try {
        await ChatHistory.findByIdAndDelete(req.params.id);
        res.json({ message: 'Chat deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Chat with AI
router.post('/chatbot', async (req, res) => {
    const { chatId, message, userId } = req.body;
    console.log(`[CHAT] Incoming message for chat ${chatId} user ${userId}: "${message}"`);

    try {
        let history = await ChatHistory.findById(chatId);

        // Auto-create chat if it doesn't exist
        if (!history && chatId) {
            history = new ChatHistory({ _id: chatId, messages: [], userId: userId || null });
        } else if (!history) {
            history = new ChatHistory({ messages: [], userId: userId || null });
        }

        // Get Knowledge context
        const knowledgeItems = await Knowledge.find();
        let systemPrompt = "You are NextEd AI, a highly specialized study assistant. Your primary source of truth is the Knowledge Base provided below. If a user asks a question related to their uploads, you MUST answer using the information from those documents. If the information is not in the context, state that you don't know based on the provided data, but try to be helpful based on general knowledge if appropriate.";
        let contextText = "";
        if (knowledgeItems.length > 0) {
            contextText = "\n\nCRITICAL KNOWLEDGE BASE CONTEXT (Use this to answer): \n";
            knowledgeItems.forEach(item => {
                contextText += `--- ${item.title} ---\nDetails: ${item.details || ""}\nContent: ${item.content || ""}\n\n`;
            });
        }

        const groqMessages = [
            { role: 'system', content: systemPrompt + contextText },
            ...history.messages.map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text
            })),
            { role: 'user', content: message }
        ];

        const modelToUse = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
        console.log(`[CHAT] Sending to Groq with model: ${modelToUse}`);
        const chatCompletion = await groq.chat.completions.create({
            messages: groqMessages,
            model: modelToUse
        });

        const responseText = chatCompletion.choices[0]?.message?.content || "";
        console.log(`[CHAT] Groq response received (${responseText.substring(0, 30)}...)`);

        // Update History
        history.messages.push({ sender: 'user', text: message });
        history.messages.push({ sender: 'bot', text: responseText });
        history.updatedAt = Date.now();

        if (history.title === 'New Conversation' || history.title.length < 5) {
            history.title = message.substring(0, 35) + (message.length > 35 ? '...' : '');
        }

        await history.save();
        res.json({ text: responseText, history });
    } catch (err) {
        console.error("Groq API Error:", err);
        res.status(err.status || 500).json({ error: "AI Error: " + err.message });
    }
});

// GET all study tips history for a user
router.get('/study-tips', async (req, res) => {
    try {
        const { userId } = req.query;
        const filter = userId ? { userId } : {};
        const tips = await StudyTips.find(filter).sort({ createdAt: -1 });
        res.json(tips);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST generate new study tips based on THIS user's chat history
router.post('/study-tips', async (req, res) => {
    try {
        const { userId } = req.body;
        const filter = userId ? { userId } : {};
        const allChats = await ChatHistory.find(filter).sort({ updatedAt: -1 });
        let contextText = "";

        if (allChats.length > 0) {
            // Take the most recent chats to avoid context window issues, but the user asked for "jitni bhi chats ki hogi"
            // We'll limit to last 20 messages or similar if it's too long, but let's try to be thorough.
            contextText = "STUDENT CHAT HISTORY:\n";
            allChats.slice(0, 5).forEach(chat => { // Limit to last 5 conversations for stability
                chat.messages.forEach(msg => {
                    contextText += `${msg.sender}: ${msg.text}\n`;
                });
            });
        }

        // Get Knowledge context
        const knowledgeItems = await Knowledge.find();
        let knowledgeContext = "";
        if (knowledgeItems.length > 0) {
            knowledgeContext = "\n\nCRITICAL KNOWLEDGE BASE CONTEXT (Uploaded materials): \n";
            knowledgeItems.forEach(item => {
                knowledgeContext += `--- ${item.title} ---\nDetails: ${item.details || ""}\nContent: ${item.content || ""}\n\n`;
            });
        }

        const systemPrompt = "You are a professional, polite, and encouraging study advisor named NextEd Counselor. Your goal is to provide personalized, highly effective study tips.\n\nCRITICAL FORMATTING RULES:\n1. ONLY use standard Markdown. NEVER use HTML tags like <br>, <div>, or <span>.\n2. Do NOT use Tables if you need to put multiple lines of text or bullet points inside a single cell. Markdown tables do NOT support line breaks. If you need complex formatting, use recursive bullet points or headers instead.\n3. If you do use a Table, keep cells short and single-line.\n4. Use double newlines for paragraph breaks.\n5. Be very supportive and professional.";

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Analyze my chat history and uploaded materials to give me specific tips to improve my learning.\n\nContext:\n${contextText}\n\nKnowledge:\n${knowledgeContext}` }
            ],
            model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
        });

        let responseText = chatCompletion.choices[0]?.message?.content || "I couldn't generate tips at the moment.";

        // Comprehensive sanitization: Remove all variants of <br> tags and common HTML
        responseText = responseText.replace(/<br\s*\/?>/gi, ' ');
        responseText = responseText.replace(/&lt;br\s*\/?&gt;/gi, ' ');
        responseText = responseText.replace(/\\n/g, '\n'); // Fix escaped newlines if any
        responseText = responseText.replace(/<b>(.*?)<\/b>/gi, '**$1**');
        responseText = responseText.replace(/<i>(.*?)<\/i>/gi, '*$1*');
        responseText = responseText.replace(/&lt;b&gt;(.*?)&lt;\/b&gt;/gi, '**$1**');
        responseText = responseText.replace(/&lt;i&gt;(.*?)&lt;\/i&gt;/gi, '*$1*');

        const newTip = new StudyTips({
            tips: responseText,
            userId: userId || null,
            title: `Tips for session ${new Date().toLocaleDateString()}`
        });
        await newTip.save();

        res.json(newTip);
    } catch (err) {
        console.error("Study Tips Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE study tip
router.delete('/study-tips/:id', async (req, res) => {
    try {
        await StudyTips.findByIdAndDelete(req.params.id);
        res.json({ message: 'Study tip deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
