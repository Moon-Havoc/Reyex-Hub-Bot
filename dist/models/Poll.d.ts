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
declare const _default: mongoose.Model<IPoll, {}, {}, {}, mongoose.Document<unknown, {}, IPoll, {}, mongoose.DefaultSchemaOptions> & IPoll & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IPoll>;
export default _default;
//# sourceMappingURL=Poll.d.ts.map