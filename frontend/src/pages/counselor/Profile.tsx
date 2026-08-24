import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { Loading } from "../../components/ui/Loading";
import toast from "react-hot-toast";

export function CounselorProfile() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/counselor/me").then((res) => {
      const p = res.data.user;
      setProfile(p);
      setForm({
        fullName: p.fullName || "", specialization: p.specialization || "",
        qualification: p.qualification || "", experience: p.experience || 0,
        hospital: p.hospital || "", clinic: p.clinic || "", phone: p.phone || "",
        address: p.address || "", city: p.city || "", district: p.district || "",
        state: p.state || "", licenseNumber: p.licenseNumber || "",
        consultationFee: p.consultationFee || 0,
        languages: (p.languages || []).join(", "),
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function update(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, languages: form.languages.split(",").map((s: string) => s.trim()).filter(Boolean) };
      const { data } = await api.put("/counselor/me", payload);
      setProfile(data.user);
      setUser({ ...user, ...data.user });
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h2 className="text-2xl font-bold">My Profile</h2>
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
            {profile?.fullName?.[0] || "C"}
          </div>
          <div>
            <p className="text-lg font-semibold">{profile?.fullName}</p>
            <p className="text-sm text-slate-500">{profile?.specialization || "Counselor"}</p>
            <p className="text-xs text-slate-400">{profile?.email}</p>
          </div>
        </div>
      </div>

      <form onSubmit={save} className="card space-y-4 p-6">
        <h3 className="text-lg font-semibold">Edit Profile</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Full Name</label>
            <input name="fullName" className="input" value={form.fullName} onChange={update} />
          </div>
          <div>
            <label className="label">Specialization</label>
            <input name="specialization" className="input" value={form.specialization} onChange={update} />
          </div>
          <div>
            <label className="label">Qualification</label>
            <input name="qualification" className="input" value={form.qualification} onChange={update} />
          </div>
          <div>
            <label className="label">Experience (yrs)</label>
            <input name="experience" type="number" className="input" value={form.experience} onChange={update} />
          </div>
          <div>
            <label className="label">Hospital</label>
            <input name="hospital" className="input" value={form.hospital} onChange={update} />
          </div>
          <div>
            <label className="label">Clinic</label>
            <input name="clinic" className="input" value={form.clinic} onChange={update} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input name="phone" className="input" value={form.phone} onChange={update} />
          </div>
          <div>
            <label className="label">Consultation Fee (₹)</label>
            <input name="consultationFee" type="number" className="input" value={form.consultationFee} onChange={update} />
          </div>
          <div className="col-span-2">
            <label className="label">License Number</label>
            <input name="licenseNumber" className="input" value={form.licenseNumber} onChange={update} />
          </div>
          <div className="col-span-2">
            <label className="label">Languages (comma separated)</label>
            <input name="languages" className="input" value={form.languages} onChange={update} />
          </div>
          <div className="col-span-2">
            <label className="label">Address</label>
            <textarea name="address" className="input" value={form.address} onChange={update} />
          </div>
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
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save changes"}</button>
      </form>
    </div>
  );
}
