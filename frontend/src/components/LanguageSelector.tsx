import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { Globe, ChevronDown, Check, Search } from "lucide-react";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, currentLanguageObj, languages } = useLanguage();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = languages.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm backdrop-blur-md hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 ${
          compact ? "px-2 py-1 text-[11px]" : ""
        }`}
        title="Change Language"
      >
        <span className="text-base">{currentLanguageObj.flag}</span>
        <Globe className="w-3.5 h-3.5 text-blue-600" />
        <span className="hidden sm:inline font-bold">{currentLanguageObj.nativeName}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-3xl border border-slate-200/90 bg-white/98 p-2.5 shadow-2xl backdrop-blur-2xl animate-fade-in">
          <div className="px-2 py-1.5 border-b border-slate-100 mb-1.5 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>மொழி / Language</span>
            </span>
            <span className="badge bg-blue-50 text-blue-700 text-[10px]">{languages.length}</span>
          </div>

          {/* Search Box */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search language..."
              className="input pl-8 py-1 text-xs w-full"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-0.5 scrollbar-thin">
            {filtered.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-blue-50 text-blue-700 font-bold border border-blue-100"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{lang.flag}</span>
                    <div className="text-left">
                      <p className="font-bold leading-tight">{lang.nativeName}</p>
                      <p className="text-[10px] text-slate-400">{lang.name}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
