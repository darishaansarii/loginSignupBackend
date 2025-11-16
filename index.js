import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import cors from "cors";
import "dotenv/config";
import { userModel } from "./model/userSchema.js";

const app = express();
app.use(cors());
app.use(express.json());

// ----------- CONNECT DB -----------
const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.log("DB Connection Error:", error);
  }
};
connectDb();

// ----------- SIGNUP API -----------
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Required fields are missing!",
        status: false,
      });
    }

    const encrypted = await bcrypt.hash(password, 10);

    const userData = await userModel.create({
      name,
      email,
      password: encrypted,
    });

    return res.json({
      message: "User signup successfully",
      status: true,
      userData,
    });

  } catch (error) {
    if (error.code === 11000) { // duplicate email
      return res.status(400).json({ message: "Email already exists", status: false });
    }
    return res.status(500).json({
      message: "Server Error",
      status: false,
      error: error.message,
    });
  }
});

// ----------- LOGIN API -----------
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Required fields are missing",
        status: false,
      });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
        status: false,
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        message: "Invalid credentials",
        status: false,
      });
    }

    return res.json({
      message: "Login successfully",
      status: true,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// get user by email api
app.get("/getUser/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });

    if (!user) {
      return res.json({ status: false, message: "User not found" });
    }

    return res.json({
      status: true,
      name: user.name,
      email: user.email
    });

  } catch (err) {
    res.json({ status: false, message: "Server error" });
  }
});


app.get("/", (req, res) => {
  res.send("API is running!");
});

// Export for Vercel
export default app;
