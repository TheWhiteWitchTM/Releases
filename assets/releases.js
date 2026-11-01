/* The shelf is the git tree. A new project folder appears here without an edit. */
(function (root) {
  "use strict";

  var OWNER = "TheWhiteWitchTM";
  var REPO = "Releases";
  var TREE_URL = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/git/trees/HEAD?recursive=1";
  var GH = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  var SKIP_TOP = { assets: 1, node_modules: 1, docs: 1 };
  var OS_ORDER = { Linux: 0, Windows: 1, macOS: 2, Android: 3, Any: 4 };
  var PRE = { alpha: 1, pre: 2, preview: 2, beta: 3, rc: 4 };
  var DATE_KEY = "ww-releases-dates-v1";

  /* Optional polish. A folder that is not listed here still shows up. */
  var KNOWN = {
    blogy: {
      name: "Blogy",
      blurb: "Markdown for the blogs you already have. Preview, front matter, and publish with git.",
      repo: "https://github.com/TheWhiteWitchTM/blogy",
      page: "https://thewhitewitchtm.github.io/blogy/",
      image: "https://thewhitewitchtm.github.io/assets/images/blogy.jpg"
    },
    "magic-dock": {
      name: "MAGIC Dock",
      blurb: "Stacks on the COSMIC dock. Pins, search, and the edge you already set in Settings.",
      repo: "https://github.com/TheWhiteWitchTM/MAGIC-Dock",
      page: "https://thewhitewitchtm.github.io/magic-dock/",
      image: "https://thewhitewitchtm.github.io/assets/images/magic-dock.jpg",
      tag: "Linux only"
    },
    grogy: {
      name: "Grogy",
      blurb: "The Grok study. Chat, Grok Build, Imagine, and the bots."
    },
    vesper: {
      name: "Vesper",
      blurb: "Music and video for the quiet hours. Albums, a queue, and the film you paused.",
      repo: "https://github.com/TheWhiteWitchTM/vesper",
      page: "https://thewhitewitchtm.github.io/vesper/",
      image: "https://thewhitewitchtm.github.io/assets/images/vesper.jpg"
    },
    cinder: {
      name: "Cinder",
      blurb: "An editor for bash and sh. Run it, trace it, or stop on a breakpoint.",
      repo: "https://github.com/TheWhiteWitchTM/cinder",
      page: "https://thewhitewitchtm.github.io/cinder/",
      image: "https://thewhitewitchtm.github.io/assets/images/cinder.jpg"
    },
    libresky: {
      name: "LibreSky",
      blurb: "Edit, AI, voice, video, and chat. Your account, in this browser.",
      repo: "https://github.com/TheWhiteWitchTM/LibreSky",
      page: "https://thewhitewitchtm.github.io/LibreSky/",
      image: "https://thewhitewitchtm.github.io/assets/images/libresky.png"
    },
    "retro-center": {
      name: "RETRO Center",
      blurb: "Five machines, one shelf. Power on, or drop a disk you own.",
      repo: "https://github.com/TheWhiteWitchTM/RETRO-Center",
      page: "https://thewhitewitchtm.github.io/retro-center/",
      image: "https://thewhitewitchtm.github.io/assets/images/retro-center.jpg"
    },
    "magic-studio": {
      name: "MAGIC Studio",
      blurb: "The dark IDE. Write it, run it, and see the sprite.",
      repo: "https://github.com/TheWhiteWitchTM/MAGIC-Studio",
      page: "https://thewhitewitchtm.github.io/whitewitch/magic/studio/",
      image: "https://thewhitewitchtm.github.io/assets/images/studio.jpg"
    },
    emojigames: {
      name: "Emoji Games",
      blurb: "Old games drawn with emoji.",
      repo: "https://github.com/TheWhiteWitchTM/emojigames",
      page: "https://thewhitewitchtm.github.io/emojigames/",
      image: "https://thewhitewitchtm.github.io/emojigames/assets/images/preview.jpg"
    },
    "faux-news": {
      name: "FAUX NEWS",
      blurb: "Satire. Their headline stays on the card. The rest is a joke.",
      repo: "https://github.com/TheWhiteWitchTM/FauxNews-",
      page: "https://thewhitewitchtm.github.io/faux-news/",
      image: "https://thewhitewitchtm.github.io/assets/images/faux-news.png"
    },
    fauxnews: {
      name: "FAUX NEWS",
      blurb: "Satire. Their headline stays on the card. The rest is a joke.",
      repo: "https://github.com/TheWhiteWitchTM/FauxNews-",
      page: "https://thewhitewitchtm.github.io/faux-news/",
      image: "https://thewhitewitchtm.github.io/assets/images/faux-news.png"
    }
  };

  var KEEP = { magic: "MAGIC", retro: "RETRO", ai: "AI", ide: "IDE", qt: "Qt", api: "API" };

  function titleFromSlug(slug) {
    return String(slug).split(/[-_\s]+/).filter(Boolean).map(function (part) {
      var lower = part.toLowerCase();
      if (KEEP[lower]) return KEEP[lower];
      if (part.length > 1 && part === part.toUpperCase()) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join(" ");
  }

  function knownFor(slug) {
    if (KNOWN[slug]) return KNOWN[slug];
    var lower = String(slug).toLowerCase();
    if (KNOWN[lower]) return KNOWN[lower];
    var key = Object.keys(KNOWN).find(function (k) { return k.toLowerCase() === lower; });
    return key ? KNOWN[key] : null;
  }

  function versionKey(name) {
    var raw = String(name).trim().replace(/^v/i, "");
    var preRank = 9;
    var preNum = 0;
    var match = raw.match(/^(.*?)(?:[-._]?(alpha|beta|preview|pre|rc))(?:[-._]?(\d+))?$/i);
    if (match && match[2]) {
      raw = match[1];
      preRank = PRE[match[2].toLowerCase()] || 3;
      preNum = match[3] ? Number(match[3]) : 0;
    }
    var nums = (raw.match(/\d+/g) || []).map(Number);
    return { nums: nums, preRank: preRank, preNum: preNum, bare: nums.length === 0 };
  }

  function compareVersions(a, b) {
    var ka = versionKey(a);
    var kb = versionKey(b);
    if (ka.bare && kb.bare) return String(a).localeCompare(String(b));
    if (ka.bare) return -1;
    if (kb.bare) return 1;
    var len = Math.max(ka.nums.length, kb.nums.length);
    var i;
    for (i = 0; i < len; i++) {
      var da = ka.nums[i] || 0;
      var db = kb.nums[i] || 0;
      if (da !== db) return da - db;
    }
    if (ka.preRank !== kb.preRank) return ka.preRank - kb.preRank;
    return ka.preNum - kb.preNum;
  }

  function packageKind(name) {
    var lower = String(name).toLowerCase();
    var kinds = [
      ["tar.gz", "tar.gz"], ["tar.xz", "tar.xz"], ["tar.bz2", "tar.bz2"],
      [".tgz", "tar.gz"], [".zip", "zip"], [".7z", "7z"], [".dmg", "dmg"],
      [".exe", "exe"], [".msi", "msi"], [".deb", "deb"], [".rpm", "rpm"],
      [".appimage", "AppImage"], [".flatpak", "flatpak"], [".snap", "snap"],
      [".apk", "apk"], [".pkg", "pkg"]
    ];
    var i;
    for (i = 0; i < kinds.length; i++) {
      if (lower.endsWith(kinds[i][0])) return kinds[i][1];
    }
    return "";
  }

  function isChecksum(name) {
    return /\.(sha256|sha512|sha1|md5|asc|sig)(?:sum)?$/i.test(name);
  }

  function isAsset(name) {
    var base = String(name).split("/").pop();
    if (!base || base.charAt(0) === ".") return false;
    if (/^readme(\.|$)/i.test(base)) return false;
    if (isChecksum(base)) return false;
    return packageKind(base) !== "";
  }

  function platformOf(name) {
    var n = String(name).toLowerCase();
    if (/windows|win64|win32|\bwin\b/.test(n) || /\.exe$/.test(n) || /\.msi$/.test(n)) return "Windows";
    if (/darwin|macos|osx|apple/.test(n) || /\.dmg$/.test(n) || /\.pkg$/.test(n)) return "macOS";
    if (/linux|ubuntu|debian|fedora|archlinux/.test(n) || /\.(appimage|deb|rpm|flatpak)$/.test(n)) return "Linux";
    if (/\bandroid\b/.test(n) || /\.apk$/.test(n)) return "Android";
    return "Any";
  }

  function archOf(name) {
    var n = String(name).toLowerCase();
    if (/aarch64|arm64/.test(n)) return "arm64";
    if (/x86_64|amd64|x64/.test(n)) return "x86_64";
    if (/i686|win32|\bx86\b/.test(n)) return "x86";
    return "";
  }

  function formatBytes(n) {
    if (typeof n !== "number" || !isFinite(n) || n < 0) return "";
    if (n < 1024) return n + " B";
    var units = ["KB", "MB", "GB"];
    var v = n / 1024;
    var i = 0;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i++;
    }
    return (Math.round(v * 10) / 10).toFixed(1) + " " + units[i];
  }

  function safeRelative(path) {
    var parts = String(path).split("/");
    var i;
    for (i = 0; i < parts.length; i++) {
      if (!parts[i] || parts[i] === "." || parts[i] === ".." || parts[i].indexOf("\\") !== -1) return "";
    }
    return parts.map(encodeURIComponent).join("/");
  }

  function describeFile(name, path, size) {
    return {
      name: name,
      path: path,
      href: safeRelative(path),
      size: size || 0,
      platform: platformOf(name),
      arch: archOf(name),
      kind: packageKind(name),
      sums: []
    };
  }

  function parseTree(entries) {
    var bag = new Map();
    (entries || []).forEach(function (entry) {
      if (!entry || entry.type !== "blob" || !entry.path) return;
      var parts = entry.path.split("/");
      if (parts.some(function (p) { return !p || p === "." || p === ".." || p.charAt(0) === "."; })) return;
      if (parts.length < 2) return;
      var slug = parts[0];
      if (SKIP_TOP[slug.toLowerCase()]) return;
      var version = parts.length === 2 ? "files" : parts[1];
      var filePath = parts.length === 2 ? parts[1] : parts.slice(2).join("/");
      var base = filePath.split("/").pop();
      if (!bag.has(slug)) bag.set(slug, new Map());
      var versions = bag.get(slug);
      if (!versions.has(version)) versions.set(version, { name: version, assets: [], sums: [] });
      var slot = versions.get(version);
      if (isChecksum(base)) slot.sums.push({ name: base, path: entry.path, href: safeRelative(entry.path) });
      else if (isAsset(base)) slot.assets.push(describeFile(base, entry.path, entry.size));
    });

    var projects = [];
    bag.forEach(function (versions, slug) {
      var list = [];
      versions.forEach(function (slot) {
        slot.sums.forEach(function (sum) {
          var asset = slot.assets.find(function (a) { return sum.name.indexOf(a.name) === 0; });
          if (asset) asset.sums.push(sum);
        });
        if (!slot.assets.length) return;
        slot.assets.sort(function (a, b) {
          var d = (OS_ORDER[a.platform] - OS_ORDER[b.platform]);
          if (d) return d;
          return a.name.localeCompare(b.name);
        });
        list.push({ name: slot.name, assets: slot.assets });
      });
      if (!list.length) return;
      list.sort(function (a, b) { return compareVersions(b.name, a.name); });
      var info = knownFor(slug) || {};
      var platforms = [];
      list.forEach(function (v) {
        v.assets.forEach(function (a) {
          if (platforms.indexOf(a.platform) === -1) platforms.push(a.platform);
        });
      });
      projects.push({
        slug: slug,
        name: info.name || titleFromSlug(slug),
        blurb: info.blurb || "Packages from this folder. The page picked them up on its own.",
        repo: info.repo || "",
        page: info.page || "",
        image: info.image || "",
        tag: info.tag || "",
        versions: list,
        platforms: platforms,
        updated: ""
      });
    });
    projects.sort(function (a, b) { return a.name.localeCompare(b.name); });
    return projects;
  }

  function hueFor(slug) {
    var palette = [272, 126, 42, 200, 312];
    var h = 0;
    var i;
    for (i = 0; i < slug.length; i++) h = (h * 33 + slug.charCodeAt(i)) >>> 0;
    return palette[h % palette.length];
  }

  function monogram(name) {
    var words = String(name).split(/\s+/).filter(Boolean);
    if (!words.length) return "•";
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }

  function formatDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  function domId(slug) {
    return /^[A-Za-z][\w.-]*$/.test(slug) ? slug : "p-" + Array.prototype.map.call(slug, function (c) {
      return c.charCodeAt(0).toString(16);
    }).join("");
  }

  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value == null || value === false) return;
        if (key === "class") node.className = value;
        else if (key === "text") node.textContent = value;
        else node.setAttribute(key, value);
      });
    }
    (kids || []).forEach(function (kid) { if (kid) node.append(kid); });
    return node;
  }

  function downloadLink(asset, project, version) {
    var bits = ["Download", project.name, version === "files" ? "" : version, "for", asset.platform, asset.arch, asset.kind, formatBytes(asset.size)].filter(Boolean);
    var link = el("a", {
      class: "dl",
      href: asset.href,
      download: asset.name,
      title: asset.name,
      "data-os": asset.platform.toLowerCase(),
      "aria-label": bits.join(" ")
    }, [
      el("span", { class: "os", text: asset.platform + (asset.arch ? " · " + asset.arch : "") }),
      el("span", { class: "spec", text: [asset.kind, formatBytes(asset.size)].filter(Boolean).join(" · ") }),
      el("span", { class: "go", text: "Download" })
    ]);
    if (!asset.sums.length) return link;
    var sum = asset.sums[0];
    return el("div", { class: "pack" }, [
      link,
      el("a", { class: "sum", href: sum.href, text: sum.name.split(".").pop() })
    ]);
  }

  function releaseBlock(project, version, latest) {
    var label = version.name === "files" ? "Files" : version.name;
    var head = el("p", { class: "ver", text: label });
    if (latest) head.append(el("span", { class: "badge", text: "Latest" }));
    var dls = el("div", { class: "dls" });
    version.assets.forEach(function (asset) { dls.append(downloadLink(asset, project, version.name)); });
    return el("div", { class: "release" }, [head, dls]);
  }

  function artFor(project) {
    var box = el("div", { class: "project-art" });
    if (project.image) {
      var img = el("img", { src: project.image, alt: "" });
      img.addEventListener("error", function () {
        box.replaceChildren(sigilFor(project));
      });
      box.append(img);
      return box;
    }
    box.append(sigilFor(project));
    return box;
  }

  function sigilFor(project) {
    var sig = el("div", { class: "sigil" }, [el("span", { text: monogram(project.name) })]);
    sig.style.setProperty("--hue", String(hueFor(project.slug)));
    return sig;
  }

  function projectHay(project) {
    var hay = [project.name, project.slug, project.blurb, project.tag].concat(project.platforms);
    project.versions.forEach(function (v) {
      hay.push(v.name);
      v.assets.forEach(function (a) { hay.push(a.name, a.platform, a.arch, a.kind); });
    });
    return hay.join(" ").toLowerCase();
  }

  function cardFor(project) {
    var card = el("article", {
      class: "project",
      id: domId(project.slug),
      "data-slug": project.slug,
      "data-hay": projectHay(project),
      "data-platforms": project.platforms.map(function (p) { return p.toLowerCase(); }).join(" ")
    });
    var body = el("div", { class: "project-body" });
    var top = el("div");
    var platforms = project.platforms.filter(function (p) { return p !== "Any"; });
    if (project.tag) top.append(el("p", { class: "tag", text: project.tag }));
    else if (platforms.length) top.append(el("p", { class: "tag", text: platforms.join(" · ") }));
    var when = formatDate(project.updated);
    var latest = project.versions[0];
    var kicker = "Latest · " + (latest.name === "files" ? "files" : latest.name);
    if (when) kicker += " · " + when;
    top.append(el("p", { class: "kicker", text: kicker }));
    top.append(el("h2", { text: project.name }));
    top.append(el("p", { class: "blurb", text: project.blurb }));
    var links = el("p", { class: "links" });
    if (project.page) links.append(el("a", { href: project.page, text: "Page ↗" }));
    if (project.repo) links.append(el("a", { href: project.repo, text: "Source ↗" }));
    links.append(el("a", {
      href: "https://github.com/" + OWNER + "/" + REPO + "/tree/main/" + encodeURIComponent(project.slug),
      text: "Files ↗"
    }));
    top.append(links);
    body.append(top);
    body.append(releaseBlock(project, latest, true));
    if (project.versions.length > 1) {
      var older = el("div");
      project.versions.slice(1).forEach(function (v) { older.append(releaseBlock(project, v, false)); });
      var n = project.versions.length - 1;
      body.append(el("details", { class: "earlier" }, [
        el("summary", { text: n === 1 ? "1 earlier build" : n + " earlier builds" }),
        older
      ]));
    }
    card.append(artFor(project), body);
    return card;
  }

  function sortProjects(projects) {
    projects.sort(function (a, b) {
      if (a.updated && b.updated && a.updated !== b.updated) return a.updated < b.updated ? 1 : -1;
      if (a.updated && !b.updated) return -1;
      if (!a.updated && b.updated) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  var state = { projects: [], platform: "All", query: "", pick: "", pickedByUser: false };

  function projectMatches(project) {
    if (state.platform !== "All") {
      var names = project.platforms.map(function (name) { return name.toLowerCase(); });
      if (names.indexOf(state.platform.toLowerCase()) === -1) return false;
    }
    var q = state.query.trim().toLowerCase();
    if (q && projectHay(project).indexOf(q) === -1) return false;
    return true;
  }

  function matchingProjects() {
    return state.projects.filter(projectMatches);
  }

  function ensurePick() {
    var matches = matchingProjects();
    var still = matches.some(function (project) { return project.slug === state.pick; });
    if (!still) state.pick = matches.length ? matches[0].slug : "";
    return matches;
  }

  function setMenuOpen(open) {
    var drop = document.getElementById("release-drop");
    var toggle = document.getElementById("release-toggle");
    if (drop) drop.classList.toggle("is-open", open);
    if (toggle) toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function renderMenu() {
    var menu = document.getElementById("release-menu");
    var toggle = document.getElementById("release-toggle");
    if (!menu) return;
    var matches = ensurePick();
    if (toggle) toggle.textContent = "Releases";
    if (!state.projects.length) {
      menu.replaceChildren(el("li", {}, [el("span", { class: "dropdown-note", text: "Nothing on the shelf yet." })]));
      return;
    }
    if (!matches.length) {
      menu.replaceChildren(el("li", {}, [el("span", { class: "dropdown-note", text: "Nothing matches that." })]));
      return;
    }
    menu.replaceChildren.apply(menu, matches.map(function (project) {
      var on = project.slug === state.pick;
      return el("li", {}, [
        el("button", {
          type: "button",
          role: "menuitem",
          text: project.name,
          "data-slug": project.slug,
          "aria-current": on ? "true" : "false"
        })
      ]);
    }));
  }

  function chooseProject(slug, push) {
    if (!slug) return;
    state.pick = slug;
    state.pickedByUser = true;
    var url = "#" + encodeURIComponent(slug);
    if (push && location.hash !== url) history.pushState(null, "", url);
    else if (location.hash !== url) history.replaceState(null, "", url);
    setMenuOpen(false);
    renderMenu();
    applyFilter();
    var card = document.getElementById(domId(slug));
    if (card && card.scrollIntoView) card.scrollIntoView({ block: "nearest" });
  }

  function pickFromHash() {
    var hash = "";
    try { hash = decodeURIComponent(location.hash.replace(/^#/, "")); }
    catch (err) { hash = location.hash.replace(/^#/, ""); }
    if (!hash) {
      state.pick = "";
      state.pickedByUser = false;
      return;
    }
    var project = state.projects.find(function (item) {
      return item.slug === hash || domId(item.slug) === hash;
    });
    if (project) {
      state.pick = project.slug;
      state.pickedByUser = true;
    }
  }

  function renderStats(projects) {
    var stats = document.getElementById("stats");
    if (!stats) return;
    var packages = 0;
    var platforms = {};
    projects.forEach(function (p) {
      p.versions.forEach(function (v) {
        packages += v.assets.length;
        v.assets.forEach(function (a) { if (a.platform !== "Any") platforms[a.platform] = 1; });
      });
    });
    var names = Object.keys(platforms);
    var cells = [
      [String(projects.length), projects.length === 1 ? "Project" : "Projects"],
      [String(packages), packages === 1 ? "Package" : "Packages"],
      [names.length ? String(names.length) : "—", names.length === 1 ? names[0] : "Platforms"]
    ];
    stats.replaceChildren.apply(stats, cells.map(function (cell) {
      return el("li", {}, [el("strong", { text: cell[0] }), el("span", { text: cell[1] })]);
    }));
  }

  function renderPills(projects) {
    var bar = document.getElementById("pills");
    if (!bar) return;
    var order = ["Linux", "Windows", "macOS", "Android"];
    var have = {};
    projects.forEach(function (p) { p.platforms.forEach(function (name) { have[name] = 1; }); });
    var names = ["All"].concat(order.filter(function (name) { return have[name]; }));
    if (names.indexOf(state.platform) === -1) state.platform = "All";
    bar.replaceChildren.apply(bar, names.map(function (name) {
      return el("button", {
        type: "button",
        text: name,
        "aria-pressed": name === state.platform ? "true" : "false"
      });
    }));
  }

  function renderList() {
    var list = document.getElementById("list");
    if (!list) return;
    sortProjects(state.projects);
    if (!state.projects.length) {
      list.replaceChildren(el("p", { class: "empty", text: "Nothing has been published yet. A project folder with a version and a package will land here." }));
      return;
    }
    list.replaceChildren.apply(list, state.projects.map(cardFor));
  }

  function applyFilter() {
    var list = document.getElementById("list");
    var count = document.getElementById("count");
    if (!list) return;
    ensurePick();
    var shown = 0;
    list.querySelectorAll(".project").forEach(function (card) {
      card.querySelectorAll(".dl").forEach(function (link) {
        var osOk = state.platform === "All" || link.dataset.os === state.platform.toLowerCase();
        link.hidden = !osOk;
      });
      card.querySelectorAll(".release").forEach(function (block) {
        var any = false;
        block.querySelectorAll(".dl").forEach(function (link) { if (!link.hidden) any = true; });
        block.hidden = !any;
      });
      card.querySelectorAll(".earlier").forEach(function (details) {
        var any = false;
        details.querySelectorAll(".release").forEach(function (block) { if (!block.hidden) any = true; });
        details.hidden = !any;
      });
      var visible = !!state.pick && card.dataset.slug === state.pick;
      card.hidden = !visible;
      if (visible) shown++;
    });
    if (count) {
      if (!state.projects.length) count.textContent = "";
      else if (!shown) count.textContent = "Nothing on the shelf matches that.";
      else if (state.query.trim() || state.platform !== "All") {
        var n = matchingProjects().length;
        count.textContent = n + (n === 1 ? " match" : " matches");
      } else {
        var total = state.projects.length;
        count.textContent = total + (total === 1 ? " release. Pick another from the menu." : " releases. Pick another from the menu.");
      }
    }
  }

  function paint(scroll) {
    renderStats(state.projects);
    renderPills(state.projects);
    renderList();
    if (scroll) pickFromHash();
    renderMenu();
    applyFilter();
    var shelf = document.getElementById("shelf");
    if (shelf) shelf.setAttribute("aria-busy", "false");
    document.documentElement.dataset.ready = "1";
    if (!scroll) return;
    var hash = location.hash.replace(/^#/, "");
    if (!hash) return;
    var target = document.getElementById(decodeURIComponent(hash));
    if (target && target.scrollIntoView) target.scrollIntoView();
  }

  function refreshDates() {
    var before = state.projects.map(function (project) { return project.slug; }).join("|");
    sortProjects(state.projects);
    var after = state.projects.map(function (project) { return project.slug; }).join("|");
    if (before !== after) {
      if (!state.pickedByUser) state.pick = "";
      paint(false);
      return;
    }
    state.projects.forEach(function (project) {
      var card = document.getElementById(domId(project.slug));
      var kicker = card && card.querySelector(".kicker");
      if (!kicker) return;
      var latest = project.versions[0];
      var text = "Latest · " + (latest.name === "files" ? "files" : latest.name);
      var when = formatDate(project.updated);
      if (when) text += " · " + when;
      kicker.textContent = text;
    });
  }

  function showError(message) {
    var list = document.getElementById("list");
    var count = document.getElementById("count");
    if (count) count.textContent = "The shelf could not be read just now.";
    if (!list) return;
    var retry = el("button", { class: "btn", type: "button", text: "Try again" });
    retry.addEventListener("click", load);
    list.replaceChildren(el("div", { class: "miss" }, [
      el("p", { class: "kicker", text: "GitHub" }),
      el("h2", { text: "The shelf did not answer." }),
      el("p", { text: message }),
      el("p", {}, [el("a", { href: "https://github.com/" + OWNER + "/" + REPO, text: "Open the repository ↗" })]),
      retry
    ]));
    var shelf = document.getElementById("shelf");
    if (shelf) shelf.setAttribute("aria-busy", "false");
    document.documentElement.dataset.ready = "error";
  }

  function readDateCache() {
    try {
      var raw = sessionStorage.getItem(DATE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !data.dates || Date.now() - data.at > 30 * 60 * 1000) return null;
      return data.dates;
    } catch (err) {
      return null;
    }
  }

  function writeDateCache(dates) {
    try {
      sessionStorage.setItem(DATE_KEY, JSON.stringify({ at: Date.now(), dates: dates }));
    } catch (err) { /* private mode */ }
  }

  function applyDates(dates) {
    var changed = false;
    state.projects.forEach(function (project) {
      var iso = dates[project.slug];
      if (iso && project.updated !== iso) {
        project.updated = iso;
        changed = true;
      }
    });
    return changed;
  }

  async function loadDates(slugs) {
    var dates = {};
    await Promise.all(slugs.map(async function (slug) {
      var url = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/commits?path=" + encodeURIComponent(slug) + "&per_page=1";
      var res = await fetch(url, { headers: GH });
      if (!res.ok) return;
      var data = await res.json();
      var commit = data[0] && data[0].commit;
      var who = commit && (commit.committer || commit.author);
      if (who && who.date) dates[slug] = who.date;
    }));
    return dates;
  }

  async function load() {
    var count = document.getElementById("count");
    var shelf = document.getElementById("shelf");
    if (count) count.textContent = "Reading the repository…";
    if (shelf) shelf.setAttribute("aria-busy", "true");
    document.documentElement.dataset.ready = "";
    var res;
    try {
      res = await fetch(TREE_URL, { headers: GH });
    } catch (err) {
      showError("The browser could not reach GitHub. The packages are still in the repository.");
      return;
    }
    if (!res.ok) {
      showError(res.status === 403
        ? "GitHub asked this browser to wait. The packages are still in the repository."
        : "GitHub answered " + res.status + ". The packages are still in the repository.");
      return;
    }
    var body = await res.json();
    state.projects = parseTree(body.tree || []);
    var cached = readDateCache();
    if (cached) applyDates(cached);
    var note = document.getElementById("colophon");
    if (note) {
      note.textContent = body.truncated
        ? "GitHub sent a partial tree. Some folders may be missing until the next visit."
        : "Read from " + OWNER + "/" + REPO + ". Drop in a project folder and it joins this shelf.";
    }
    paint(true);
    try {
      var dates = await loadDates(state.projects.map(function (p) { return p.slug; }));
      if (Object.keys(dates).length) {
        writeDateCache(Object.assign({}, cached || {}, dates));
        if (applyDates(dates)) refreshDates();
      }
    } catch (err) { /* dates are optional */ }
  }

  function mount() {
    var input = document.getElementById("q");
    var pills = document.getElementById("pills");
    var toggle = document.getElementById("release-toggle");
    var menu = document.getElementById("release-menu");
    if (input) {
      input.addEventListener("input", function () {
        state.query = input.value;
        renderMenu();
        applyFilter();
      });
    }
    if (pills) {
      pills.addEventListener("click", function (event) {
        var button = event.target.closest("button");
        if (!button) return;
        state.platform = button.textContent;
        pills.querySelectorAll("button").forEach(function (other) {
          other.setAttribute("aria-pressed", other === button ? "true" : "false");
        });
        renderMenu();
        applyFilter();
      });
    }
    if (toggle) {
      toggle.addEventListener("click", function (event) {
        event.stopPropagation();
        var drop = document.getElementById("release-drop");
        setMenuOpen(!(drop && drop.classList.contains("is-open")));
      });
    }
    if (menu) {
      menu.addEventListener("click", function (event) {
        var button = event.target.closest("button");
        if (!button || !button.dataset.slug) return;
        chooseProject(button.dataset.slug, true);
      });
    }
    document.addEventListener("click", function (event) {
      if (!event.target.closest("#release-drop")) setMenuOpen(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setMenuOpen(false);
    });
    window.addEventListener("hashchange", function () {
      pickFromHash();
      renderMenu();
      applyFilter();
    });
    load();
  }

  root.ReleasesShelf = {
    parseTree: parseTree,
    compareVersions: compareVersions,
    titleFromSlug: titleFromSlug,
    platformOf: platformOf,
    archOf: archOf,
    formatBytes: formatBytes,
    packageKind: packageKind,
    knownFor: knownFor
  };

  if (root.document) {
    if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", mount);
    else mount();
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
