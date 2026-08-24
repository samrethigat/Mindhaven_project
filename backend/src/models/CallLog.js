import mongoose from "mongoose";

const callLogSchema = new mongoose.Schema(
  {
    caller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date, default: null },
    duration: { type: Number, default: 0 }, // seconds
    status: {
      type: String,
      enum: ["initiated", "connected", "completed", "missed"],
      default: "initiated",
    },
  },
  { timestamps: true }
);

export default mongoose.model("CallLog", callLogSchema);
