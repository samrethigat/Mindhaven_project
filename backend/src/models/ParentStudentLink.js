import mongoose from "mongoose";

const parentStudentLinkSchema = new mongoose.Schema(
  {
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    relationship: {
      type: String,
      enum: ["Father", "Mother", "Guardian", "Family Member", "Other"],
      default: "Parent",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "revoked"],
      default: "pending",
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "unverified"],
      default: "pending",
    },
    initiatedBy: {
      type: String,
      enum: ["student", "parent"],
      default: "parent",
    },
    linkingCode: {
      type: String,
      default: "",
    },
    privacySettings: {
      shareAlerts: { type: Boolean, default: true },
      shareAppointments: { type: Boolean, default: true },
      shareGeneralWellbeing: { type: Boolean, default: true },
      shareCounselorInfo: { type: Boolean, default: true },
      sharePrivateChats: { type: Boolean, default: false }, // Strictly false by system policy
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    linkedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

parentStudentLinkSchema.index({ parent: 1, student: 1 }, { unique: true });

export default mongoose.model("ParentStudentLink", parentStudentLinkSchema);
