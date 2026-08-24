import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { usePageTitle } from "../../lib/usePageTitle";
import { ShieldCheck, Mail, Lock, ArrowRight, HeartHandshake, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export function ParentLogin() {
  const { login } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  usePageTitle(language === "ta" ? "பெற்றோர் உள்நுழைவு (Parent Login)" : "Parent Login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      return toast.error(language === "ta" ? "மின்னஞ்சல் மற்றும் கடவுச்சொல்லை உள்ளிடவும்" : "Please enter email and password");
    }

    setLoading(true);
    try {
      await login(email.trim(), password, "parent");
      toast.success(language === "ta" ? "பெற்றோர் போர்ட்டலில் உள்நுழைந்தீர்கள்! 👋" : "Welcome to the Parent Portal! 👋");
      navigate("/parent/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-xl shadow-amber-500/25">
            <HeartHandshake className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {language === "ta" ? "பெற்றோர் பாதுகாப்பு போர்டல்" : "Parent Support Portal"}
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-500">
          {language === "ta"
            ? "மாணவர் நல்வாழ்வு, எச்சரிக்கைகள் மற்றும் வழிகாட்டல் கண்காணிப்பு"
            : "Monitor student well-being, authorized alerts, and counselor support"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="card p-6 sm:p-8 bg-white shadow-xl rounded-3xl border border-slate-200/80">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                {language === "ta" ? "மின்னஞ்சல் முகவரி" : "Email Address"}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent@example.com"
                  required
                  className="input pl-10 text-xs sm:text-sm w-full"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  {language === "ta" ? "கடவுச்சொல்" : "Password"}
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold text-amber-600 hover:underline">
                  {language === "ta" ? "மறந்துவிட்டதா?" : "Forgot?"}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input pl-10 pr-10 text-xs sm:text-sm w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-amber-500/25 hover:bg-amber-600 active:scale-95 transition-all disabled:opacity-50"
            >
              <span>{loading ? (language === "ta" ? "உள்நுழைகிறது..." : "Signing in...") : (language === "ta" ? "உள்நுழைக" : "Sign In to Parent Portal")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center space-y-3">
            <p className="text-xs text-slate-500">
              {language === "ta" ? "புதிய கணக்கு வேண்டுமா?" : "New to the Parent Portal?"}{" "}
              <Link to="/register/parent" className="font-bold text-amber-600 hover:underline">
                {language === "ta" ? "இங்கு பதிவு செய்யவும்" : "Create an Account"}
              </Link>
            </p>

            <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-400 pt-2 border-t border-slate-50">
              <Link to="/login/candidate" className="hover:text-blue-600">
                {language === "ta" ? "மாணவர் உள்நுழைவு" : "Student Login"}
              </Link>
              <span>•</span>
              <Link to="/login/counselor" className="hover:text-teal-600">
                {language === "ta" ? "ஆலோசகர் உள்நுழைவு" : "Counselor Login"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
