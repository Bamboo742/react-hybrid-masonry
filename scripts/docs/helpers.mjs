// 文档内容用到的小工具：把简易标记转成 HTML 字符串。
// 行内标记：`code`、**bold**、[text](url)；url 以 "@/" 开头表示当前语言的文档根目录。
import Prism from "prismjs";
import loadLanguages from "prismjs/components/index.js";

loadLanguages(["typescript", "tsx", "bash", "json"]);

export const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const md = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

export const p = (s) => `<p>${md(s)}</p>`;
export const h2 = (id, text) => `<h2 id="${id}">${md(text)}</h2>`;
export const h3 = (text) => `<h3>${md(text)}</h3>`;
export const ul = (items) =>
  `<ul>${items.map((i) => `<li>${md(i)}</li>`).join("")}</ul>`;
export const ol = (items) =>
  `<ol>${items.map((i) => `<li>${md(i)}</li>`).join("")}</ol>`;
export const note = (s) => `<div class="note">${md(s)}</div>`;
const LANG_LABEL = {
  tsx: "TSX",
  bash: "Shell",
  json: "JSON",
  typescript: "TS",
  text: "Text",
};

// 没有显式指定语言时：以 npm/yarn/pnpm/git 开头或整段是 # 注释的当作 Shell，其余按 TSX 处理。
const detectLang = (src) =>
  /^(npm|yarn|pnpm|npx|git|#)/.test(src) ? "bash" : "tsx";

// 构建时就染好色，页面不需要为此加载任何脚本。
export const code = (src, lang = detectLang(src.trim())) => {
  const text = src.trim();
  const grammar = Prism.languages[lang];
  const html = grammar ? Prism.highlight(text, grammar, lang) : esc(text);
  return `<div class="codeblock"><div class="codeblock-head"><span>${LANG_LABEL[lang] ?? lang}</span></div><pre><code class="language-${lang}">${html}</code></pre></div>`;
};

export const table = (head, rows) =>
  `<div class="table-wrap"><table><thead><tr>${head
    .map((h) => `<th>${md(h)}</th>`)
    .join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${md(c)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;

export const figure = (svg, caption) =>
  `<figure class="figure">${svg}<figcaption>${md(caption)}</figcaption></figure>`;

// 并排对比的多张图
export const figures = (...items) =>
  `<div class="figure-grid">${items.map(([svg, caption]) => figure(svg, caption)).join("")}</div>`;

export const join = (...parts) => parts.join("\n");
