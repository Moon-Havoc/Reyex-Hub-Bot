import mongoose from 'mongoose';

export interface IGiveaway extends mongoose.Document {
  name: string;
  description: string;
  prize: string;
  endTime: Date;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  participants: string[];
  winner?: string;
  endedAt?: Date;
  messageId?: string;
}

const GiveawaySchema = new mongoose.Schema<IGiveaway>({
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

export default mongoose.model<IGiveaway>('Giveaway', GiveawaySchema);
