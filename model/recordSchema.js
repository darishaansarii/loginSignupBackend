import mongoose from "mongoose";

const recordSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const RecordModel = mongoose.model("Record", recordSchema);
