import { useState } from "react";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "../../lib/api";
import { AuthLayout } from "./AuthLayout";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [portal, setPortal] = useState<"patient" | "counselor">("patient");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email, portal });
      setSent(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout portal={portal} title="Forgot Password" subtitle="Enter your email to reset your password.">
      {sent ? (
        <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700">
          If that email exists, a password reset link has been sent. Please check your inbox.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Account Type</label>
            <select className="input" value={portal} onChange={(e) => setPortal(e.target.value as any)}>
              <option value="patient">Patient</option>
              <option value="counselor">Counselor</option>
            </select>
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
