import http from "http";
import { evaluate } from "mathjs";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => console.error("MongoDB connection error:", err));

const calculationSchema = new mongoose.Schema({
  expression: String,
  result: Number,
});

const Calculation = mongoose.model("Calculation", calculationSchema);

const PORT = process.env.PORT || 5000;

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  if (req.method === "POST" && req.url === "/calculate") {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", async () => {
      console.log("Raw request body:", body);

      try {
        const { expression } = JSON.parse(body);
        console.log("Parsed expression:", expression);

        if (typeof expression !== "string") {
          throw new Error("Expression must be a string");
        }

        const result = evaluate(expression);
        console.log("Evaluated result:", result);

        const newCalc = new Calculation({ expression, result });
        await newCalc.save();

        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(JSON.stringify({ result }));

      } catch (err) {
        console.error("Error processing calculation:", err.message);

        res.writeHead(400, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(JSON.stringify({ error: "Invalid expression" }));
      }
    });

  } else {
    res.writeHead(404, {
      "Access-Control-Allow-Origin": "*",
    });
    res.end("Not Found");
  }
});

server.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
