import mongoose from 'mongoose';
const GameSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    scriptUrl: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        default: 'General'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    addedBy: {
        type: String,
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    usageCount: {
        type: Number,
        default: 0
    },
    free: {
        type: Boolean,
        default: true
    },
    keyRequired: {
        type: Boolean,
        default: false
    },
    mobileCompatible: {
        type: Boolean,
        default: false
    }
});
// Index for faster queries
GameSchema.index({ name: 1 });
GameSchema.index({ category: 1 });
GameSchema.index({ isActive: 1 });
export default mongoose.model('Game', GameSchema);
//# sourceMappingURL=Game.js.map