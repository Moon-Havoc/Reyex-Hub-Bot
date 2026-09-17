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
declare const _default: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, mongoose.DefaultSchemaOptions> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IUser>;
export default _default;
//# sourceMappingURL=User.d.ts.map