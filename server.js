import express from 'express';
import connectDB from './config/db.js';
import auth from './api/auth.js';
import users from './api/users.js';

connectDB();

const app = express();

//Init Middleware - it allows routes to access the data in req.body
app.use(express.json({ extended: false }));

app.get('/', (req, res) => res.send('API is runnning'));

// Define routes
app.use('/api/users', users);
app.use('/api/auth', auth);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
