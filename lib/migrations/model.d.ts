import mongoose from 'mongoose';
import type { IMigration } from '../../types/index.js';
import type { Connection } from 'mongoose';
declare const getModel: (db: Connection) => mongoose.Model<IMigration>;
export default getModel;
