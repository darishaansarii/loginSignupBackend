import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true, unique: true },
    doctorName: { type: String, required: true },
    appointmentDate: { type: Date, required: true },
    appointmentTime: { type: String, required: true },
    status: { type: String, default: "Pending" },
  },
  { timestamps: true }
);

export const AppointmentModel = mongoose.model(
  "Appointment",
  appointmentSchema
);
