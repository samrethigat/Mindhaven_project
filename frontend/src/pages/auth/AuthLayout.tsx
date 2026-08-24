import { ReactNode } from "react";
import { Link } from "react-router-dom";

export function AuthLayout({
  children,
  title,
  subtitle,
  portal,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
  portal: "candidate" | "counselor" | "patient";
}) {
  const isCounselor = portal === "counselor";
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-700 via-teal-600 to-sky-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center text-white">
          <Link to="/" className="inline-block text-2xl font-extrabold tracking-tight">
            🧠 MINDHAVEN
          </Link>
          <p className="mt-1 text-sm text-teal-100">{isCounselor ? "Counselor Portal" : "Candidate Portal"}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-2xl sm:p-8">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-4 text-center text-xs text-teal-100">
          {isCounselor ? (
            <Link to="/login/candidate" className="hover:underline font-semibold">Switch to Candidate Portal</Link>
          ) : (
            <Link to="/login/counselor" className="hover:underline font-semibold">Switch to Counselor Portal</Link>
          )}
        </p>
      </div>
    </div>
  );
}
