import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export function CounselorSettings() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [changing, setChanging] = useState(false);

  const canDelete = password.length > 0 && confirmText === "DELETE";

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setChanging(true);
    try {
      await api.put("/counselor/change-password", { currentPassword: currentPw, newPassword: newPw });
      toast.success("Password changed");
      setCurrentPw("");
      setNewPw("");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setChanging(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
await api.delete("/counselor/me", { data: { password, confirmation: "DELETE" } });
      toast.success("Account deleted. All future appointments cancelled.");
      await logout();
      navigate("/login/counselor");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold">Account Settings</h2>

      <form onSubmit={changePassword} className="card space-y-4 p-6">
        <h3 className="text-lg font-semibold">Change Password</h3>
        <div>
          <label className="label">Current Password</label>
          <input type="password" className="input" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required />
        </div>
        <div>
          <label className="label">New Password</label>
          <input type="password" className="input" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={6} />
        </div>
        <button type="submit" disabled={changing} className="btn-primary">{changing ? "Changing…" : "Change Password"}</button>
      </form>

      <div className="card border-red-200 p-6">
        <h3 className="text-lg font-bold text-red-700">Delete My Account</h3>
        <p className="mt-1 text-sm text-slate-500">
          This will mark your account as inactive, cancel all future appointments, notify affected patients and remove you from counselor search. This cannot be undone.
        </p>

        {!showDelete ? (
          <button onClick={() => setShowDelete(true)} className="btn-danger mt-4">Delete My Account</button>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-slate-600">Are you sure you want to permanently delete your counselor account?</p>
            <div>
              <label className="label">Enter your current password</label>
              <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <label className="label">Type <strong>DELETE</strong> to confirm</label>
              <input className="input" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button onClick={deleteAccount} disabled={!canDelete || deleting} className="btn-danger">
                {deleting ? "Deleting…" : "Delete Permanently"}
              </button>
              <button onClick={() => { setShowDelete(false); setPassword(""); setConfirmText(""); }} className="btn-outline">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
