// const mongoose = require('mongoose');
// const mongo_url=process.env.MONGO_CONN;

// mongoose.connect(mongo_url)
//    .then(() => {
//         console.log('MongoDB Connected...');
//     }).catch((err) => {
//         console.log('MongoDB Connection Error: ', err);
//     })


const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_CONN)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log("MongoDB Connection Error:", err));