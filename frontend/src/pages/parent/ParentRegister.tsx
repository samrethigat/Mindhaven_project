import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { usePageTitle } from "../../lib/usePageTitle";
import { User, Mail, Lock, Phone, HeartHandshake, ArrowRight, Briefcase, MapPin } from "lucide-react";
import toast from "react-hot-toast";

export function ParentRegister() {
  const { register } = useAuth();
  const { setLanguage } = useLanguage();
  const navigate = useNavigate();

  usePageTitle("Parent Registration");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    alternatePhone: "",
    relationshipToStudent: "Father",
    occupation: "",
    city: "",
    state: "",
  });
  const [loading, setLoading] = useState(false);

  // Ensure English is set when accessing Parent Register
  useEffect(() => {
    setLanguage("en", false);
  }, [setLanguage]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password) {
      return toast.error("Please fill in all required fields.");
    }
    if (formData.password.length < 6) {
      return toast.error("Password must be at least 6 characters.");
    }

    setLoading(true);
    try {
      await register(formData, "parent");
      await setLanguage("en", false);
      toast.success("Parent account created successfully! 🎉");
      navigate("/parent/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-xl shadow-amber-500/25">
            <HeartHandshake className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Parent Portal Registration
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-500">
          Connect securely with your student's campus wellness support
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="card p-6 sm:p-8 bg-white shadow-xl rounded-3xl border border-slate-200/80">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Ramesh Kumar"
                    required
                    className="input pl-10 text-xs sm:text-sm w-full"
                  />
                </div>
              </div>

              {/* Relationship */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Relationship to Student *
                </label>
                <select
                  name="relationshipToStudent"
                  value={formData.relationshipToStudent}
                  onChange={handleChange}
                  className="input text-xs sm:text-sm w-full font-semibold"
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Family Member">Family Member</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="parent@example.com"
                    required
                    className="input pl-10 text-xs sm:text-sm w-full"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Password (Min. 6 chars) *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="input pl-10 text-xs sm:text-sm w-full"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    required
                    className="input pl-10 text-xs sm:text-sm w-full"
                  />
                </div>
              </div>

              {/* Occupation */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Occupation
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleChange}
                    placeholder="e.g. Teacher, Engineer"
                    className="input pl-10 text-xs sm:text-sm w-full"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* City */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  City
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Chennai"
                    className="input pl-10 text-xs sm:text-sm w-full"
                  />
                </div>
              </div>

              {/* State */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Tamil Nadu"
                  className="input text-xs sm:text-sm w-full"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-amber-500/25 hover:bg-amber-600 active:scale-95 transition-all disabled:opacity-50 mt-2"
            >
              <span>{loading ? "Creating Account..." : "Register as Parent"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{" "}
              <Link to="/login/parent" className="font-bold text-amber-600 hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
