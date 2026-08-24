import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api, getErrorMessage } from "../../lib/api";
import { usePageTitle } from "../../lib/usePageTitle";
import toast from "react-hot-toast";

export function PatientSettings() {
  usePageTitle("Settings");
  const { user, setUser } = useAuth();
  const [form, setForm] = useState<any>({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    college: user?.college || "",
    department: user?.department || "",
  });
  const [saving, setSaving] = useState(false);

  function update(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put("/patient/me", form);
      setUser({ ...user, ...data.user });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
          {user?.fullName?.[0] || user?.email?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="text-lg font-semibold">{user?.fullName}</p>
          <p className="text-sm text-slate-500">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={save} className="card space-y-4 p-6">
        <h3 className="text-lg font-semibold">Edit Profile</h3>
        <div>
          <label className="label">Full Name</label>
          <input name="fullName" className="input" value={form.fullName} onChange={update} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input name="phone" className="input" value={form.phone} onChange={update} />
        </div>
<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">College</label>
            <input name="college" className="input" value={form.college} onChange={update} />
          </div>
          <div>
            <label className="label">Department</label>
            <input name="department" className="input" value={form.department} onChange={update} />
          </div>
        </div>
        <div>
          <label className="label">Address</label>
          <input name="address" className="input" value={form.address} onChange={update} />
        </div>
<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">City</label>
            <input name="city" className="input" value={form.city} onChange={update} />
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
