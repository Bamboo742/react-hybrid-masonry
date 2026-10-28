import React from "react";
import { GithubIcon, Logo, MoonIcon, SunIcon } from "./Icons";
import { useI18n } from "./I18nContext";
import { Language } from "./i18n";
import { toggleTheme } from "./theme";

export const REPO = "https://github.com/Bamboo742/react-hybrid-masonry";
export const NPM = "https://www.npmjs.com/package/react-hybrid-masonry";

export const docsUrl = (language: Language) =>
  `${import.meta.env.BASE_URL}docs/${language === "zh" ? "zh/" : ""}`;

interface HeaderProps {
  onLanguageChange: (language: Language) => void;
}

export default function Header({ onLanguageChange }: HeaderProps) {
  const { language, t } = useI18n();

  return (
    <header className="site-header">
      <div className="bar">
        <a className="brand" href={import.meta.env.BASE_URL}>
          <Logo />
          <span>React Hybrid Masonry</span>
        </a>
        <nav className="top-links" aria-label="Site">
          <a className="keep" href={docsUrl(language)}>
            {t.header.docs}
          </a>
          <a href={NPM}>npm</a>
        </nav>
        <div className="seg" role="group" aria-label="Language">
          {(["en", "zh"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              aria-pressed={language === lang}
              onClick={() => onLanguageChange(lang)}
            >
              {lang === "en" ? "EN" : "中文"}
            </button>
          ))}
        </div>
        <a className="icon-btn" href={REPO} aria-label="GitHub">
          <GithubIcon />
        </a>
        <button
          type="button"
          className="icon-btn theme-btn"
          aria-label={t.header.theme}
          onClick={toggleTheme}
        >
          <span className="sun">
            <SunIcon />
          </span>
          <span className="moon">
            <MoonIcon />
          </span>
        </button>
      </div>
    </header>
  );
}
