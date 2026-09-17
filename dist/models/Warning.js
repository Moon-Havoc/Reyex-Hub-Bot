import mongoose from 'mongoose';
const WarningSchema = new mongoose.Schema({
    discordId: { type: String, required: true },
    moderatorId: { type: String, required: true },
    reason: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
});
WarningSchema.index({ discordId: 1 });
WarningSchema.index({ active: 1 });
export default mongoose.model('Warning', WarningSchema);
//# sourceMappingURL=Warning.js.map