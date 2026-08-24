import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const availabilitySchema = new mongoose.Schema(
  {
    days: { type: [String], default: [] },
    timeSlots: { type: [String], default: [] },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["candidate", "counselor", "parent", "patient", "admin"],
      required: true,
    },

    // --- Common ---
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
    photo: { type: String, default: "" },
    preferredLanguage: { type: String, default: "ta" },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    refreshToken: { type: String, select: false, default: null },
    resetPasswordToken: { type: String, select: false, default: null },
    resetPasswordExpires: { type: Date, select: false, default: null },

    // Geolocation coordinates [longitude, latitude]
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },

    // --- Candidate fields ---
    candidateId: { type: String, default: "" },
    fullName: { type: String, default: "" },
    dob: { type: Date, default: null },
    age: { type: Number, default: null },
    gender: { type: String, default: "" },
    college: { type: String, default: "" },
    department: { type: String, default: "" },
    year: { type: String, default: "" },
    registerNumber: { type: String, default: "" },
    parentName: { type: String, default: "" },
    parentPhone: { type: String, default: "" },
    bestFriendName: { type: String, default: "" },
    bestFriendPhone: { type: String, default: "" },
    emergencyContact: { type: String, default: "" },
    bloodGroup: { type: String, default: "" },
    pinCode: { type: String, default: "" },
    emergencyContacts: {
      type: [
        {
          name: { type: String, default: "" },
          relationship: { type: String, default: "" },
          phone: { type: String, default: "" },
        },
      ],
      default: [],
    },
    permissions: {
      location: { type: Boolean, default: false },
      camera: { type: Boolean, default: false },
      microphone: { type: Boolean, default: false },
      notification: { type: Boolean, default: false },
      storage: { type: Boolean, default: false },
    },

    // --- Counselor fields ---
    counselorId: { type: String, default: "" },
    qualification: { type: String, default: "" },
    experience: { type: Number, default: 0 },
    hospital: { type: String, default: "" },
    clinic: { type: String, default: "" },
    licenseNumber: { type: String, default: "" },
    languages: { type: [String], default: [] },
    district: { type: String, default: "" },
    specialization: { type: String, default: "" },
    consultationType: { type: String, enum: ["online", "offline", "both"], default: "both" },
    consultationFee: { type: Number, default: 0 },
    about: { type: String, default: "" },
    availability: { type: availabilitySchema, default: () => ({ days: [], timeSlots: [] }) },
    isOnline: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    totalPatients: { type: Number, default: 0 },
    totalCandidates: { type: Number, default: 0 },
    isVerifiedCounselor: { type: Boolean, default: true },
    counselorVerificationStatus: { type: String, enum: ["verified", "pending", "rejected"], default: "verified" },
    memberSince: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false },

    // --- Parent fields ---
    parentId: { type: String, default: "" },
    occupation: { type: String, default: "" },
    relationshipToStudent: { type: String, default: "Parent" },
    alternatePhone: { type: String, default: "" },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

userSchema.index({ location: "2dsphere" });

userSchema.pre("save", async function (next) {
  if (this.role === "patient") {
    this.role = "candidate";
  }
  if (!this.candidateId && this.role === "candidate") {
    this.candidateId = "CND-" + Math.floor(100000 + Math.random() * 900000);
  }
  if (!this.counselorId && this.role === "counselor") {
    this.counselorId = "CNS-" + Math.floor(100000 + Math.random() * 900000);
  }
  if (!this.parentId && this.role === "parent") {
    this.parentId = "PRN-" + Math.floor(100000 + Math.random() * 900000);
  }
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublicJSON = function () {
  const data = this.toObject();
  delete data.password;
  delete data.refreshToken;
  delete data.resetPasswordToken;
  delete data.resetPasswordExpires;
  return data;
};

export default mongoose.model("User", userSchema);
