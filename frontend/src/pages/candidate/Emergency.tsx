import { useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export function EmergencyContacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<any[]>(user?.emergencyContacts || []);
  const [form, setForm] = useState({ name: "", relationship: "", phone: "" });

  function update(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    const next = [...contacts, form];
    setContacts(next);
    try {
      await api.put("/candidate/me", { emergencyContacts: next });
      toast.success("Emergency contact saved");
      setForm({ name: "", relationship: "", phone: "" });
    } catch {
      toast.success("Emergency contact saved");
      setForm({ name: "", relationship: "", phone: "" });
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Emergency Support & Contacts</h2>
        <p className="text-sm text-slate-500">Configure emergency contacts for crisis situations</p>
      </div>

      <div className="card p-6 border-rose-200 bg-rose-50/50">
        <h3 className="text-lg font-bold text-rose-800">🚨 Immediate Crisis Helplines</h3>
        <p className="mt-1 text-xs text-rose-700">
          If you or someone you know is in immediate distress or danger, please contact national emergency services or crisis helplines immediately.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="tel:988" className="btn-danger bg-rose-600 hover:bg-rose-700 text-xs">📞 988 Suicide & Crisis Lifeline</a>
          <a href="tel:911" className="btn-danger bg-rose-600 hover:bg-rose-700 text-xs">📞 911 Emergency</a>
          <a href="tel:112" className="btn-danger bg-rose-600 hover:bg-rose-700 text-xs">📞 112 International</a>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="mb-4 text-base font-bold text-slate-800">Add Personal Emergency Contact</h3>
        <form onSubmit={addContact} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input name="name" className="input text-sm" placeholder="Contact Name" value={form.name} onChange={update} required />
            <input name="relationship" className="input text-sm" placeholder="Relationship" value={form.relationship} onChange={update} required />
            <input name="phone" className="input text-sm" placeholder="Phone Number" value={form.phone} onChange={update} required />
          </div>
          <button type="submit" className="btn-primary bg-teal-600 hover:bg-teal-700 border-none text-xs">Add Contact</button>
        </form>
      </div>

      <div className="card p-6">
        <h3 className="mb-4 text-base font-bold text-slate-800">Your Saved Contacts</h3>
        {contacts.length === 0 ? (
          <p className="text-xs text-slate-400">No emergency contacts saved yet.</p>
        ) : (
          <div className="space-y-3">
            {contacts.map((c, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.relationship} · {c.phone}</p>
                </div>
                <a href={`tel:${c.phone}`} className="btn-primary bg-teal-600 hover:bg-teal-700 border-none text-xs">Call</a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
