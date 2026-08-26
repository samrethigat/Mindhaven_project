import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { api } from "../lib/api";
import { getTranslation } from "../lib/i18n";
import toast from "react-hot-toast";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  speechCode: string; // e.g. "en-US", "ta-IN", "hi-IN"
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🌐", speechCode: "en-US" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳", speechCode: "ta-IN" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", speechCode: "hi-IN" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳", speechCode: "te-IN" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳", speechCode: "kn-IN" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳", speechCode: "ml-IN" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳", speechCode: "bn-IN" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳", speechCode: "mr-IN" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳", speechCode: "gu-IN" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳", speechCode: "pa-IN" },
  { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇮🇳", speechCode: "ur-PK" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", speechCode: "es-ES" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", speechCode: "fr-FR" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", speechCode: "de-DE" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", speechCode: "ar-SA" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳", speechCode: "zh-CN" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", speechCode: "ja-JP" },
];

interface LanguageContextType {
  language: string;
  setLanguage: (langCode: string, notify?: boolean) => Promise<void>;
  t: (key: string) => string;
  currentLanguageObj: LanguageOption;
  languages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useAuth();
  // Default language is English ("en")
  const [language, setLanguageState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("preferredLanguage");
      if (saved) return saved;
    } catch {
      // Ignore
    }
    return "en";
  });

  // Priority: localStorage > user.preferredLanguage > "en"
  useEffect(() => {
    const saved = localStorage.getItem("preferredLanguage");
    if (saved) {
      setLanguageState(saved);
      document.documentElement.lang = saved;
    } else if (user?.preferredLanguage) {
      setLanguageState(user.preferredLanguage);
      localStorage.setItem("preferredLanguage", user.preferredLanguage);
      document.documentElement.lang = user.preferredLanguage;
    } else {
      setLanguageState("en");
      document.documentElement.lang = "en";
    }
  }, [user?.preferredLanguage]);

  const setLanguage = useCallback(
    async (langCode: string, notify: boolean = true) => {
      const cleanCode = langCode.trim().toLowerCase();
      setLanguageState(cleanCode);
      localStorage.setItem("preferredLanguage", cleanCode);
      document.documentElement.lang = cleanCode;

      // Update user state and localStorage user object immediately
      if (user) {
        const updatedUser = { ...user, preferredLanguage: cleanCode };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      // Dispatch real-time language event for immediate component updates
      window.dispatchEvent(new CustomEvent("mindhaven_language_changed", { detail: { language: cleanCode } }));

      // Persist to user DB if authenticated
      if (user?._id) {
        try {
          const res = await api.put("/auth/language", { language: cleanCode });
          if (res.data.user) {
            setUser({ ...user, ...res.data.user, preferredLanguage: cleanCode });
          }
        } catch {
          // Fallback to local
        }
      }

      if (notify) {
        const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === cleanCode);
        const name = langObj?.name || cleanCode;
        toast.success(`🌐 Language switched to: ${name}`);
      }
    },
    [user, setUser]
  );

  const t = useCallback(
    (key: string): string => {
      return getTranslation(key, language);
    },
    [language]
  );

  const currentLanguageObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        currentLanguageObj,
        languages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
