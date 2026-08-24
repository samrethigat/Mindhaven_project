import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../lib/api";
import { AuthLayout } from "./AuthLayout";

export function CandidateLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password, "candidate");
      if (user.role === "candidate" || user.role === "patient") {
        toast.success("Welcome back!");
        navigate("/candidate/dashboard");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout portal="candidate" title="Candidate Login" subtitle="Welcome back. Sign in to access your Candidate portal.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email Address</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-600">
            <input type="checkbox" className="rounded border-slate-300" /> Remember me
          </label>
          <Link to="/forgot-password" className="text-teal-600 hover:underline">Forgot password?</Link>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full bg-teal-600 hover:bg-teal-700 border-none">
          {loading ? "Signing in…" : "Sign in as Candidate"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        Don't have an account?{" "}
        <Link to="/register/candidate" className="font-semibold text-teal-600 hover:underline">Register as Candidate</Link>
      </p>
    </AuthLayout>
  );
}
