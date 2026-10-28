import React, { useState } from "react";
import { ArrowIcon, CheckIcon, CopyIcon } from "./Icons";
import { useI18n } from "./I18nContext";
import { docsUrl } from "./Header";

const INSTALL = "npm install react-hybrid-masonry";

export default function Hero() {
  const { language, t } = useI18n();
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(INSTALL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <section className="hero">
      <div className="hero-inner">
        <span className="badge">{t.hero.badge}</span>
        <h1>{t.hero.title}</h1>
        <p className="hero-sub">{t.hero.subtitle}</p>
        <div className="hero-actions">
          <div className="install">
            <code>
              <span className="prompt">$</span> {INSTALL}
            </code>
            <button type="button" onClick={copy} aria-label={t.hero.copy}>
              {copied ? <CheckIcon /> : <CopyIcon />}
              <span>{copied ? t.hero.copied : t.hero.copy}</span>
            </button>
          </div>
          <a className="btn btn-primary" href={docsUrl(language)}>
            {t.hero.docs}
            <ArrowIcon />
          </a>
        </div>
      </div>
      <ul className="features">
        {t.hero.features.map((f) => (
          <li key={f.title}>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
