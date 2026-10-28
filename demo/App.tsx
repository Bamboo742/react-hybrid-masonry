import React, { useState } from "react";
import VirtualMasonryDemo from "./VirtualMasonryDemo";
import EqualHeightDemo from "./EqualHeightDemo";
import DynamicDemo from "./DynamicDemo";
import Header, { NPM, REPO } from "./Header";
import Hero from "./Hero";
import { I18nContext } from "./I18nContext";
import { translations } from "./i18n";
import { useLanguage } from "./theme";

type DemoType = "waterfall" | "equalHeight" | "dynamic";

const DEMOS: DemoType[] = ["waterfall", "equalHeight", "dynamic"];

export default function App() {
  const [language, setLanguage] = useLanguage();
  const [activeDemo, setActiveDemo] = useState<DemoType>("waterfall");
  const t = translations[language];

  return (
    <I18nContext.Provider value={{ language, t }}>
      <Header onLanguageChange={setLanguage} />
      <Hero />

      <div className="tabs-bar">
        <div className="tabs" role="tablist">
          {DEMOS.map((demo) => (
            <button
              key={demo}
              type="button"
              role="tab"
              aria-selected={activeDemo === demo}
              onClick={() => setActiveDemo(demo)}
            >
              {t.tabs[demo]}
            </button>
          ))}
        </div>
      </div>

      <main className="demo-main">
        {activeDemo === "waterfall" && <VirtualMasonryDemo />}
        {activeDemo === "equalHeight" && <EqualHeightDemo />}
        {activeDemo === "dynamic" && <DynamicDemo />}
      </main>

      <footer className="site-footer">
        <div className="inner">
          <p>{t.footer.note} © 2026 react-hybrid-masonry</p>
          <nav aria-label="Links">
            <a href={REPO}>GitHub</a>
            <a href={NPM}>npm</a>
            <a href={`${REPO}/issues`}>Issues</a>
          </nav>
        </div>
      </footer>
    </I18nContext.Provider>
  );
}
