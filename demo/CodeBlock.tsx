import React, { useMemo, useState } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-bash";
import { CheckIcon, CopyIcon } from "./Icons";
import { useI18n } from "./I18nContext";

interface CodeBlockProps {
  code: string;
  language?: "tsx" | "bash";
}

const LABEL = { tsx: "TSX", bash: "Shell" };

// 语法高亮的配色在 /theme.css（与文档站共用），这里只负责生成 token 标记。
export default function CodeBlock({ code, language = "tsx" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { t } = useI18n();

  const html = useMemo(
    () => Prism.highlight(code, Prism.languages[language], language),
    [code, language],
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className="codeblock">
      <div className="codeblock-head">
        <span>{LABEL[language]}</span>
        <button className="copy" type="button" onClick={handleCopy}>
          {copied ? <CheckIcon /> : <CopyIcon />}
          <span>{copied ? t.panel.copied : t.panel.copy}</span>
        </button>
      </div>
      <pre>
        <code
          className={`language-${language}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </pre>
    </div>
  );
}
