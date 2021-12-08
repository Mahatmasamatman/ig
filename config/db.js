import mongoose from 'mongoose';
import config from 'config';

//this variable is intentionally omitted from the repository, as it contains mongoDB credentials
const db = config.get('mongoURI');

const connectDB = async () => {
    try {
        await mongoose.connect(db);
        console.log('MongoDB connected.');
    } catch(err){
        console.error(err.message);
        process.exit(1);
    }
}

export default connectDB;