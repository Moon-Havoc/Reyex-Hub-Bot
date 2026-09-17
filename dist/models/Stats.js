import mongoose from 'mongoose';
const StatsSchema = new mongoose.Schema({
    totalUsers: {
        type: Number,
        default: 0
    },
    verifiedUsers: {
        type: Number,
        default: 0
    },
    activeUsers: {
        type: Number,
        default: 0
    },
    totalScriptsUsed: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});
// Only one stats document should exist
StatsSchema.index({ lastUpdated: 1 });
export default mongoose.model('Stats', StatsSchema);
//# sourceMappingURL=Stats.js.map