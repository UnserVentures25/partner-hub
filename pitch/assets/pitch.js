(function () {
  var doc = document.documentElement;
  doc.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NAV = 68;
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var absTop = function (el) { return el.getBoundingClientRect().top + window.scrollY; };

  // Staffelung für Mikro-Animationen
  document.querySelectorAll(".scard, .how-screen").forEach(function (c) {
    c.querySelectorAll(".st").forEach(function (el, i) { el.style.setProperty("--i", i); });
    c.querySelectorAll(".progress i, .scale.seq i").forEach(function (el, i) { el.style.setProperty("--k", i); });
  });

  // Einblenden beim Scrollen
  var items = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  // Kennzahlen zählen hoch
  var counters = document.querySelectorAll("[data-count]");
  var runCount = function (el) {
    var target = +el.getAttribute("data-count");
    if (reduce || target === 0) { el.textContent = target; return; }
    var t0 = null;
    var step = function (t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / 1400);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { if (+el.getAttribute("data-count") > 0) el.textContent = "0"; co.observe(el); });
  }

  // Hero: die zwei Telefone drehen sich beim Scrollen auf
  var pair = document.querySelector(".stage3d .pair");
  if (pair && !reduce) {
    var back = pair.querySelector(".back"), front = pair.querySelector(".front");
    var heroTilt = function () {
      var p = clamp(window.scrollY / 700, 0, 1);
      back.style.transform = "translate3d(0," + (-20 - p * 30) + "px," + (-160 + p * 60) + "px) rotateY(" + (24 - p * 14) + "deg) rotateZ(" + (-3 + p * 2) + "deg)";
      front.style.transform = "translate3d(0," + (-p * 40) + "px,0) rotateY(" + (-14 + p * 10) + "deg) rotateZ(" + (1.5 - p) + "deg)";
    };
  }

  // Seitlicher Slider der sechs Bildschirme
  var hs = document.querySelector(".hs");
  var hsCards = [], hsTabs = [], hsTrack, hsView, hsBar, hsCount, pinned = false, hsActive = -1;
  var pinMQ = window.matchMedia("(min-width: 1081px)");
  var hsSetActive = function (i) {
    if (i === hsActive) return;
    hsActive = i;
    hsCards.forEach(function (c, k) { c.classList.toggle("active", k === i); });
    hsTabs.forEach(function (t, k) { t.classList.toggle("on", k === i); t.setAttribute("aria-selected", k === i); });
    hsCount.textContent = pad(i + 1) + " / " + pad(hsCards.length);
  };
  var hsSpan = function () { return hs.offsetHeight - (window.innerHeight - NAV); };
  var hsTarget = function (i) { return absTop(hs) - NAV + (hsSpan() * i) / (hsCards.length - 1); };
  var hsFit = function () {
    if (!pinned) {
      hsCards.forEach(function (c) { c.querySelector(".body").style.zoom = ""; });
      return;
    }
    var h = hsCards[0].clientHeight;
    hs.style.setProperty("--ps", clamp((h - 40) / 620, 0.6, 1).toFixed(3));
    hsCards.forEach(function (c) {
      var b = c.querySelector(".body");
      b.style.zoom = "";
      var need = b.scrollHeight;
      if (need > h) b.style.zoom = (h / need).toFixed(3);
    });
  };
  var hsUpdate = function () {
    if (!hs) return;
    if (pinned) {
      var p = clamp((window.scrollY - (absTop(hs) - NAV)) / hsSpan(), 0, 1);
      var cs = getComputedStyle(hsView);
      var visible = hsView.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      var shift = Math.max(0, hsTrack.scrollWidth - visible);
      hsTrack.style.transform = "translate3d(" + (-p * shift) + "px,0,0)";
      hsBar.style.width = (100 / hsCards.length + p * (100 - 100 / hsCards.length)) + "%";
      hsSetActive(Math.round(p * (hsCards.length - 1)));
    } else {
      var w = hsCards[0].offsetWidth + 16;
      var i = clamp(Math.round(hsView.scrollLeft / w), 0, hsCards.length - 1);
      hsBar.style.width = ((i + 1) / hsCards.length * 100) + "%";
      hsSetActive(i);
    }
  };
  var hsGo = function (i) {
    if (pinned) window.scrollTo({ top: hsTarget(i), behavior: reduce ? "auto" : "smooth" });
    else {
      hsView.scrollTo({ left: hsCards[i].offsetLeft - parseFloat(getComputedStyle(hsView).paddingLeft), behavior: reduce ? "auto" : "smooth" });
      var y = absTop(hs) - NAV;
      if (Math.abs(window.scrollY - y) > 40) window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    }
  };
  var hsMode = function () {
    if (!hs) return;
    pinned = pinMQ.matches;
    hs.classList.toggle("pin", pinned);
    if (!pinned) hsTrack.style.transform = "";
    hsFit();
    hsActive = -1;
    hsUpdate();
  };
  if (hs) {
    hsCards = Array.prototype.slice.call(hs.querySelectorAll(".hs-track .scard"));
    hsTabs = Array.prototype.slice.call(hs.querySelectorAll(".hs-tabs button"));
    hsTrack = hs.querySelector(".hs-track");
    hsView = hs.querySelector(".hs-viewport");
    hsBar = hs.querySelector(".hs-progress b");
    hsCount = hs.querySelector(".hs-count");
    hsTabs.forEach(function (t, i) { t.addEventListener("click", function () { hsGo(i); }); });
    hsView.addEventListener("scroll", function () { if (!pinned) hsUpdate(); }, { passive: true });
    if (pinMQ.addEventListener) pinMQ.addEventListener("change", hsMode);
    hsMode();
  }

  // So funktioniert's: Schritte steuern das Telefon
  var how = document.querySelector(".how");
  var howSteps = [], howScreens = [], howCap, howBar, howActive = -1;
  var howSet = function (i) {
    if (i === howActive) return;
    howActive = i;
    howSteps.forEach(function (s, k) { s.classList.toggle("on", k === i); });
    howScreens.forEach(function (s, k) { s.classList.toggle("on", k === i); s.classList.toggle("gone", k < i); });
    howCap.textContent = "Schritt " + (i + 1) + " von " + howSteps.length;
    howBar.style.width = ((i + 1) / howSteps.length * 100) + "%";
  };
  var howFocus = function () {
    var stick = how.querySelector(".how-stick");
    if (window.matchMedia("(max-width: 1080px)").matches) {
      var b = stick.getBoundingClientRect().bottom;
      return b + (window.innerHeight - b) * 0.4;
    }
    return window.innerHeight / 2;
  };
  var howUpdate = function () {
    if (!how) return;
    var f = howFocus(), best = 0, bestD = Infinity;
    howSteps.forEach(function (s, k) {
      var r = s.lastElementChild.getBoundingClientRect();
      var d = Math.abs((r.top + r.height / 2) - f);
      if (d < bestD) { bestD = d; best = k; }
    });
    howSet(best);
  };
  if (how) {
    howSteps = Array.prototype.slice.call(how.querySelectorAll(".how-step"));
    howScreens = Array.prototype.slice.call(how.querySelectorAll(".how-screen"));
    howCap = how.querySelector(".how-cap");
    howBar = how.querySelector(".how-meter b");
    howUpdate();
  }

  // Ein Scroll-Handler für alles
  var ticking = false;
  var onScroll = function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      if (pair && !reduce) heroTilt();
      hsUpdate();
      howUpdate();
      deckLabel();
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { hsFit(); onScroll(); });

  // Präsentationsmodus: Pfeiltasten, Bild auf/ab und Knöpfe
  var counter = document.querySelector(".deck span");
  var targets = [];
  var label = 0;
  document.querySelectorAll("[data-slide],[data-sub]").forEach(function (el) {
    if (el.hasAttribute("data-slide")) label++;
    var cardIndex = hsCards.indexOf(el);
    targets.push({ el: el, label: label, card: cardIndex, sub: el.hasAttribute("data-sub") });
  });
  var total = label;
  var targetY = function (t) {
    if (t.card > -1) return pinned ? hsTarget(t.card) : absTop(hs) - NAV;
    if (t.sub) {
      var r = t.el.lastElementChild.getBoundingClientRect();
      return window.scrollY + r.top + r.height / 2 - howFocusAbs();
    }
    return absTop(t.el) - NAV;
  };
  var howFocusAbs = function () { return how ? howFocus() : window.innerHeight / 2; };
  var currentIndex = function () {
    if (!targets.length) return 0;
    if (hs && !pinned) {
      var hr = hs.getBoundingClientRect();
      if (hr.top <= NAV + 40 && hr.bottom > window.innerHeight / 2) return targets.findIndex(function (t) { return t.card === hsActive; });
    }
    var y = window.scrollY + 8, idx = 0;
    targets.forEach(function (t, i) { if (targetY(t) <= y) idx = i; });
    if (window.scrollY + window.innerHeight >= doc.scrollHeight - 4) idx = targets.length - 1;
    return idx;
  };
  var deckLabel = function () {
    if (!counter || !targets.length) return;
    var t = targets[currentIndex()] || targets[0];
    counter.textContent = pad(t.label) + " / " + pad(total);
  };
  var go = function (dir) {
    var i = clamp(currentIndex() + dir, 0, targets.length - 1);
    var t = targets[i];
    if (t.card > -1 && !pinned) { hsGo(t.card); return; }
    window.scrollTo({ top: Math.max(0, targetY(t)), behavior: reduce ? "auto" : "smooth" });
  };
  if (counter) {
    document.querySelector(".deck .prev").addEventListener("click", function () { go(-1); });
    document.querySelector(".deck .next").addEventListener("click", function () { go(1); });
    document.addEventListener("keydown", function (e) {
      if (e.target.closest && e.target.closest("input,textarea,select")) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(-1); }
    });
    deckLabel();
  }

  window.addEventListener("beforeprint", function () {
    items.forEach(function (el) { el.classList.add("in"); });
    counters.forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
  });
})();
