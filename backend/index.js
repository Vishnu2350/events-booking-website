// Import Required Modules
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const fsr = require("file-stream-rotator");
const helmet = require("helmet");
require("dotenv").config(); // Load environment variables

// Initialize Express App
const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: "http://localhost:3000" })); // Allow requests from React frontend
app.use(helmet()); // Add security headers
app.use(bodyParser.json()); // Parse JSON requests
app.use(bodyParser.urlencoded({ extended: false })); // Parse URL-encoded requests
app.use(cookieParser()); // Parse cookies

// Logging
let logsInfo = fsr.getStream({
  filename: "text.log",
  frequency: "1h",
  verbose: true,
});
app.use(morgan("combined", { stream: logsInfo }));

// MongoDB Connection
const uri = process.env.ATLAS_URI; // Your MongoDB Atlas URI in .env
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const connection = mongoose.connection;
connection.once("open", () => {
  console.log("MongoDB connection successful!");
});

// Routes
app.get("/", (req, res) => {
  res.send("Hello, World! The server is running.");
});

// Example Route to Show CORS is Working
app.get("/events", (req, res) => {
  res.json({ message: "CORS enabled for /events route!" });
});

// Routers (Import and Attach)
const FeedRouter = require("./routes/feedroutes");
app.use("/feed", FeedRouter);

const FoodRouter = require("./routes/foodroutes");
app.use("/food", FoodRouter);

const UserRouter = require("./routes/userroutes");
app.use("/users", UserRouter);

const OrganizerRouter = require("./routes/organizerroutes");
app.use("/organizers", OrganizerRouter);

const AdminRouter = require("./routes/adminroutes");
app.use("/admins", AdminRouter);

const BookingRouter = require("./routes/bookingroutes");
app.use("/booking", BookingRouter);

const VenueRouter = require("./routes/venueroutes");
app.use("/venue", VenueRouter);

const EventRouter = require("./routes/eventroutes");
app.use("/events", EventRouter);

// Start the Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Export for Testing
module.exports = app;
  