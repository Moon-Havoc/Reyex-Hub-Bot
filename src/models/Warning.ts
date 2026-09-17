import mongoose from 'mongoose';

export interface IWarning extends mongoose.Document {
  discordId: string;
  moderatorId: string;
  reason: string;
  createdAt: Date;
  active: boolean;
}

const WarningSchema = new mongoose.Schema<IWarning>({
  discordId: { type: String, required: true },
  moderatorId: { type: String, required: true },
  reason: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  active: { type: Boolean, default: true },
});

WarningSchema.index({ discordId: 1 });
WarningSchema.index({ active: 1 });

export default mongoose.model<IWarning>('Warning', WarningSchema);
