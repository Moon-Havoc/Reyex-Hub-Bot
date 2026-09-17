import mongoose from 'mongoose';
const GiveawaySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    prize: {
        type: String,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    participants: [{
            type: String
        }],
    winner: {
        type: String
    },
    endedAt: {
        type: Date
    },
    messageId: {
        type: String
    }
});
// Index for faster queries
GiveawaySchema.index({ isActive: 1 });
GiveawaySchema.index({ endTime: 1 });
GiveawaySchema.index({ createdBy: 1 });
export default mongoose.model('Giveaway', GiveawaySchema);
//# sourceMappingURL=Giveaway.js.map