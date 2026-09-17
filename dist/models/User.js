import mongoose from 'mongoose';
const UserSchema = new mongoose.Schema({
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
export default mongoose.model('User', UserSchema);
//# sourceMappingURL=User.js.map