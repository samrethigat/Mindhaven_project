import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Loading } from "../../components/ui/Loading";
import { Empty } from "../../components/ui/Empty";
import { usePageTitle } from "../../lib/usePageTitle";

export function CounselorCandidates() {
  usePageTitle("My Candidates");
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/counselor/candidates").then((res) => {
      setCandidates(res.data.candidates || res.data.patients || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = candidates.filter((p) =>
    (p.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.candidateId || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Candidates</h2>
          <p className="text-sm text-slate-500">Candidates with active or historical appointment sessions</p>
        </div>
        <input className="input max-w-xs text-sm" placeholder="Search by candidate name or ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty title="No candidates yet" description="Candidates appear here once they book appointments with you." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p: any) => (
            <div key={p._id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-lg font-bold text-teal-700 overflow-hidden">
                  {p.photo ? (
                    <img src={p.photo} alt={p.fullName} className="h-full w-full object-cover" />
                  ) : (
                    p.fullName?.[0] || "C"
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{p.fullName}</p>
                  <p className="text-xs text-slate-500">{p.gender}{p.age ? ` · ${p.age} yrs` : ""}</p>
                  {p.candidateId && (
                    <span className="text-[11px] font-mono text-teal-600 font-semibold">{p.candidateId}</span>
                  )}
                </div>
              </div>
              <div className="mt-4 space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <p>📧 <strong>Email:</strong> {p.email}</p>
                <p>📞 <strong>Phone:</strong> {p.phone || "—"}</p>
                <p>🏫 <strong>College:</strong> {p.college || "—"}</p>
                <p>🎓 <strong>Department:</strong> {p.department || "—"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const CounselorPatients = CounselorCandidates;
