const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: String, enum: ['user', 'ai'], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const aiTutorChatHistorySchema = new mongoose.Schema({
    userId: { type: String, required: false, index: true },  // isolate per user
    title: { type: String, default: 'AI Tutor Session' },
    messages: [messageSchema],
    date: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AiTutorChatHistory', aiTutorChatHistorySchema);

