require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
const port = 5000;

app.use(cors());

const pool = new Pool({
  user: "local", 
  host: "localhost",
  database: "database",
  password: "local",
  port: 5432,
});

app.get("/api/data", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM space_object");
    res.json(result.rows);
    //console.log(result);
  } catch (error) {
    console.error("Error fetching data from database:");
    console.error(error);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
