/* Jaydev Kumar — Portfolio
   Modules: year · theme · cosmos (dark only) · nav · scroll-spy · optional content ·
            resume check · portrait fallback · scroll reveal · stats · project filter · contact form */
(function () {
    "use strict";

    var root = document.documentElement;
    var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    var reduceMotion = motionQuery.matches;
    var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
    var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
    var listen = function (mq, fn) { if (mq.addEventListener) mq.addEventListener("change", fn); else if (mq.addListener) mq.addListener(fn); };
    listen(motionQuery, function (e) { reduceMotion = e.matches; document.dispatchEvent(new Event("themechange")); });

    /* Footer year ---------------------------------------------------------- */
    var yearEl = $("#year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* Theme ----------------------------------------------------------------
       The correct theme is already on <html> before first paint (inline script in <head>).
       Here: the toggle, persistence, following the system until the visitor chooses. */
    (function initTheme() {
        var toggles = $$("[data-theme-toggle]");
        var meta = $('meta[name="theme-color"]');
        var timer = null;
        var systemDark = window.matchMedia("(prefers-color-scheme: dark)");

        function current() { return root.getAttribute("data-theme") === "dark" ? "dark" : "light"; }

        function saved() {
            try {
                var v = localStorage.getItem("theme");
                return v === "light" || v === "dark" ? v : null;
            } catch (e) { return null; }
        }

        function paint(theme) {
            toggles.forEach(function (btn) {
                btn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
            });
            if (meta) meta.setAttribute("content", theme === "dark" ? "#08071a" : "#f7f5f0");
        }

        function apply(theme, animate) {
            if (theme === current()) { paint(theme); return; }
            if (animate && !reduceMotion) {
                root.classList.add("theme-anim");
                clearTimeout(timer);
                timer = setTimeout(function () { root.classList.remove("theme-anim"); }, 550);
            }
            root.setAttribute("data-theme", theme);
            paint(theme);
            document.dispatchEvent(new Event("themechange"));
        }

        toggles.forEach(function (btn) {
            btn.addEventListener("click", function () {
                var next = current() === "dark" ? "light" : "dark";
                apply(next, true);
                try { localStorage.setItem("theme", next); } catch (e) { /* storage blocked: still works for this visit */ }
            });
        });

        // Follow the system only while the visitor has not made a choice
        listen(systemDark, function (e) { if (!saved()) apply(e.matches ? "dark" : "light", true); });

        paint(current());
    })();

    /* Cosmos: star field, occasional shooting stars (dark theme only) ------- */
    (function initCosmos() {
        var cosmos = $(".cosmos");
        if (!cosmos) return;
        var layers = $$(".stars", cosmos);
        var builtW = 0, builtH = 0;
        var timer = null;
        var COLORS = ["rgba(255,255,255,0.95)", "rgba(255,255,255,0.7)", "rgba(255,255,255,0.5)", "rgba(196,181,253,0.85)", "rgba(186,214,255,0.75)"];

        function isDark() { return root.getAttribute("data-theme") === "dark"; }

        // One element per layer; its box-shadows are the stars (hundreds of stars, only four nodes)
        function buildStars() {
            var w = window.innerWidth, h = window.innerHeight;
            var total = Math.max(120, Math.min(340, Math.round((w * h) / 5200)));
            layers.forEach(function (layer) {
                var share = parseFloat(layer.getAttribute("data-share")) || 0.2;
                var n = Math.max(3, Math.round(total * share));
                var out = [];
                for (var i = 0; i < n; i++) {
                    var x = Math.round(Math.random() * (w + 40) - 20);
                    var y = Math.round(Math.random() * (h + 40) - 20);
                    out.push(x + "px " + y + "px 0 0 " + COLORS[Math.floor(Math.random() * COLORS.length)]);
                }
                layer.style.boxShadow = out.join(",");
            });
            builtW = w; builtH = h;
        }

        var resizeTimer = null;
        window.addEventListener("resize", function () {
            if (!isDark()) return;
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                if (window.innerWidth > builtW * 1.15 || window.innerHeight > builtH * 1.15) buildStars();
            }, 300);
        });

        // A single shooting star: diagonal, short glowing trail, fades away
        function shoot() {
            var w = window.innerWidth, h = window.innerHeight;
            var el = document.createElement("span");
            el.className = "shooting-star";
            var goLeft = Math.random() < 0.35;
            var angle = 18 + Math.random() * 22;
            var rot = goLeft ? 180 - angle : angle;
            var rad = rot * Math.PI / 180;
            var dist = Math.min(w, 900) * (0.5 + Math.random() * 0.35);
            el.style.left = Math.round((goLeft ? 0.45 + Math.random() * 0.5 : 0.05 + Math.random() * 0.5) * w) + "px";
            el.style.top = Math.round((0.03 + Math.random() * 0.4) * h) + "px";
            el.style.setProperty("--rot", rot.toFixed(1) + "deg");
            el.style.setProperty("--tx", Math.round(Math.cos(rad) * dist) + "px");
            el.style.setProperty("--ty", Math.round(Math.sin(rad) * dist) + "px");
            el.style.setProperty("--dur", (1.1 + Math.random() * 0.7).toFixed(2) + "s");
            el.addEventListener("animationend", function () { el.remove(); });
            cosmos.appendChild(el);
            void el.offsetWidth;
            el.classList.add("is-active");
        }

        function schedule(first) {
            clearTimeout(timer);
            var wait = first ? 4000 + Math.random() * 4000 : 8000 + Math.random() * 10000;
            timer = setTimeout(function () {
                if (isDark() && !reduceMotion && !document.hidden) shoot();
                schedule(false);
            }, wait);
        }

        function sync() {
            clearTimeout(timer);
            if (!isDark()) return;
            if (!builtW) buildStars();
            if (!reduceMotion) schedule(true);
        }

        document.addEventListener("themechange", sync);
        document.addEventListener("visibilitychange", function () { if (!document.hidden) sync(); });
        sync();
    })();

    /* Nav: mobile menu, header state ---------------------------------------- */
    (function initNav() {
        var toggle = $(".nav-toggle");
        var menu = $("#nav-menu");
        var header = $(".site-header");
        if (!toggle || !menu) return;

        function setOpen(open) {
            toggle.setAttribute("aria-expanded", String(open));
            menu.classList.toggle("is-open", open);
        }

        toggle.addEventListener("click", function () {
            setOpen(toggle.getAttribute("aria-expanded") !== "true");
        });

        // Close after choosing a link so the menu never stays open
        menu.addEventListener("click", function (e) {
            if (e.target.closest("a")) setOpen(false);
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
                setOpen(false);
                toggle.focus();
            }
        });

        document.addEventListener("click", function (e) {
            if (!e.target.closest(".site-header")) setOpen(false);
        });

        listen(window.matchMedia("(min-width: 900px)"), function (e) { if (e.matches) setOpen(false); });

        if (header) {
            var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
            window.addEventListener("scroll", onScroll, { passive: true });
            onScroll();
        }
    })();

    /* Scroll-spy: mark the nav link for the section in view ---------------- */
    (function initSpy() {
        var links = $$(".nav-links a[data-nav]");
        var sections = $$("[data-spy]");
        if (!links.length || !sections.length || !("IntersectionObserver" in window)) return;

        function mark(name) {
            links.forEach(function (a) {
                if (a.getAttribute("data-nav") === name) a.setAttribute("aria-current", "true");
                else a.removeAttribute("aria-current");
            });
        }

        var visible = {};
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) { visible[entry.target.id] = entry.isIntersecting; });
            var current = null;
            sections.forEach(function (s) { if (visible[s.id]) current = s.getAttribute("data-spy"); });
            if (current) mark(current);
        }, { rootMargin: "-40% 0px -55% 0px", threshold: 0 });

        sections.forEach(function (s) { observer.observe(s); });
    })();

    /* Optional content: hide anything still holding placeholder data ------- */
    (function initOptional() {
        $$("a[data-optional]").forEach(function (a) {
            if (/YOUR-/i.test(a.getAttribute("href") || "")) a.hidden = true;
        });

        $$("[data-stat-optional]").forEach(function (tile) {
            var value = parseInt(tile.getAttribute("data-value"), 10);
            var num = $("[data-stat]", tile);
            if (isNaN(value) || value <= 0 || !num) tile.hidden = true;
            else num.setAttribute("data-target", String(value));
        });
    })();

    /* Resume: hide the CV links if resume.pdf is not there ---------------- */
    (function initResume() {
        var links = $$("[data-resume]");
        if (!links.length || !/^https?:$/.test(location.protocol) || !window.fetch) return;
        fetch(links[0].getAttribute("href"), { method: "HEAD" })
            .then(function (res) { if (!res.ok) links.forEach(function (l) { l.hidden = true; }); })
            .catch(function () { /* offline: leave them visible */ });
    })();

    /* Portrait: show initials if profile.png is missing -------------------- */
    (function initPortrait() {
        var img = $(".portrait-frame img");
        var frame = $(".portrait-frame");
        if (!img || !frame) return;
        function fallback() { frame.classList.add("is-fallback"); }
        img.addEventListener("error", fallback);
        if (img.complete && img.naturalWidth === 0) fallback();
    })();

    /* Scroll reveal (only content that starts below the fold) -------------- */
    (function initReveal() {
        var items = $$("[data-reveal]");
        if (!items.length || reduceMotion || !("IntersectionObserver" in window)) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var el = entry.target;
                observer.unobserve(el);
                el.classList.add("is-visible");

                // Remove reveal classes afterwards so hover transitions are unaffected
                var done = false;
                var cleanup = function () {
                    if (done) return;
                    done = true;
                    el.classList.remove("reveal-init", "is-visible");
                    el.style.removeProperty("--reveal-delay");
                };
                el.addEventListener("transitionend", function handler(ev) {
                    if (ev.target !== el || ev.propertyName !== "opacity") return;
                    el.removeEventListener("transitionend", handler);
                    cleanup();
                });
                setTimeout(cleanup, 1500);
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

        items.forEach(function (el) {
            if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
            var siblings = el.parentElement ? $$(":scope > [data-reveal]", el.parentElement) : [];
            var index = Math.max(0, siblings.indexOf(el));
            el.style.setProperty("--reveal-delay", Math.min(index % 3, 2) * 0.08 + "s");
            el.classList.add("reveal-init");
            observer.observe(el);
        });
    })();

    /* Stats: counts come from the page, then count up when seen ------------ */
    (function initStats() {
        var nums = $$("[data-stat]");
        if (!nums.length) return;

        var projectsEl = $('[data-stat="projects"]');
        var skillsEl = $('[data-stat="skills"]');
        if (projectsEl) projectsEl.setAttribute("data-target", String($$("[data-project]:not([data-more])").length));
        if (skillsEl) {
            var seen = {};
            $$("#stack .pill").forEach(function (p) { seen[p.textContent.trim().toLowerCase()] = true; });
            skillsEl.setAttribute("data-target", String(Object.keys(seen).length));
        }

        function finalValue(el) { return parseInt(el.getAttribute("data-target"), 10) || 0; }
        nums.forEach(function (el) { el.textContent = finalValue(el); });
        if (reduceMotion || !("IntersectionObserver" in window)) return;

        function count(el) {
            var end = finalValue(el);
            var start = null;
            function step(ts) {
                if (start === null) start = ts;
                var p = Math.min((ts - start) / 900, 1);
                el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
                if (p < 1) requestAnimationFrame(step);
            }
            el.textContent = 0;
            requestAnimationFrame(step);
        }

        var wrap = $(".stats");
        if (!wrap) return;
        var io = new IntersectionObserver(function (entries) {
            if (!entries[0].isIntersecting) return;
            io.disconnect();
            nums.forEach(count);
        }, { threshold: 0.4 });
        io.observe(wrap);
    })();

    /* Project filter ------------------------------------------------------- */
    (function initFilter() {
        var bar = $(".filter-bar");
        var cards = $$("[data-project]");
        var status = $("#filter-status");
        if (!bar || !cards.length) return;
        var buttons = $$(".filter-btn", bar);

        function apply(filter, label) {
            var shown = 0;
            cards.forEach(function (card) {
                var match = filter === "all" || card.getAttribute("data-category") === filter;
                clearTimeout(card._t);
                if (match) {
                    if (!card.hasAttribute("data-more")) shown++;
                    if (card.hidden) {
                        card.hidden = false;
                        card.classList.add("is-entering");
                        card.addEventListener("animationend", function done() {
                            card.classList.remove("is-entering");
                            card.removeEventListener("animationend", done);
                        });
                    }
                    card.classList.remove("is-leaving");
                } else if (!card.hidden) {
                    card.classList.add("is-leaving");
                    card._t = setTimeout(function () { card.hidden = true; }, 220);
                }
            });
            if (status) {
                status.textContent = "Showing " + shown + (shown === 1 ? " project" : " projects") +
                    (filter === "all" ? "" : " in " + label);
            }
        }

        bar.addEventListener("click", function (e) {
            var btn = e.target.closest(".filter-btn");
            if (!btn) return;
            buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
            apply(btn.getAttribute("data-filter"), btn.textContent.trim());
        });
    })();

    /* Contact form --------------------------------------------------------- */
    (function initForm() {
        var form = $("#contact-form");
        if (!form) return;

        var statusBox = $("#form-status");
        var mailLink = $("#mailto-link");
        var resetBtn = $("#form-reset");
        var to = form.getAttribute("data-mailto") || "";
        var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

        var rules = {
            name: function (v) {
                v = v.trim();
                if (!v) return "Enter your name.";
                if (v.length < 2) return "Your name needs at least 2 characters.";
                if (!/[A-Za-z\u00C0-\uFFFF]/.test(v)) return "Your name should include letters.";
                return "";
            },
            email: function (v) {
                v = v.trim();
                if (!v) return "Enter your email address.";
                if (!EMAIL_RE.test(v)) return "Please enter a valid email address, like name@example.com.";
                return "";
            },
            subject: function () { return ""; },
            message: function (v) {
                v = v.trim();
                if (!v) return "Write a message.";
                if (v.length < 10) return "Your message needs at least 10 characters.";
                return "";
            }
        };

        function fieldOf(input) { return input.closest(".field"); }

        function showError(input, message) {
            var field = fieldOf(input);
            var err = document.getElementById(input.id + "-error");
            if (!field || !err) return;
            var had = field.classList.contains("has-error");
            if (message) {
                err.textContent = message;
                err.hidden = false;
                field.classList.add("has-error");
                input.setAttribute("aria-invalid", "true");
                if (!had) {
                    field.style.animation = "none";
                    void field.offsetWidth;
                    field.style.animation = "";
                }
            } else {
                err.textContent = "";
                err.hidden = true;
                field.classList.remove("has-error");
                input.removeAttribute("aria-invalid");
            }
        }

        function validate(input) {
            var rule = rules[input.name];
            var message = rule ? rule(input.value) : "";
            showError(input, message);
            return !message;
        }

        var inputs = $$("input, textarea", form);

        inputs.forEach(function (input) {
            input.addEventListener("blur", function () {
                if (input.value.trim() !== "" || fieldOf(input).classList.contains("has-error")) validate(input);
            });
            input.addEventListener("input", function () {
                if (fieldOf(input).classList.contains("has-error")) validate(input);
            });
        });

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            var firstInvalid = null;
            inputs.forEach(function (input) {
                if (!validate(input) && !firstInvalid) firstInvalid = input;
            });
            if (firstInvalid) { firstInvalid.focus(); return; }

            // No mail service is configured, so nothing is sent from here.
            // Build a mailto: link so the visitor can send it from their email app.
            var data = {
                name: form.elements.name.value.trim(),
                email: form.elements.email.value.trim(),
                subject: form.elements.subject.value.trim(),
                message: form.elements.message.value.trim()
            };
            var subject = data.subject || "Portfolio message from " + data.name;
            var body = data.message + "\n\n" + data.name + "\n" + data.email;

            if (mailLink) {
                mailLink.href = "https://mail.google.com/mail/?view=cm&fs=1&to=" + encodeURIComponent(to) +
                    "&su=" + encodeURIComponent(subject) +
                    "&body=" + encodeURIComponent(body);
            }

            form.hidden = true;
            if (statusBox) {
                statusBox.hidden = false;
                var heading = $("h4", statusBox);
                if (heading) heading.focus();
            }
        });

        if (resetBtn) {
            resetBtn.addEventListener("click", function () {
                form.reset();
                inputs.forEach(function (input) { showError(input, ""); });
                if (statusBox) statusBox.hidden = true;
                form.hidden = false;
                form.elements.name.focus();
            });
        }
    })();
})();
