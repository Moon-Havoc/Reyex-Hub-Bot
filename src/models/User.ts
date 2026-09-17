import mongoose from 'mongoose';

export interface IUser extends mongoose.Document {
  discordId: string;
  robloxId?: string;
  robloxUsername?: string;
  username: string;
  discriminator: string;
  avatar?: string;
  isVerified: boolean;
  verifiedAt?: Date;
  pendingVerificationCode?: string;
  pendingRobloxUsername?: string;
  pendingVerificationExpiry?: Date;
  lastSeen: Date;
  joinedAt: Date;
  roles: string[];
  statistics: {
    scriptsUsed: number;
    lastScriptUsed?: Date;
  };
}

const UserSchema = new mongoose.Schema<IUser>({
  discordId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  robloxId: { 
    type: String, 
    sparse: true 
  },
  robloxUsername: { 
    type: String,
    sparse: true
  },
  username: { 
    type: String, 
    required: true 
  },
  discriminator: { 
    type: String, 
    required: true 
  },
  avatar: { 
    type: String 
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  verifiedAt: { 
    type: Date 
  },
  pendingVerificationCode: { 
    type: String 
  },
  pendingRobloxUsername: { 
    type: String 
  },
  pendingVerificationExpiry: { 
    type: Date 
  },
  lastSeen: { 
    type: Date, 
    default: Date.now 
  },
  joinedAt: { 
    type: Date, 
    default: Date.now 
  },
  roles: [{ 
    type: String 
  }],
  statistics: {
    scriptsUsed: { 
      type: Number, 
      default: 0 
    },
    lastScriptUsed: { 
      type: Date 
    }
  }
});

// Index for faster queries
UserSchema.index({ discordId: 1 });
UserSchema.index({ robloxId: 1 });
UserSchema.index({ isVerified: 1 });

export default mongoose.model<IUser>('User', UserSchema);
