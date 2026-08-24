import { useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export function EmergencyContacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<any[]>(
    user?.emergencyContacts || []
  );
  const [form, setForm] = useState({ name: "", relationship: "", phone: "" });

  function update(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    const next = [...contacts, form];
    setContacts(next);
    try {
      await api.put("/patient/me", { emergencyContacts: next });
      toast.success("Emergency contact added");
      setForm({ name: "", relationship: "", phone: "" });
    } catch {
      setContacts(contacts);
      toast.error("Failed to save contact");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold">Emergency Contacts</h2>
      <div className="card p-6">
        <h3 className="mb-4 text-lg font-semibold">Add Emergency Contact</h3>
        <form onSubmit={addContact} className="space-y-3">
<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input name="name" className="input" placeholder="Name" value={form.name} onChange={update} required />
            <input name="relationship" className="input" placeholder="Relationship" value={form.relationship} onChange={update} required />
            <input name="phone" className="input" placeholder="Phone" value={form.phone} onChange={update} required />
          </div>
          <button type="submit" className="btn-primary">Add Contact</button>
        </form>
      </div>

      <div className="card p-6">
        <h3 className="mb-4 text-lg font-semibold">Saved Contacts</h3>
        {contacts.length === 0 ? (
          <p className="text-sm text-slate-400">No emergency contacts yet.</p>
        ) : (
          <div className="space-y-3">
            {contacts.map((c, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-slate-500">{c.relationship} · {c.phone}</p>
                </div>
                <a href={`tel:${c.phone}`} className="btn-primary">Call</a>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card border-red-200 bg-red-50 p-6">
        <h3 className="text-lg font-bold text-red-700">🚨 In immediate danger?</h3>
        <p className="mt-1 text-sm text-red-600">
          Contact your local emergency number right away. Your saved contacts and assigned counselor will be notified automatically in high-risk situations.
        </p>
      </div>
    </div>
  );
}
