import mongoose from 'mongoose';

export interface IPollOption {
  text: string;
  voters: string[];
}

export interface IPoll extends mongoose.Document {
  question: string;
  options: IPollOption[];
  createdBy: string;
  isActive: boolean;
  endTime?: Date;
  messageId?: string;
  channelId?: string;
  createdAt: Date;
  endedAt?: Date;
}

const PollOptionSchema = new mongoose.Schema<IPollOption>({
  text: { type: String, required: true },
  voters: [{ type: String }],
}, { _id: false });

const PollSchema = new mongoose.Schema<IPoll>({
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

function arrayLimits(val: any[]) {
  return val.length >= 2 && val.length <= 5;
}

PollSchema.index({ isActive: 1 });
PollSchema.index({ createdBy: 1 });

export default mongoose.model<IPoll>('Poll', PollSchema);
