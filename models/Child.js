const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
    name: { type: String, required: true },
    birthDate: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female'], required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Child', childSchema);
