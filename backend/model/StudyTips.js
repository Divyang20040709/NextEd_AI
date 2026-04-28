const mongoose = require('mongoose');

const studyTipsSchema = new mongoose.Schema({
    userId: { type: String, required: false, index: true },  // isolate per user
    tips: { type: String, required: true },
    title: { type: String, default: 'Study Session Tips' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudyTips', studyTipsSchema);

