import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../lib/api";
import { AuthLayout } from "./AuthLayout";

export function CandidateRegister() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<any>({
    fullName: "", email: "", password: "", phone: "", dob: "", gender: "",
    college: "", department: "", year: "", registerNumber: "", parentName: "",
    parentPhone: "", bestFriendName: "", bestFriendPhone: "", emergencyContact: "",
    bloodGroup: "", address: "", city: "", state: "", country: "", pinCode: "",
  });
  const [loading, setLoading] = useState(false);

  function update(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form, "candidate");
      toast.success("Registration successful!");
      navigate("/candidate/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout portal="candidate" title="Candidate Registration" subtitle="Create your confidential account.">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div>
          <label className="label">Full Name *</label>
          <input name="fullName" className="input" value={form.fullName} onChange={update} required placeholder="Enter full name" />
        </div>
        <div>
          <label className="label">Email Address *</label>
          <input name="email" type="email" className="input" value={form.email} onChange={update} required placeholder="you@domain.com" />
        </div>
        <div>
          <label className="label">Password *</label>
          <input name="password" type="password" className="input" value={form.password} onChange={update} required minLength={6} placeholder="At least 6 characters" />
        </div>
        <div>
          <label className="label">Mobile Number</label>
          <input name="phone" className="input" value={form.phone} onChange={update} placeholder="+1234567890" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Date of Birth</label>
            <input name="dob" type="date" className="input" value={form.dob} onChange={update} />
          </div>
          <div>
            <label className="label">Gender</label>
            <select name="gender" className="input" value={form.gender} onChange={update}>
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
              <option>Prefer not to say</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">College / Institution</label>
            <input name="college" className="input" value={form.college} onChange={update} />
          </div>
          <div>
            <label className="label">Department / Major</label>
            <input name="department" className="input" value={form.department} onChange={update} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Year / Grade</label>
            <input name="year" className="input" value={form.year} onChange={update} />
          </div>
          <div>
            <label className="label">Register / ID No.</label>
            <input name="registerNumber" className="input" value={form.registerNumber} onChange={update} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Parent / Guardian Name</label>
            <input name="parentName" className="input" value={form.parentName} onChange={update} />
          </div>
          <div>
            <label className="label">Parent / Guardian Mobile</label>
            <input name="parentPhone" className="input" value={form.parentPhone} onChange={update} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Emergency Contact Name</label>
            <input name="bestFriendName" className="input" value={form.bestFriendName} onChange={update} />
          </div>
          <div>
            <label className="label">Emergency Contact Phone</label>
            <input name="emergencyContact" className="input" value={form.emergencyContact} onChange={update} />
          </div>
        </div>
        <div>
          <label className="label">Address</label>
          <input name="address" className="input" value={form.address} onChange={update} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="label">City</label>
            <input name="city" className="input" value={form.city} onChange={update} />
          </div>
          <div>
            <label className="label">State</label>
            <input name="state" className="input" value={form.state} onChange={update} />
          </div>
          <div>
            <label className="label">PIN Code</label>
            <input name="pinCode" className="input" value={form.pinCode} onChange={update} />
          </div>
        </div>
        <div>
          <label className="label">Country</label>
          <input name="country" className="input" value={form.country} onChange={update} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full bg-teal-600 hover:bg-teal-700 border-none">
          {loading ? "Creating account…" : "Complete Registration"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        Already registered?{" "}
        <Link to="/login/candidate" className="font-semibold text-teal-600 hover:underline">Sign in as Candidate</Link>
      </p>
    </AuthLayout>
  );
}
