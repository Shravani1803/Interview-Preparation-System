const express = require("express");
const app = express();

const bodyParser = require("body-parser");
const cors = require("cors");

require("dotenv").config();
require("./Models/db");

const PORT = process.env.PORT || 8080;

// Routes
const AuthRouter = require("./Routes/AuthRouter");
const AptitudeRouter = require("./Routes/AptitudeRouter");
const CodingRouter = require("./Routes/CodingRouter");
const PerformanceRouter = require("./Routes/PerformanceRouter");
const AdminRouter = require("./Routes/AdminRouter");

// Test route
app.get("/ping", (req, res) => {
    res.send("PONG");
});

// Middlewares
app.use(bodyParser.json());
app.use(cors());

// Routes
app.use("/auth", AuthRouter);
app.use("/aptitude", AptitudeRouter);
app.use("/coding", CodingRouter);
app.use("/api", PerformanceRouter);        // /api/stats  and  /api/analytics
app.use("/admin", AdminRouter);

// Server start
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
