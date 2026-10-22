/* ============================================================
   JKP · Options UI v2.3.2
   独立设置页逻辑：读/写 chrome.storage.local "preferences"
   ============================================================ */
(function () {
  "use strict";

  var STORAGE_KEY = "preferences";
  var TOKENS = [
    { id: "Creator", labelKey: "options_videoCreator", fallback: "作者" },
    { id: "Description", labelKey: "options_videoDescription", fallback: "描述" },
    { id: "Tag", labelKey: "", fallback: "标签" },
    { id: "Resolution", labelKey: "options_videoResolution", fallback: "分辨率" },
    { id: "Vid", labelKey: "options_videoVid", fallback: "视频ID" }
  ];
  var QUALITIES = [
    { id: "HighestResolution", labelKey: "options_videoHighestResolution", fallback: "最高分辨率" },
    { id: "HighestBitrate", labelKey: "options_videoHighestBitrate", fallback: "最高码率" },
    { id: "LargestFileSize", labelKey: "options_videoLargestFileSize", fallback: "最大文件大小" }
  ];
  var TOKEN_IDS = TOKENS.map(function (item) { return item.id; });
  var QUALITY_IDS = QUALITIES.map(function (item) { return item.id; });

  var DEFAULT_PREFERENCES = {
    videoFileName: {
      scheme: ["Creator", "Description", "Resolution"],
      creatorWithAt: true,
      descriptionWithHashtag: false
    },
    videoQuality: "HighestResolution",
    enableSubdirectory: true,
    subdirectory: "douyin",
    snackbarTip: {
      parseVideo: true,
      startDownload: true,
      completeDownload: true
    },
    fileNameLogic: "primary"
  };

  var SAMPLE = {
    creator: "伐浩",
    description: "这是视频描述 #旅行 #美食",
    resolution: "1080P",
    vid: "7312345678901234567"
  };

  var ILLEGAL_SUBDIR = /[<>:"/\\|?*\n]+/g;
  var VIEW_LABELS = { home: "概览", settings: "设置", help: "帮助" };

  var ext = (typeof browser !== "undefined" && browser && browser.runtime && browser.runtime.id)
    ? browser
    : (typeof chrome !== "undefined" && chrome && chrome.runtime ? chrome : null);

  var state = normalizePreferences(null);
  var lastSaved = JSON.stringify(state);
  var activeView = "home";
  var dom = {};

  /* ---------------- 纯函数（可测试） ---------------- */

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function t(key, fallback) {
    try {
      if (ext && ext.i18n && typeof ext.i18n.getMessage === "function") {
        var message = ext.i18n.getMessage(key);
        if (message) return message;
      }
    } catch (error) {
      /* ignore i18n failures */
    }
    return fallback;
  }

  function boolOr(value, fallback) {
    return typeof value === "boolean" ? value : fallback;
  }

  function unique(list) {
    var seen = Object.create(null);
    return list.filter(function (item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }

  function normalizePreferences(raw) {
    var defaults = clone(DEFAULT_PREFERENCES);
    if (!raw || typeof raw !== "object") return defaults;

    var videoFileName = raw.videoFileName && typeof raw.videoFileName === "object" ? raw.videoFileName : {};
    var scheme = Array.isArray(videoFileName.scheme)
      ? unique(videoFileName.scheme.filter(function (id) {
          return typeof id === "string" && TOKEN_IDS.indexOf(id) !== -1;
        }))
      : defaults.videoFileName.scheme.slice();

    var snackbarTip = raw.snackbarTip && typeof raw.snackbarTip === "object" ? raw.snackbarTip : {};

    return {
      videoFileName: {
        scheme: scheme,
        creatorWithAt: boolOr(videoFileName.creatorWithAt, defaults.videoFileName.creatorWithAt),
        descriptionWithHashtag: boolOr(videoFileName.descriptionWithHashtag, defaults.videoFileName.descriptionWithHashtag)
      },
      videoQuality: QUALITY_IDS.indexOf(raw.videoQuality) !== -1 ? raw.videoQuality : defaults.videoQuality,
      enableSubdirectory: boolOr(raw.enableSubdirectory, defaults.enableSubdirectory),
      subdirectory: typeof raw.subdirectory === "string" ? raw.subdirectory : defaults.subdirectory,
      snackbarTip: {
        parseVideo: boolOr(snackbarTip.parseVideo, true),
        startDownload: boolOr(snackbarTip.startDownload, true),
        completeDownload: boolOr(snackbarTip.completeDownload, true)
      },
      fileNameLogic: raw.fileNameLogic === "backup" ? "backup" : "primary"
    };
  }

  function validatePreferences(prefs) {
    var scheme = prefs && prefs.videoFileName && prefs.videoFileName.scheme;
    if (!Array.isArray(scheme) || scheme.length === 0) {
      return {
        ok: false,
        field: "scheme",
        message: t("options.videoFileNameEmpty", "视频文件名不能为空，请至少选择一项")
      };
    }
    if (prefs.enableSubdirectory) {
      var subdirectory = String(prefs.subdirectory || "").trim();
      if (!subdirectory) {
        return {
          ok: false,
          field: "subdirectory",
          message: t("options.subdirectoryEmpty", "子目录不能为空")
        };
      }
      ILLEGAL_SUBDIR.lastIndex = 0;
      if (ILLEGAL_SUBDIR.test(subdirectory)) {
        return {
          ok: false,
          field: "subdirectory",
          message: t("options.subdirectoryIllegal", "子目录包含非法字符")
        };
      }
    }
    return { ok: true, field: "", message: "" };
  }

  function tokenLabel(id) {
    for (var i = 0; i < TOKENS.length; i += 1) {
      if (TOKENS[i].id === id) {
        return TOKENS[i].labelKey ? t(TOKENS[i].labelKey, TOKENS[i].fallback) : TOKENS[i].fallback;
      }
    }
    return id;
  }

  function qualityLabel(id) {
    for (var i = 0; i < QUALITIES.length; i += 1) {
      if (QUALITIES[i].id === id) return t(QUALITIES[i].labelKey, QUALITIES[i].fallback);
    }
    return id;
  }

  function buildPreview(prefs, sample) {
    var data = sample || SAMPLE;
    var parts = [];
    var file = prefs.videoFileName;
    var scheme = Array.isArray(file.scheme) ? file.scheme : [];

    scheme.forEach(function (id) {
      if (id === "Creator") {
        if (data.creator) parts.push((file.creatorWithAt ? "@" : "") + data.creator);
        return;
      }
      if (id === "Description") {
        var description = data.description || "";
        if (!file.descriptionWithHashtag) {
          description = description.replace(/#[^\s#]+/g, "").replace(/\s+/g, " ").trim();
        }
        if (description) parts.push(description);
        return;
      }
      if (id === "Tag") {
        var tags = unique((String(data.description || "").match(/#[^\s#]+/g) || []));
        if (tags.length > 0) parts.push(tags.join(" "));
        return;
      }
      if (id === "Resolution") {
        if (data.resolution) parts.push(data.resolution);
        return;
      }
      if (id === "Vid") {
        if (data.vid) parts.push(String(data.vid));
      }
    });

    var fileName = (parts.join(" ") || "未选择文件名属性") + ".mp4";
    var directory = String(prefs.subdirectory || "").trim().replace(/^[\\/]+|[\\/]+$/g, "");
    var relativePath = prefs.enableSubdirectory && directory ? directory + "/" + fileName : fileName;

    return { fileName: fileName, relativePath: relativePath };
  }

  /* ---------------- 存储 ---------------- */

  function readPreferences() {
    return new Promise(function (resolve) {
      if (!ext || !ext.storage || !ext.storage.local) return resolve({});
      var settled = false;
      function done(result) {
        if (settled) return;
        settled = true;
        resolve(result || {});
      }
      try {
        var maybe = ext.storage.local.get([STORAGE_KEY], done);
        if (maybe && typeof maybe.then === "function") {
          maybe.then(done).catch(function () { done({}); });
        }
      } catch (error) {
        done({});
      }
    });
  }

  function writePreferences(value) {
    return new Promise(function (resolve) {
      if (!ext || !ext.storage || !ext.storage.local) return resolve(false);
      var settled = false;
      function succeed() {
        if (settled) return;
        settled = true;
        resolve(true);
      }
      function fail() {
        if (settled) return;
        settled = true;
        resolve(false);
      }
      try {
        var payload = {};
        payload[STORAGE_KEY] = value;
        var maybe = ext.storage.local.set(payload, function () {
          try {
            if (ext.runtime && ext.runtime.lastError) return fail();
          } catch (error) {
            /* lastError access is best-effort */
          }
          succeed();
        });
        if (maybe && typeof maybe.then === "function") {
          maybe.then(succeed).catch(fail);
        }
      } catch (error) {
        fail();
      }
    });
  }

  /* ---------------- DOM 渲染 ---------------- */

  function $(id) {
    return document.getElementById(id);
  }

  function applyI18n() {
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i += 1) {
      var key = nodes[i].getAttribute("data-i18n");
      if (!key) continue;
      var translated = t(key, nodes[i].textContent);
      if (translated) nodes[i].textContent = translated;
    }
  }

  function applyVersion() {
    var version = "";
    try {
      version = (ext && ext.runtime && ext.runtime.getManifest && ext.runtime.getManifest().version) || "";
    } catch (error) {
      version = "";
    }
    var label = version ? "v" + version : "v2.3.2";
    var nodes = document.querySelectorAll("[data-version]");
    for (var i = 0; i < nodes.length; i += 1) nodes[i].textContent = label;
    var textNodes = document.querySelectorAll("[data-version-text]");
    for (var j = 0; j < textNodes.length; j += 1) textNodes[j].textContent = version || "2.3.2";
  }

  function applyLocale() {
    var chip = dom.localeChip;
    if (!chip) return;
    var language = "";
    try {
      language = (ext && ext.i18n && ext.i18n.getUILanguage && ext.i18n.getUILanguage()) || navigator.language || "";
    } catch (error) {
      language = "";
    }
    var lower = String(language).toLowerCase();
    var label = "简体中文";
    if (lower.indexOf("zh-tw") === 0 || lower.indexOf("zh-hk") === 0) label = "繁體中文";
    else if (lower.indexOf("zh") === 0) label = "简体中文";
    else if (lower.indexOf("en") === 0) label = "English";
    else if (lower.indexOf("ja") === 0) label = "日本語";
    else if (lower.indexOf("ko") === 0) label = "한국어";
    else if (lower.indexOf("fr") === 0) label = "Français";
    else if (lower.indexOf("es") === 0) label = "Español";
    else if (lower.indexOf("pt") === 0) label = "Português";
    else if (lower.indexOf("id") === 0) label = "Indonesia";
    else if (lower.indexOf("vi") === 0) label = "Tiếng Việt";
    else if (language) label = language;
    chip.textContent = label;
  }

  function makeIconButton(action, glyph, label, index, disabled) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "icon-btn";
    button.textContent = glyph;
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    button.dataset.action = action;
    button.dataset.index = String(index);
    if (disabled) button.disabled = true;
    return button;
  }

  function renderScheme() {
    if (!dom.schemeList) return;
    dom.schemeList.textContent = "";

    var scheme = state.videoFileName.scheme;
    if (scheme.length === 0) {
      var empty = document.createElement("span");
      empty.className = "scheme-empty";
      empty.textContent = "至少保留一个文件名属性";
      dom.schemeList.appendChild(empty);
    }

    scheme.forEach(function (id, index) {
      var chip = document.createElement("div");
      chip.className = "token-chip";

      var order = document.createElement("span");
      order.className = "token-index";
      order.textContent = String(index + 1);

      var label = document.createElement("span");
      label.className = "token-label";
      label.textContent = tokenLabel(id);

      var actions = document.createElement("span");
      actions.className = "token-actions";
      actions.appendChild(makeIconButton("up", "↑", "上移", index, index === 0));
      actions.appendChild(makeIconButton("down", "↓", "下移", index, index === scheme.length - 1));
      actions.appendChild(makeIconButton("remove", "×", "移除", index, false));

      chip.appendChild(order);
      chip.appendChild(label);
      chip.appendChild(actions);
      dom.schemeList.appendChild(chip);
    });

    renderSchemeOptions();
  }

  function renderSchemeOptions() {
    var select = dom.schemeAdd;
    var button = dom.schemeAddBtn;
    if (!select || !button) return;

    var used = Object.create(null);
    state.videoFileName.scheme.forEach(function (id) { used[id] = true; });
    var available = TOKENS.filter(function (item) { return !used[item.id]; });

    select.textContent = "";
    if (available.length === 0) {
      var option = document.createElement("option");
      option.value = "";
      option.textContent = "全部属性已添加";
      option.disabled = true;
      select.appendChild(option);
      select.disabled = true;
      button.disabled = true;
      return;
    }

    available.forEach(function (item) {
      var option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.labelKey ? t(item.labelKey, item.fallback) : item.fallback;
      select.appendChild(option);
    });
    select.disabled = false;
    button.disabled = false;
  }

  function renderPreviews() {
    var preview = buildPreview(state);

    if (dom.previewName) {
      dom.previewName.textContent = state.videoFileName.scheme.length > 0 ? preview.fileName : "—";
    }
    if (dom.previewPath) {
      dom.previewPath.textContent = state.videoFileName.scheme.length > 0 ? preview.relativePath : "—";
    }

    if (dom.homeScheme) {
      dom.homeScheme.textContent = state.videoFileName.scheme.length > 0
        ? state.videoFileName.scheme.map(tokenLabel).join(" · ")
        : "未设置";
    }
    if (dom.homeQuality) dom.homeQuality.textContent = qualityLabel(state.videoQuality);
    if (dom.homeDir) {
      var directory = String(state.subdirectory || "").trim().replace(/^[\\/]+|[\\/]+$/g, "");
      dom.homeDir.textContent = state.enableSubdirectory && directory ? directory + "/" : "系统下载目录";
    }
  }

  function renderSubdirState() {
    if (!dom.subdirField) return;
    var enabled = state.enableSubdirectory;
    dom.subdirField.classList.toggle("is-disabled", !enabled);
    if (dom.subdirInput) dom.subdirInput.disabled = !enabled;
    validateSubdirectoryLive();
  }

  function validateSubdirectoryLive() {
    if (!dom.subdirInput || !dom.subdirHint) return;
    var value = String(state.subdirectory || "");
    var message = t("options.subdirectoryNameTip", "指定子目录名称");
    var invalid = false;

    if (state.enableSubdirectory) {
      if (!value.trim()) {
        message = t("options.subdirectoryEmpty", "子目录不能为空");
        invalid = true;
      } else {
        ILLEGAL_SUBDIR.lastIndex = 0;
        if (ILLEGAL_SUBDIR.test(value)) {
          message = t("options.subdirectoryIllegal", "子目录包含非法字符");
          invalid = true;
        }
      }
    }

    dom.subdirHint.textContent = message;
    dom.subdirHint.classList.toggle("is-error", invalid);
    dom.subdirInput.classList.toggle("is-invalid", invalid);
  }

  function syncControls() {
    if (dom.creatorAt) dom.creatorAt.checked = state.videoFileName.creatorWithAt;
    if (dom.descriptionHashtag) dom.descriptionHashtag.checked = state.videoFileName.descriptionWithHashtag;
    if (dom.enableSubdir) dom.enableSubdir.checked = state.enableSubdirectory;
    if (dom.subdirInput) dom.subdirInput.value = state.subdirectory;
    if (dom.tipParse) dom.tipParse.checked = state.snackbarTip.parseVideo;
    if (dom.tipStart) dom.tipStart.checked = state.snackbarTip.startDownload;
    if (dom.tipComplete) dom.tipComplete.checked = state.snackbarTip.completeDownload;

    var quality = document.querySelector('input[name="quality"][value="' + state.videoQuality + '"]');
    if (quality) quality.checked = true;
    var logic = document.querySelector('input[name="logic"][value="' + state.fileNameLogic + '"]');
    if (logic) logic.checked = true;
  }

  function updateStatus(mode) {
    var dirty = JSON.stringify(state) !== lastSaved;
    if (dom.saveStatus) {
      dom.saveStatus.classList.toggle("is-dirty", dirty);
      dom.saveStatus.classList.toggle("is-saving", mode === "saving");
      var text = dom.saveStatus.querySelector("#save-status") || dom.saveStatus;
      if (mode === "saving") text.textContent = "保存中…";
      else text.textContent = dirty ? "有未保存的更改" : t("options.saveSuccess", "已保存");
    }
    if (dom.saveBtn) dom.saveBtn.disabled = mode === "saving" ? true : !dirty;
    return dirty;
  }

  function markDirty() {
    renderPreviews();
    renderSubdirState();
    updateStatus();
  }

  function renderAll() {
    applyVersion();
    applyLocale();
    syncControls();
    renderScheme();
    renderSubdirState();
    renderPreviews();
    updateStatus();
  }

  /* ---------------- Toast ---------------- */

  function toast(message, type) {
    if (!dom.toasts || !message) return;
    var el = document.createElement("div");
    el.className = "toast toast-" + (type || "info");
    el.textContent = message;
    dom.toasts.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("show"); });
    setTimeout(function () {
      el.classList.remove("show");
      setTimeout(function () { el.remove(); }, 220);
    }, 2600);
  }

  /* ---------------- 视图切换 ---------------- */

  function switchView(view, options) {
    if (!VIEW_LABELS[view]) view = "home";
    activeView = view;
    var navItems = document.querySelectorAll(".nav-item");
    for (var i = 0; i < navItems.length; i += 1) {
      navItems[i].classList.toggle("is-active", navItems[i].dataset.view === view);
    }
    var views = document.querySelectorAll(".view");
    for (var j = 0; j < views.length; j += 1) {
      var isTarget = views[j].id === "view-" + view;
      views[j].hidden = !isTarget;
      views[j].classList.toggle("is-active", isTarget);
    }
    if (dom.crumb) dom.crumb.textContent = VIEW_LABELS[view];
    if (view !== "settings" && dom.search && dom.search.value) {
      dom.search.value = "";
      filterSettings("");
    }
    if (!options || options.updateHash !== false) {
      try {
        if (view === "home") history.replaceState(null, "", location.pathname + location.search);
        else history.replaceState(null, "", "#" + view);
      } catch (error) {
        /* ignore */
      }
    }
    if (!options || options.scroll !== false) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------------- 搜索 ---------------- */

  function filterSettings(query) {
    var cards = document.querySelectorAll("#settings-list .setting");
    var keyword = String(query || "").trim().toLowerCase();
    var visible = 0;
    for (var i = 0; i < cards.length; i += 1) {
      var card = cards[i];
      var haystack = (card.dataset.search || "") + " " + (card.textContent || "");
      var match = !keyword || haystack.toLowerCase().indexOf(keyword) !== -1;
      card.hidden = !match;
      if (match) visible += 1;
    }
    if (dom.settingsEmpty) dom.settingsEmpty.hidden = !keyword || visible > 0;
  }

  function handleSearchInput() {
    var value = dom.search ? dom.search.value : "";
    if (value.trim() && activeView !== "settings") switchView("settings", { updateHash: true, scroll: false });
    if (!value.trim() && activeView !== "settings") return;
    filterSettings(value);
  }

  /* ---------------- 保存 ---------------- */

  function handleSave() {
    var result = validatePreferences(state);
    if (!result.ok) {
      toast(result.message, "error");
      if (result.field === "scheme" && dom.schemeList) {
        dom.schemeList.classList.add("is-invalid");
        setTimeout(function () { dom.schemeList.classList.remove("is-invalid"); }, 1200);
      }
      if (result.field === "subdirectory" && dom.subdirInput) dom.subdirInput.focus();
      return;
    }

    updateStatus("saving");
    var payload = clone(state);
    payload.subdirectory = payload.subdirectory.trim();

    writePreferences(payload).then(function (ok) {
      if (!ok) {
        toast("保存失败，请重试", "error");
        updateStatus();
        return;
      }
      state = normalizePreferences(payload);
      lastSaved = JSON.stringify(state);
      syncControls();
      renderPreviews();
      renderSubdirState();
      updateStatus();
      toast(t("options.saveSuccess", "保存成功"), "success");
    });
  }

  function handleReset() {
    state = clone(DEFAULT_PREFERENCES);
    renderAll();
    toast("已恢复默认值，点击保存后生效", "info");
  }

  /* ---------------- 事件绑定 ---------------- */

  function bindEvents() {
    var navItems = document.querySelectorAll(".nav-item");
    for (var i = 0; i < navItems.length; i += 1) {
      navItems[i].addEventListener("click", function () {
        switchView(this.dataset.view);
      });
    }

    var gotoButtons = document.querySelectorAll("[data-goto]");
    for (var j = 0; j < gotoButtons.length; j += 1) {
      gotoButtons[j].addEventListener("click", function () {
        switchView(this.dataset.goto);
      });
    }

    if (dom.creatorAt) dom.creatorAt.addEventListener("change", function () {
      state.videoFileName.creatorWithAt = this.checked;
      markDirty();
    });
    if (dom.descriptionHashtag) dom.descriptionHashtag.addEventListener("change", function () {
      state.videoFileName.descriptionWithHashtag = this.checked;
      markDirty();
    });
    if (dom.enableSubdir) dom.enableSubdir.addEventListener("change", function () {
      state.enableSubdirectory = this.checked;
      markDirty();
    });
    if (dom.subdirInput) dom.subdirInput.addEventListener("input", function () {
      state.subdirectory = this.value;
      markDirty();
    });
    if (dom.tipParse) dom.tipParse.addEventListener("change", function () {
      state.snackbarTip.parseVideo = this.checked;
      markDirty();
    });
    if (dom.tipStart) dom.tipStart.addEventListener("change", function () {
      state.snackbarTip.startDownload = this.checked;
      markDirty();
    });
    if (dom.tipComplete) dom.tipComplete.addEventListener("change", function () {
      state.snackbarTip.completeDownload = this.checked;
      markDirty();
    });

    var qualityRadios = document.querySelectorAll('input[name="quality"]');
    for (var k = 0; k < qualityRadios.length; k += 1) {
      qualityRadios[k].addEventListener("change", function () {
        if (!this.checked) return;
        state.videoQuality = this.value;
        markDirty();
      });
    }

    var logicRadios = document.querySelectorAll('input[name="logic"]');
    for (var q = 0; q < logicRadios.length; q += 1) {
      logicRadios[q].addEventListener("change", function () {
        if (!this.checked) return;
        state.fileNameLogic = this.value;
        markDirty();
      });
    }

    if (dom.schemeList) {
      dom.schemeList.addEventListener("click", function (event) {
        var button = event.target.closest("button[data-action]");
        if (!button) return;
        var index = Number(button.dataset.index);
        var action = button.dataset.action;
        if (action === "remove") {
          state.videoFileName.scheme.splice(index, 1);
        } else if (action === "up" && index > 0) {
          var previous = state.videoFileName.scheme[index - 1];
          state.videoFileName.scheme[index - 1] = state.videoFileName.scheme[index];
          state.videoFileName.scheme[index] = previous;
        } else if (action === "down" && index < state.videoFileName.scheme.length - 1) {
          var next = state.videoFileName.scheme[index + 1];
          state.videoFileName.scheme[index + 1] = state.videoFileName.scheme[index];
          state.videoFileName.scheme[index] = next;
        } else {
          return;
        }
        renderScheme();
        markDirty();
      });
    }

    if (dom.schemeAddBtn) {
      dom.schemeAddBtn.addEventListener("click", function () {
        var id = dom.schemeAdd ? dom.schemeAdd.value : "";
        if (!id || state.videoFileName.scheme.indexOf(id) !== -1) return;
        state.videoFileName.scheme.push(id);
        renderScheme();
        markDirty();
      });
    }

    if (dom.search) {
      dom.search.addEventListener("input", handleSearchInput);
      dom.search.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          dom.search.value = "";
          filterSettings("");
          dom.search.blur();
        }
      });
    }

    if (dom.saveBtn) dom.saveBtn.addEventListener("click", handleSave);
    if (dom.resetBtn) dom.resetBtn.addEventListener("click", handleReset);

    document.addEventListener("keydown", function (event) {
      var key = String(event.key || "").toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "s") {
        event.preventDefault();
        if (activeView === "settings") handleSave();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && key === "k") {
        event.preventDefault();
        if (dom.search) {
          try { switchView("settings", { updateHash: true, scroll: false }); } catch (error) { /* ignore */ }
          dom.search.focus();
          dom.search.select();
        }
      }
    });

    window.addEventListener("beforeunload", function (event) {
      if (JSON.stringify(state) !== lastSaved) {
        event.preventDefault();
        event.returnValue = "";
      }
    });
  }

  /* ---------------- 初始化 ---------------- */

  function cacheDom() {
    dom.crumb = $("crumb");
    dom.search = $("search");
    dom.localeChip = $("locale-chip");
    dom.toasts = $("toasts");
    dom.schemeList = $("scheme-list");
    dom.schemeAdd = $("scheme-add");
    dom.schemeAddBtn = $("scheme-add-btn");
    dom.previewName = $("preview-name");
    dom.previewPath = $("preview-path");
    dom.creatorAt = $("opt-creator-at");
    dom.descriptionHashtag = $("opt-description-hashtag");
    dom.enableSubdir = $("opt-enable-subdir");
    dom.subdirField = $("subdir-field");
    dom.subdirInput = $("opt-subdir");
    dom.subdirHint = $("subdir-hint");
    dom.tipParse = $("opt-tip-parse");
    dom.tipStart = $("opt-tip-start");
    dom.tipComplete = $("opt-tip-complete");
    dom.saveStatus = document.querySelector(".save-status");
    dom.saveBtn = $("btn-save");
    dom.resetBtn = $("btn-reset");
    dom.settingsEmpty = $("settings-empty");
    dom.homeScheme = $("home-scheme");
    dom.homeQuality = $("home-quality");
    dom.homeDir = $("home-dir");
  }

  function initialView() {
    var hash = String(location.hash || "").replace(/^#/, "");
    return VIEW_LABELS[hash] ? hash : "home";
  }

  function init() {
    cacheDom();
    applyVersion();
    applyI18n();
    applyLocale();
    bindEvents();

    document.title = t("options.pageTitle", "抖音视频下载器") + " · 设置";
    switchView(initialView(), { updateHash: false, scroll: false });

    readPreferences().then(function (result) {
      state = normalizePreferences(result[STORAGE_KEY]);
      lastSaved = JSON.stringify(state);
      renderAll();
      filterSettings("");
    });
  }

  /* ---------------- 测试钩子 ---------------- */
  var api = {
    DEFAULT_PREFERENCES: DEFAULT_PREFERENCES,
    TOKENS: TOKENS,
    QUALITIES: QUALITIES,
    normalizePreferences: normalizePreferences,
    validatePreferences: validatePreferences,
    buildPreview: buildPreview,
    tokenLabel: tokenLabel
  };
  if (typeof window !== "undefined") {
    window.__JKP_OPTIONS__ = api;
  }

  if (typeof document !== "undefined" && document.getElementById("jkp-app")) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
      init();
    }
  }
})();
