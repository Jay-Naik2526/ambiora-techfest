import mongoose from 'mongoose';
import dotenv from 'dotenv';
import EventRegistration from './backend/models/EventRegistration.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect('mongodb+srv://ytfortrial2_db_user:p4cQx8DsbQzn4Etc@ambiora.cbrpm9o.mongodb.net/?retryWrites=true&w=majority&authSource=admin', { dbName: 'ambiora' });
        console.log("Connected");

        const reg = await EventRegistration.findOne().sort({ createdAt: -1 });
        console.log("Latest Registration:", JSON.stringify(reg, null, 2));

        const count = await EventRegistration.countDocuments();
        console.log("Total Registrations:", count);

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
