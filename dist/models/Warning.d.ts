import mongoose from 'mongoose';
export interface IWarning extends mongoose.Document {
    discordId: string;
    moderatorId: string;
    reason: string;
    createdAt: Date;
    active: boolean;
}
declare const _default: mongoose.Model<IWarning, {}, {}, {}, mongoose.Document<unknown, {}, IWarning, {}, mongoose.DefaultSchemaOptions> & IWarning & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IWarning>;
export default _default;
//# sourceMappingURL=Warning.d.ts.map