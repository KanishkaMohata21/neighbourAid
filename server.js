const express = require('express');
const cors = require("cors");
const connectDB = require("./database.js");
const authRoutes = require("./routes/authRoutes.js")
const userRoutes = require("./routes/userRoutes.js")
const taskRoutes = require("./routes/taskRoutes.js")

const app = express();

app.use(express.json()); 
app.use(cors({
    origin: 'http://localhost:3000', 
}));

// app.use('/api/auth', authRoutes);
// app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/tasks', taskRoutes);
connectDB();

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});