// api/index.js (or api/server.js in Vercel)
import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import cors from "cors";
import "dotenv/config";
import serverless from "serverless-http";

import { userModel } from "./model/userSchema.js";
import { AppointmentModel } from "./model/appointmentSchema.js";
import { RecordModel } from "./model/recordSchema.js";

const app = express();

app.use(cors());
app.use(express.json());

// ----------- CONNECT DB -----------
let isConnected = false; // prevent multiple connections in serverless
const connectDb = async () => {
  if (isConnected) return;
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log("MongoDB connected!");
  } catch (error) {
    console.log("DB Error:", error);
  }
};
connectDb();

// ----------- SIGNUP API -----------
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).send({
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

    return res.send({
      message: "User signup successfully",
      status: true,
      userData,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Server Error",
      status: false,
      error,
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
      return res.json({ message: "Invalid credentials", status: false });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.json({ message: "Invalid credentials", status: false });
    }

    return res.json({ message: "Login successfully", status: true });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
});

// ----------- SCHEDULE APPOINTMENTS API -----------
app.post("/api/appointments", async (req, res) => {
  try {
    const { userEmail, doctorName, appointmentDate, appointmentTime } = req.body;
    if (!userEmail || !doctorName || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        status: false,
        message: "All fields are required",
      });
    }

    const newAppointment = await AppointmentModel.create({
      userEmail,
      doctorName,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: "Confirmed",
    });

    return res.json({
      status: true,
      message: "Appointment booked successfully",
      appointment: newAppointment,
    });
  } catch (err) {
    console.error("Appointment Error:", err);
    return res.status(500).json({ status: false, message: "Server error" });
  }
});

// ----------- UPCOMING APPOINTMENTS -----------
app.get("/api/appointments/upcoming/:userEmail", async (req, res) => {
  try {
    const { userEmail } = req.params;
    if (!userEmail) {
      return res.status(400).json({ status: false, message: "User email is required" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingAppointments = await AppointmentModel.find({
      userEmail,
      appointmentDate: { $gte: today },
    }).sort({ appointmentDate: 1, appointmentTime: 1 });

    return res.json({ status: true, appointments: upcomingAppointments });
  } catch (error) {
    console.error("Upcoming Appointments Error:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
});

// ----------- APPOINTMENT HISTORY -----------
app.get("/api/appointments/history/:userEmail", async (req, res) => {
  try {
    const { userEmail } = req.params;
    if (!userEmail) {
      return res.status(400).json({ status: false, message: "User email is required" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pastAppointments = await AppointmentModel.find({
      userEmail,
      appointmentDate: { $lt: today },
    }).sort({ appointmentDate: -1, appointmentTime: -1 });

    return res.json({ status: true, appointments: pastAppointments });
  } catch (error) {
    console.error("Appointment History Error:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
});

// ----------- GET RECORDS -----------
app.get("/records/:userEmail", async (req, res) => {
  try {
    const { userEmail } = req.params;
    if (!userEmail) return res.status(400).json({ status: false, message: "User email required" });

    const records = await RecordModel.find({ userEmail }).sort({ uploadedAt: -1 });
    return res.json({ status: true, records });
  } catch (error) {
    console.error("Records fetch error:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
});

// ----------- GET PROFILE DATA -----------
app.get("/api/profile/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const user = await userModel.findOne({ email }).select("-password");

    if (!user) return res.json({ status: false, message: "User not found" });

    return res.json({ status: true, user });
  } catch (error) {
    console.log("Profile Fetch Error:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
});

// ----------- UPDATE PROFILE DATA -----------
app.put("/api/profile/update", async (req, res) => {
  try {
    const { email, name, phone } = req.body;
    if (!email) return res.json({ status: false, message: "Email is required" });

    const updatedUser = await userModel.findOneAndUpdate(
      { email },
      { name, phone },
      { new: true }
    ).select("-password");

    return res.json({
      status: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.log("Profile Update Error:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
});

// ----------- LOGOUT API -----------
app.post("/api/logout", async (req, res) => {
  return res.json({ status: true, message: "Logout successful" });
});

app.get("/", (req, res) => {
  res.send({ message: "Server is running...", status: true });
});

export const handler = serverless(app);
