import mongoose from 'mongoose';
const migrationSchema = new mongoose.Schema({
    dbName: {
        type: String,
        required: [true, 'db name not provided'],
    },
    changes: {
        type: [String],
        required: [true, 'changes not provided'],
    },
});
const getModel = (db) => {
    return db.model('Migration', migrationSchema);
};
export default getModel;
