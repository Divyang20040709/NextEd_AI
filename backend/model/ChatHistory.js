const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: String, enum: ['user', 'bot'], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const chatHistorySchema = new mongoose.Schema({
    userId: { type: String, required: false, index: true },  // isolate per user
    title: { type: String, default: 'New Conversation' },
    messages: [messageSchema],
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatHistory', chatHistorySchema);

