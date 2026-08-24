import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "../../lib/api";
import { AuthLayout } from "./AuthLayout";

export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const portal = params.get("role") === "counselor" ? "counselor" : "patient";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, email, newPassword: password });
      setDone(true);
      toast.success("Password reset successfully. Please login.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout portal={portal} title="Reset Password" subtitle="Set a new password for your account.">
      {done ? (
        <div className="space-y-4 text-center">
          <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700">Password updated successfully!</div>
          <Link to={portal === "counselor" ? "/login/counselor" : "/login/patient"} className="btn-primary w-full text-center">
            Go to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <button type="submit" disabled={loading || !token} className="btn-primary w-full">
            {loading ? "Resetting…" : "Reset password"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
