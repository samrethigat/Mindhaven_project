import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../lib/api";
import { AuthLayout } from "./AuthLayout";

export function CounselorLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password, "counselor");
      if (user.role === "counselor") {
        toast.success("Welcome back!");
        navigate("/counselor/dashboard");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout portal="counselor" title="Counselor Login" subtitle="Sign in to your professional workspace.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email</label>
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
          <Link to="/forgot-password" className="text-blue-600 hover:underline">Forgot password?</Link>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-semibold">Or Quick Access</span></div>
        </div>

        <button
          type="button"
          onClick={async () => {
            setLoading(true);
            try {
              const user = await login("meera@mindhaven.app", "Counselor@123", "counselor");
              toast.success("Logged in as Dr. Meera Iyer (Counselor)!");
              navigate("/counselor/dashboard");
            } catch (err) {
              toast.error(getErrorMessage(err));
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          className="btn-outline w-full text-xs font-bold text-blue-700 border-blue-200 hover:bg-blue-50"
        >
          ⚡ 1-Click Demo Counselor Login
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        Don't have an account?{" "}
        <Link to="/register/counselor" className="font-semibold text-blue-600 hover:underline">Register</Link>
      </p>
    </AuthLayout>
  );
}
