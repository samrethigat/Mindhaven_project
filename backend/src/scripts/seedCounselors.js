import "dotenv/config";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";

const counselors = [
  {
    fullName: "Dr. Meera Iyer",
    email: "meera@mindhaven.app",
    password: "Counselor@123",
    role: "counselor",
    phone: "+91 98765 40001",
    qualification: "Ph.D. Clinical Psychology",
    specialization: "Anxiety & Depression",
    experience: 12,
    hospital: "City Mental Health Institute",
    clinic: "Wellbeing Center, MG Road",
    licenseNumber: "LIC-1001",
    languages: ["English", "Tamil", "Hindi"],
    city: "Chennai",
    district: "Chennai",
    state: "Tamil Nadu",
    address: "12 MG Road",
    consultationFee: 800,
    availability: { days: ["Mon", "Tue", "Wed", "Thu", "Fri"], timeSlots: ["10:00", "11:00", "15:00", "16:00"] },
  },
  {
    fullName: "Dr. Arjun Nair",
    email: "arjun@mindhaven.app",
    password: "Counselor@123",
    role: "counselor",
    phone: "+91 98765 40002",
    qualification: "M.D. Psychiatry",
    specialization: "Mood Disorders",
    experience: 9,
    hospital: "Sunrise Neuropsychiatry",
    clinic: "Nair Clinic, Anna Nagar",
    licenseNumber: "LIC-1002",
    languages: ["English", "Malayalam", "Hindi"],
    city: "Chennai",
    district: "Chennai",
    state: "Tamil Nadu",
    address: "34 Anna Nagar",
    consultationFee: 1000,
    availability: { days: ["Mon", "Wed", "Fri", "Sat"], timeSlots: ["09:00", "10:00", "17:00", "18:00"] },
  },
  {
    fullName: "Dr. Sarah Joseph",
    email: "sarah@mindhaven.app",
    password: "Counselor@123",
    role: "counselor",
    phone: "+91 98765 40003",
    qualification: "M.Phil. Counselling Psychology",
    specialization: "Student Stress & Academic Pressure",
    experience: 6,
    hospital: "Campus Care Clinic",
    clinic: "Joseph Counselling, T Nagar",
    licenseNumber: "LIC-1003",
    languages: ["English", "Tamil", "Malayalam"],
    city: "Chennai",
    district: "Chennai",
    state: "Tamil Nadu",
    address: "77 T Nagar",
    consultationFee: 600,
    availability: { days: ["Tue", "Thu", "Sat", "Sun"], timeSlots: ["11:00", "12:00", "16:00"] },
  },
];

async function seed() {
  await connectDB();
  let created = 0;
  for (const c of counselors) {
    const exists = await User.findOne({ email: c.email });
    if (!exists) {
      // password is hashed by the pre('save') hook
      await User.create(c);
      created++;
      console.log(`Created counselor: ${c.email}`);
    } else {
      console.log(`Skipped existing: ${c.email}`);
    }
  }
  console.log(`Seed complete. Created ${created} counselors.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
