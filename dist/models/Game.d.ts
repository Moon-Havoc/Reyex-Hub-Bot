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
declare const _default: mongoose.Model<IGame, {}, {}, {}, mongoose.Document<unknown, {}, IGame, {}, mongoose.DefaultSchemaOptions> & IGame & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IGame>;
export default _default;
//# sourceMappingURL=Game.d.ts.map