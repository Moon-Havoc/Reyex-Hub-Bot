import mongoose from 'mongoose';

export interface IGame extends mongoose.Document {
  name: string;
  scriptUrl: string;
  description: string;
  category: string;
  isActive: boolean;
  addedBy: string;
  addedAt: Date;
  updatedAt: Date;
  usageCount: number;
  free: boolean;
  keyRequired: boolean;
  mobileCompatible: boolean;
}

const GameSchema = new mongoose.Schema<IGame>({
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
GameSchema.index({ category: 1 });
GameSchema.index({ isActive: 1 });

export default mongoose.model<IGame>('Game', GameSchema);
