import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../lib/api";
import { AuthLayout } from "./AuthLayout";

export function CounselorRegister() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<any>({
    fullName: "", email: "", password: "", phone: "", qualification: "",
    specialization: "", experience: "", hospital: "", clinic: "", licenseNumber: "",
    languages: "", district: "", city: "", state: "", address: "", consultationFee: "",
  });
  const [loading, setLoading] = useState(false);

  function update(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const langs = form.languages.split(",").map((s: string) => s.trim()).filter(Boolean);
      const user = await register({ ...form, languages: langs }, "counselor");
      toast.success("Registration successful!");
      navigate("/counselor/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout portal="counselor" title="Counselor Registration" subtitle="Join as a licensed professional.">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div>
          <label className="label">Full Name *</label>
          <input name="fullName" className="input" value={form.fullName} onChange={update} required />
        </div>
        <div>
          <label className="label">Email *</label>
          <input name="email" type="email" className="input" value={form.email} onChange={update} required />
        </div>
        <div>
          <label className="label">Password *</label>
          <input name="password" type="password" className="input" value={form.password} onChange={update} required minLength={6} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input name="phone" className="input" value={form.phone} onChange={update} />
        </div>
        <div>
          <label className="label">Qualification *</label>
          <input name="qualification" className="input" value={form.qualification} onChange={update} required />
        </div>
        <div>
          <label className="label">Specialization</label>
          <input name="specialization" className="input" value={form.specialization} onChange={update} />
        </div>
        <div>
          <label className="label">Experience (years)</label>
          <input name="experience" type="number" className="input" value={form.experience} onChange={update} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Hospital</label>
            <input name="hospital" className="input" value={form.hospital} onChange={update} />
          </div>
          <div>
            <label className="label">Clinic</label>
            <input name="clinic" className="input" value={form.clinic} onChange={update} />
          </div>
        </div>
        <div>
          <label className="label">License Number *</label>
          <input name="licenseNumber" className="input" value={form.licenseNumber} onChange={update} required />
        </div>
        <div>
          <label className="label">Languages (comma separated)</label>
          <input name="languages" className="input" value={form.languages} onChange={update} placeholder="English, Tamil" />
        </div>
        <div>
          <label className="label">Address</label>
          <textarea name="address" className="input" value={form.address} onChange={update} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="label">City</label>
            <input name="city" className="input" value={form.city} onChange={update} />
          </div>
          <div>
            <label className="label">District</label>
            <input name="district" className="input" value={form.district} onChange={update} />
          </div>
          <div>
            <label className="label">State</label>
            <input name="state" className="input" value={form.state} onChange={update} />
          </div>
        </div>
        <div>
          <label className="label">Consultation Fee (₹)</label>
          <input name="consultationFee" type="number" className="input" value={form.consultationFee} onChange={update} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        Already registered?{" "}
        <Link to="/login/counselor" className="font-semibold text-blue-600 hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
