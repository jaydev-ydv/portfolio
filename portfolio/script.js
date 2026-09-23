/* Jaydev Kumar — Portfolio
   Modules: year · mobile nav · profile fallback · scroll reveal ·
            project filter · contact form */
(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Footer year ---------------------------------------------------------- */
    var yearEl = document.getElementById("year");
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    /* Mobile navigation ---------------------------------------------------- */
    (function initNav() {
        var toggle = document.querySelector(".nav-toggle");
        var nav = document.getElementById("site-nav");
        if (!toggle || !nav) return;

        var mq = window.matchMedia("(max-width: 860px)");

        function setOpen(open) {
            toggle.setAttribute("aria-expanded", String(open));
            nav.classList.toggle("is-open", open);
        }

        toggle.addEventListener("click", function () {
            setOpen(toggle.getAttribute("aria-expanded") !== "true");
        });

        // Close after choosing a link so the menu never stays open
        nav.addEventListener("click", function (e) {
            if (e.target.closest("a")) setOpen(false);
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
                setOpen(false);
                toggle.focus();
            }
        });

        // Close when clicking outside the header
        document.addEventListener("click", function (e) {
            if (!e.target.closest(".site-header")) setOpen(false);
        });

        // Reset when moving to the desktop layout
        var onChange = function (e) {
            if (!e.matches) setOpen(false);
        };
        if (mq.addEventListener) {
            mq.addEventListener("change", onChange);
        } else if (mq.addListener) {
            mq.addListener(onChange);
        }
    })();

    /* Profile image fallback (shows initials if profile.png is missing) ---- */
    (function initProfile() {
        var img = document.querySelector(".profile-inner img");
        if (!img) return;

        function hide() {
            img.hidden = true;
        }
        img.addEventListener("error", hide);
        if (img.complete && img.naturalWidth === 0) hide();
    })();

    /* Scroll reveal (only for content that starts below the fold) ---------- */
    (function initReveal() {
        var items = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
        if (!items.length || reduceMotion || !("IntersectionObserver" in window)) return;

        var observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    var el = entry.target;
                    observer.unobserve(el);
                    el.classList.add("is-visible");

                    // Remove reveal classes afterwards so hover transitions are not affected
                    var cleanup = function () {
                        el.classList.remove("reveal-init", "is-visible");
                        el.style.removeProperty("--reveal-delay");
                    };
                    var done = false;
                    el.addEventListener("transitionend", function handler(ev) {
                        if (ev.propertyName !== "opacity" || done) return;
                        done = true;
                        el.removeEventListener("transitionend", handler);
                        cleanup();
                    });
                    setTimeout(function () {
                        if (!done) {
                            done = true;
                            cleanup();
                        }
                    }, 1200);
                });
            },
            { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
        );

        items.forEach(function (el) {
            // Anything already on screen stays visible; no flash of hidden content
            if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

            var parent = el.parentElement;
            var siblings = parent ? Array.prototype.filter.call(parent.children, function (c) {
                return c.hasAttribute("data-reveal");
            }) : [];
            var index = Math.max(0, siblings.indexOf(el));
            el.style.setProperty("--reveal-delay", Math.min(index, 4) * 0.07 + "s");
            el.classList.add("reveal-init");
            observer.observe(el);
        });
    })();

    /* Project filter ------------------------------------------------------- */
    (function initFilter() {
        var bar = document.querySelector(".filter-bar");
        var cards = Array.prototype.slice.call(document.querySelectorAll(".project[data-category]"));
        var status = document.getElementById("filter-status");
        if (!bar || !cards.length) return;

        var buttons = Array.prototype.slice.call(bar.querySelectorAll(".filter-btn"));

        function apply(filter) {
            var shown = 0;
            cards.forEach(function (card) {
                var match = filter === "all" || card.getAttribute("data-category") === filter;
                if (match) {
                    shown++;
                    if (card.hidden) {
                        card.hidden = false;
                        card.classList.add("is-entering");
                        card.addEventListener("animationend", function done() {
                            card.classList.remove("is-entering");
                            card.removeEventListener("animationend", done);
                        });
                    }
                } else {
                    card.hidden = true;
                }
            });
            if (status) {
                status.textContent =
                    "Showing " + shown + (shown === 1 ? " project" : " projects") +
                    (filter === "all" ? "" : " in " + filter);
            }
        }

        bar.addEventListener("click", function (e) {
            var btn = e.target.closest(".filter-btn");
            if (!btn) return;
            buttons.forEach(function (b) {
                b.setAttribute("aria-pressed", String(b === btn));
            });
            apply(btn.getAttribute("data-filter"));
        });
    })();

    /* Contact form --------------------------------------------------------- */
    (function initForm() {
        var form = document.getElementById("contact-form");
        if (!form) return;

        var statusBox = document.getElementById("form-status");
        var mailLink = document.getElementById("mailto-link");
        var resetBtn = document.getElementById("form-reset");
        var to = form.getAttribute("data-mailto") || "";

        var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

        var rules = {
            name: function (v) {
                v = v.trim();
                if (!v) return "Enter your name.";
                if (v.length < 2) return "Your name needs at least 2 characters.";
                if (v.length > 80) return "Keep your name under 80 characters.";
                if (!/[A-Za-z\u00C0-\uFFFF]/.test(v)) return "Your name should include letters.";
                return "";
            },
            email: function (v) {
                v = v.trim();
                if (!v) return "Enter your email address.";
                if (!EMAIL_RE.test(v)) return "Please enter a valid email address, like name@example.com.";
                return "";
            },
            subject: function (v) {
                if (v.trim().length > 120) return "Keep the subject under 120 characters.";
                return "";
            },
            message: function (v) {
                v = v.trim();
                if (!v) return "Write a message.";
                if (v.length < 10) return "Your message needs at least 10 characters.";
                if (v.length > 2000) return "Keep your message under 2000 characters.";
                return "";
            }
        };

        function fieldOf(input) {
            return input.closest(".field");
        }

        function showError(input, message) {
            var field = fieldOf(input);
            var err = document.getElementById(input.id + "-error");
            if (!field || !err) return;
            var hadError = field.classList.contains("has-error");
            if (message) {
                err.textContent = message;
                err.hidden = false;
                field.classList.add("has-error");
                input.setAttribute("aria-invalid", "true");
                if (!hadError) {
                    // restart the nudge animation
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

        var inputs = Array.prototype.slice.call(form.querySelectorAll("input, textarea"));

        inputs.forEach(function (input) {
            input.addEventListener("blur", function () {
                // Only judge a field once the visitor has typed in it
                if (input.value.trim() !== "" || fieldOf(input).classList.contains("has-error")) {
                    validate(input);
                }
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

            if (firstInvalid) {
                firstInvalid.focus();
                return;
            }

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
                mailLink.href =
                    "mailto:" + encodeURIComponent(to).replace(/%40/g, "@") +
                    "?subject=" + encodeURIComponent(subject) +
                    "&body=" + encodeURIComponent(body);
            }

            form.hidden = true;
            if (statusBox) {
                statusBox.hidden = false;
                var heading = statusBox.querySelector("h3");
                if (heading) {
                    heading.setAttribute("tabindex", "-1");
                    heading.focus({ preventScroll: false });
                }
            }
        });

        if (resetBtn) {
            resetBtn.addEventListener("click", function () {
                form.reset();
                inputs.forEach(function (input) {
                    showError(input, "");
                });
                if (statusBox) statusBox.hidden = true;
                form.hidden = false;
                form.elements.name.focus();
            });
        }
    })();
})();
