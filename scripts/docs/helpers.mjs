// 文档内容用到的小工具：把简易标记转成 HTML 字符串。
// 行内标记：`code`、**bold**、[text](url)；url 以 "@/" 开头表示当前语言的文档根目录。

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
export const code = (src) => `<pre><code>${esc(src.trim())}</code></pre>`;

export const table = (head, rows) =>
  `<div class="table-wrap"><table><thead><tr>${head
    .map((h) => `<th>${md(h)}</th>`)
    .join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${md(c)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;

export const join = (...parts) => parts.join("\n");
