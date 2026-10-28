// 主题与语言偏好。主题和文档站共用同一个 localStorage key，两个站点之间保持一致。
import { useCallback, useEffect, useState } from "react";
import type { Language } from "./i18n";

const THEME_KEY = "rhm-theme";
const LANG_KEY = "rhm-lang";

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // 隐私模式下可能不可写，忽略即可
  }
};

export function toggleTheme() {
  const root = document.documentElement;
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  write(THEME_KEY, next);
}

export function useLanguage(): [Language, (lang: Language) => void] {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = read(LANG_KEY);
    if (saved === "en" || saved === "zh") return saved;
    return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
  });

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  const change = useCallback((lang: Language) => {
    write(LANG_KEY, lang);
    setLanguage(lang);
  }, []);

  return [language, change];
}
