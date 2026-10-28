// 文档站交互：主题切换、移动端导航、代码复制、标题锚点、目录高亮、站内搜索。
// 所有内容在没有脚本时依然完整可读，这里只做增强。
(function () {
  var doc = document;
  var root = doc.documentElement;
  var body = doc.body;

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  }

  /* 主题 */
  var themeBtn = doc.querySelector(".theme-btn");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      safeSet("rhm-theme", next);
    });
  }

  /* 移动端导航 */
  var menuBtn = doc.querySelector(".menu-btn");
  function setNav(open) {
    body.classList.toggle("nav-open", open);
    if (menuBtn) menuBtn.setAttribute("aria-expanded", String(open));
  }
  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      setNav(!body.classList.contains("nav-open"));
    });
    doc.addEventListener("click", function (e) {
      if (!body.classList.contains("nav-open")) return;
      var t = e.target;
      if (!t.closest(".sidebar") && !t.closest(".menu-btn")) setNav(false);
    });
    doc.querySelectorAll(".sidebar a").forEach(function (a) {
      a.addEventListener("click", function () {
        setNav(false);
      });
    });
  }

  /* 代码复制 */
  var copyIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';
  doc.querySelectorAll(".codeblock").forEach(function (block) {
    var head = block.querySelector(".codeblock-head");
    var codeEl = block.querySelector("code");
    if (!head || !codeEl || !navigator.clipboard) return;
    var btn = doc.createElement("button");
    btn.type = "button";
    btn.className = "copy";
    btn.innerHTML = copyIcon + "<span>" + body.dataset.copy + "</span>";
    btn.addEventListener("click", function () {
      navigator.clipboard.writeText(codeEl.textContent).then(function () {
        btn.lastChild.textContent = body.dataset.copied;
        setTimeout(function () {
          btn.lastChild.textContent = body.dataset.copy;
        }, 1800);
      });
    });
    head.appendChild(btn);
  });

  /* 标题锚点 */
  doc.querySelectorAll("main h2[id]").forEach(function (h) {
    var a = doc.createElement("a");
    a.className = "anchor";
    a.href = "#" + h.id;
    a.setAttribute("aria-label", "#" + h.id);
    a.textContent = "#";
    h.appendChild(a);
  });

  /* 目录高亮 */
  var tocLinks = Array.prototype.slice.call(doc.querySelectorAll(".toc a"));
  if (tocLinks.length && "IntersectionObserver" in window) {
    var byId = {};
    tocLinks.forEach(function (a) {
      byId[a.getAttribute("href").slice(1)] = a;
    });
    var visible = {};
    var order = Object.keys(byId);
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          visible[en.target.id] = en.isIntersecting;
        });
        var current = order.filter(function (id) {
          return visible[id];
        })[0];
        if (!current) return;
        tocLinks.forEach(function (a) {
          a.classList.toggle("active", a === byId[current]);
        });
      },
      { rootMargin: "-80px 0px -65% 0px" },
    );
    order.forEach(function (id) {
      var el = doc.getElementById(id);
      if (el) io.observe(el);
    });
  }

  /* 站内搜索 */
  var openBtn = doc.querySelector("[data-search-open]");
  if (!openBtn || !window.fetch) return;

  var modal = null;
  var input = null;
  var list = null;
  var index = null;
  var selected = 0;
  var results = [];

  function esc(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function highlight(text, terms) {
    var out = esc(text);
    terms.forEach(function (t) {
      if (!t) return;
      var re = new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
      out = out.replace(re, "<mark>$1</mark>");
    });
    return out;
  }

  function snippet(text, terms) {
    var lower = text.toLowerCase();
    var pos = -1;
    for (var i = 0; i < terms.length; i++) {
      pos = lower.indexOf(terms[i]);
      if (pos >= 0) break;
    }
    if (pos < 0) return text.slice(0, 110);
    var start = Math.max(0, pos - 36);
    return (start > 0 ? "…" : "") + text.slice(start, start + 120);
  }

  function search(q) {
    var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length || !index) return [];
    var out = [];
    index.forEach(function (page) {
      var title = page.t.toLowerCase();
      var text = page.x.toLowerCase();
      var score = 0;
      var heading = null;
      for (var i = 0; i < terms.length; i++) {
        var term = terms[i];
        var s = 0;
        if (title.indexOf(term) >= 0) s += 10;
        for (var j = 0; j < page.h.length; j++) {
          if (page.h[j].t.toLowerCase().indexOf(term) >= 0) {
            s += 5;
            if (!heading) heading = page.h[j];
          }
        }
        if (text.indexOf(term) >= 0) s += 1;
        if (!s) return;
        score += s;
      }
      out.push({ page: page, heading: heading, score: score, terms: terms });
    });
    return out
      .sort(function (a, b) {
        return b.score - a.score;
      })
      .slice(0, 8);
  }

  function renderResults(q) {
    results = search(q);
    selected = 0;
    if (!q.trim()) {
      list.innerHTML = "";
      return;
    }
    if (!results.length) {
      list.innerHTML = '<li class="search-empty">' + esc(body.dataset.noResults) + " “" + esc(q) + "”</li>";
      return;
    }
    list.innerHTML = results
      .map(function (r, i) {
        var href = r.page.u + (r.heading ? "#" + r.heading.id : "");
        return (
          '<li><a href="' + href + '"' + (i === 0 ? ' class="selected"' : "") + ">" +
          '<div class="r-title"><span>' + highlight(r.page.t, r.terms) + "</span>" +
          '<span class="r-group">' + esc(r.page.g) + (r.heading ? " › " + esc(r.heading.t) : "") + "</span></div>" +
          '<div class="r-snippet">' + highlight(snippet(r.page.x, r.terms), r.terms) + "</div></a></li>"
        );
      })
      .join("");
  }

  function select(next) {
    var links = list.querySelectorAll("a");
    if (!links.length) return;
    selected = (next + links.length) % links.length;
    links.forEach(function (a, i) {
      a.classList.toggle("selected", i === selected);
    });
    links[selected].scrollIntoView({ block: "nearest" });
  }

  function build() {
    modal = doc.createElement("div");
    modal.className = "search-modal";
    modal.hidden = true;
    modal.innerHTML =
      '<div class="search-panel" role="dialog" aria-modal="true">' +
      '<div class="search-input-row">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
      '<input class="search-input" type="search" autocomplete="off" spellcheck="false" placeholder="' + esc(body.dataset.searchPlaceholder) + '" />' +
      "<kbd>Esc</kbd></div>" +
      '<ul class="search-results"></ul></div>';
    doc.body.appendChild(modal);
    input = modal.querySelector("input");
    list = modal.querySelector("ul");

    modal.addEventListener("mousedown", function (e) {
      if (e.target === modal) close();
    });
    input.addEventListener("input", function () {
      renderResults(input.value);
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        select(selected + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        select(selected - 1);
      } else if (e.key === "Enter") {
        var cur = list.querySelectorAll("a")[selected];
        if (cur) location.href = cur.getAttribute("href");
      }
    });
  }

  function open() {
    if (!modal) build();
    modal.hidden = false;
    input.value = "";
    list.innerHTML = "";
    input.focus();
    if (!index) {
      fetch(body.dataset.search)
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          index = data;
          if (input.value) renderResults(input.value);
        })
        .catch(function () {});
    }
  }

  function close() {
    if (modal) modal.hidden = true;
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  doc.addEventListener("keydown", function (e) {
    var typing = /^(input|textarea|select)$/i.test((e.target.tagName || ""));
    if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing)) {
      e.preventDefault();
      open();
    } else if (e.key === "Escape" && modal && !modal.hidden) {
      close();
    }
  });
})();
