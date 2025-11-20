import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import cors from "cors";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { userModel } from "./model/userSchema.js";

const app = express();
app.use(cors());
app.use(express.json());

// ---------- CONNECT DB ----------
const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected!");
  } catch (error) {
    console.log("DB Error:", error);
  }
};
connectDb();

// ---------- JWT MIDDLEWARE ----------
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer token
  if (!token) return res.status(401).json({ status: false, message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ status: false, message: "Invalid token" });
  }
};

// ---------- SIGNUP ----------
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ status: false, message: "All fields required" });

    const exists = await userModel.findOne({ email });
    if (exists) return res.json({ status: false, message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await userModel.create({ name, email, password: hashed });

    res.json({ status: true, message: "Signup successful", user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: false, message: "Server error" });
  }
});

// ---------- LOGIN ----------
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ status: false, message: "All fields required" });

    const user = await userModel.findOne({ email });
    if (!user) return res.json({ status: false, message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ status: false, message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ status: true, message: "Login successful", token, user: { name: user.name, email: user.email } });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: false, message: "Server error" });
  }
});

// ---------- PROTECTED PROFILE ----------
app.get("/api/profile", authenticate, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select("-password");
    if (!user) return res.json({ status: false, message: "User not found" });
    res.json({ status: true, user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: false, message: "Server error" });
  }
});

// ---------- SERVER ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
