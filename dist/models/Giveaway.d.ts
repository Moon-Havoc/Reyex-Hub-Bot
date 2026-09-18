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
    channelId?: string;
}
declare const _default: mongoose.Model<IGiveaway, {}, {}, {}, mongoose.Document<unknown, {}, IGiveaway, {}, mongoose.DefaultSchemaOptions> & IGiveaway & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IGiveaway>;
export default _default;
//# sourceMappingURL=Giveaway.d.ts.map