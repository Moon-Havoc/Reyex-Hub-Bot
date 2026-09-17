import mongoose from 'mongoose';
export interface IStats extends mongoose.Document {
    totalUsers: number;
    verifiedUsers: number;
    activeUsers: number;
    totalScriptsUsed: number;
    lastUpdated: Date;
}
declare const _default: mongoose.Model<IStats, {}, {}, {}, mongoose.Document<unknown, {}, IStats, {}, mongoose.DefaultSchemaOptions> & IStats & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IStats>;
export default _default;
//# sourceMappingURL=Stats.d.ts.map