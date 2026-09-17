import mongoose from 'mongoose';
const PollOptionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    voters: [{ type: String }],
}, { _id: false });
const PollSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: { type: [PollOptionSchema], required: true, validate: [arrayLimits, 'Poll must have 2-5 options'] },
    createdBy: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    endTime: { type: Date },
    messageId: { type: String },
    channelId: { type: String },
    createdAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
});
function arrayLimits(val) {
    return val.length >= 2 && val.length <= 5;
}
PollSchema.index({ isActive: 1 });
PollSchema.index({ createdBy: 1 });
export default mongoose.model('Poll', PollSchema);
//# sourceMappingURL=Poll.js.map