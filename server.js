require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
const port = 5000;

// Enable CORS for frontend requests
app.use(cors());

const pool = new Pool({
  user: "local", 
  host: "localhost", // use this instead of "database" on Docker Desktop
  database: "database",
  password: "local",
  port: 5432,
});

// API route to fetch data
app.get("/api/data", async (req, res) => {
  try {
    console.log("Fetching data from database");
    const result = await pool.query("SELECT * FROM space_object");
    res.json(result.rows);
    //console.log(result);
  } catch (error) {
    console.error("Error fetching data from database:");
    console.error(error); // full error message & stack trace
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
