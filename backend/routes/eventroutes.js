const express = require("express");
const Event = require("../models/events");
const redis = require("redis");

const url = `redis://redis-14479.c301.ap-south-1-1.ec2.cloud.redislabs.com:14479`;
const redis_client = redis.createClient({
  url,
  password: "liwaro9995@wowcg.com",
});

redis_client.connect().catch((err) =>
  console.log("Error connecting to Redis:", err)
);

const router = express.Router();

// Middleware to handle Redis errors globally
redis_client.on("error", (err) => console.log("Redis Client Error:", err));

// Helper function to handle Redis caching
const cacheMiddleware = (keyPrefix) => async (req, res, next) => {
  const key = `${keyPrefix}:${req.params.id || "all"}`;
  try {
    const cachedData = await redis_client.get(key);
    if (cachedData) {
      console.log("Serving from Redis Cache");
      return res.json(JSON.parse(cachedData));
    }
    next();
  } catch (err) {
    console.error("Redis error:", err);
    next();
  }
};

// Route to get all events
router.get("/", cacheMiddleware("events"), async (req, res) => {
  try {
    const events = await Event.find();
    // Cache the data in Redis
    redis_client.setEx("events:all", 3600, JSON.stringify(events));
    res.json(events);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route to get a specific event
router.get("/:id", cacheMiddleware("event"), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    // Cache the event in Redis
    redis_client.setEx(`event:${req.params.id}`, 3600, JSON.stringify(event));
    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route to create a new event
router.post("/", async (req, res) => {
  const event = new Event(req.body);
  try {
    const newEvent = await event.save();
    // Invalidate cache for all events
    redis_client.del("events:all");
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route to update an existing event
router.patch("/:id", async (req, res) => {
  try {
    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }
    // Update Redis cache
    const key = `event:${req.params.id}`;
    redis_client.setEx(key, 3600, JSON.stringify(updatedEvent));
    redis_client.del("events:all"); // Invalidate all events cache
    res.json(updatedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route to delete an event
router.delete("/:id", async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    // Remove from Redis cache
    const key = `event:${req.params.id}`;
    redis_client.del(key);
    redis_client.del("events:all"); // Invalidate all events cache
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
