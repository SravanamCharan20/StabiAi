import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();
const PORT = process.env.PORT || 9000;
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World');
});


mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.log(err);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});