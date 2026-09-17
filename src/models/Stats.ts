import mongoose from 'mongoose';

export interface IStats extends mongoose.Document {
  totalUsers: number;
  verifiedUsers: number;
  activeUsers: number;
  totalScriptsUsed: number;
  lastUpdated: Date;
}

const StatsSchema = new mongoose.Schema<IStats>({
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

export default mongoose.model<IStats>('Stats', StatsSchema);
