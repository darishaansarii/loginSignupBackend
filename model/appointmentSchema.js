import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import cors from "cors";
import "dotenv/config";
import { userModel } from "./model/userSchema.js";
import { AppointmentModel } from "./model/appointmentSchema.js";

const app = express();

app.use(cors());
app.use(express.json());

// ----------- CONNECT DB -----------
const connectDb = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    await mongoose.connect(MONGODB_URI);
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
      return res.json({
        message: "Invalid credentials",
        status: false,
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.json({
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
      error,
    });
  }
});

// ----------- SCHEDULE APPOINTMENTS API -----------
app.post("/api/appointments", async (req, res) => {
  try {
    const { userEmail, doctorName, appointmentDate, appointmentTime } = req.body;

    if (!userEmail || !doctorName || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ status: false, message: "All fields are required" });
    }

    const dateObj = new Date(appointmentDate);

    // Set start and end of the day to check slot availability
    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);

    // Check if slot is already booked
    const existingAppointment = await AppointmentModel.findOne({
      doctorName,
      appointmentTime,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existingAppointment) {
      return res.status(409).json({ status: false, message: "Slot unavailable" });
    }

    const newAppointment = await AppointmentModel.create({
      userEmail,
      doctorName,
      appointmentDate: dateObj,
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
    today.setHours(0, 0, 0, 0); // Reset time to start of today

    const upcomingAppointments = await AppointmentModel.find({
      userEmail,
      appointmentDate: { $gte: today },
    }).sort({ appointmentDate: 1, appointmentTime: 1 }); // Ascending by date, then time

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
    today.setHours(0, 0, 0, 0); // Reset time to start of today

    const pastAppointments = await AppointmentModel.find({
      userEmail,
      appointmentDate: { $lt: today },
    }).sort({ appointmentDate: -1, appointmentTime: -1 }); // Descending by date, latest first

    return res.json({ status: true, appointments: pastAppointments });
  } catch (error) {
    console.error("Appointment History Error:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
});

app.get("/", (req, res) => {
  res.send({
    message: "Server is running...",
    status: true,
  });
});

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running locally on http://localhost:${PORT}`);
  });
}

// IMPORTANT FOR VERCEL
export default app;
