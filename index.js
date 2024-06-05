const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./config/db');
const routes = require('./routes');

const app = express();

// Connect to database
connectDB();

// Use CORS
app.use(cors());
app.use(bodyParser.json({}));
app.use(bodyParser.urlencoded({extended: true}));
app.use('/api', routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
