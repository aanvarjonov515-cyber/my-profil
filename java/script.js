(() => {
    "use strict";

    /*
    ============================================================
      ABRORBEK ANVARJONOV — INTERACTIVE PORTFOLIO
      Version: 2.0

      Features:
      01. Three.js 3D hero scene
      02. Animated orbital geometry
      03. Particle field and connection network
      04. Scroll progress and timeline animation
      05. Reveal-on-scroll effects
      06. Interactive navigation and mobile menu
      07. Ambient audio controls
      08. Custom cursor glow
      09. 3D project card tilt
      10. Interactive photo gallery / lightbox
      11. Responsive and reduced-motion support
      12. Graceful fallback when WebGL is unavailable

      HTML: ../index.html
      CSS:  ../css/style.css
      JS:   ../java/script.js
    ============================================================
    */

    /* =========================================================
       01. YORDAMCHI FUNKSIYALAR
    ========================================================= */

    const $ = (selector, root = document) =>
        root.querySelector(selector);

    const $$ = (selector, root = document) =>
        Array.from(root.querySelectorAll(selector));

    const clamp = (value, min, max) =>
        Math.min(max, Math.max(min, value));

    const lerp = (start, end, factor) =>
        start + (end - start) * factor;

    const random = (min, max) =>
        Math.random() * (max - min) + min;

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    const hasFinePointer = window.matchMedia(
        "(pointer: fine)"
    ).matches;

    const isSmallScreen = window.matchMedia(
        "(max-width: 768px)"
    ).matches;


    /* =========================================================
       02. HTML ELEMENTLARI
    ========================================================= */

    const body = document.body;

    const progressBar = $("#scrollProgress");
    const cursorGlow = $("#cursorGlow");

    const header = $(".site-header");
    const menuToggle = $("#menuToggle");
    const mainNav = $("#mainNav");

    const soundToggle = $("#soundToggle");
    const soundLabel = $("#soundLabel");
    const ambientAudio = $("#ambientAudio");

    const currentYear = $("#currentYear");
    const threeStage = $("#threeStage");

    const hero = $(".hero");
    const heroVisual = $(".hero-visual");

    const timeline = $(".timeline");
    const timelineFill = $(".timeline-line span");

    const navLinks = $$("#mainNav a");

    let isPageHidden = document.hidden;
    let scrollFrameQueued = false;
    let lastScrollY = window.scrollY;

    let threeSceneController = null;


    /* =========================================================
       03. DASTLABKI SOZLAMALAR
    ========================================================= */

    body.classList.add("js-ready");

    if (currentYear) {
        currentYear.textContent = String(
            new Date().getFullYear()
        );
    }

    // Brauzer sozlamasiga hurmat bilan munosabat.
    if (prefersReducedMotion) {
        body.classList.add("reduced-motion");
    }

    // 3D kursor effekti faqat mos qurilmalarda ishlaydi.
    if (hasFinePointer && !isSmallScreen) {
        body.classList.add("has-pointer");
    }


    /* =========================================================
       04. HEADER SCROLL EFFEKTI
    ========================================================= */

    function updateHeader() {
        if (!header) return;

        const currentScroll = window.scrollY;

        header.classList.toggle(
            "is-scrolled",
            currentScroll > 24
        );

        // Tepaga qaytish yo'nalishini kuzatish.
        const scrollingUp = currentScroll < lastScrollY;

        header.classList.toggle(
            "is-scrolling-up",
            scrollingUp && currentScroll > 180
        );

        lastScrollY = currentScroll;
    }


    /* =========================================================
       05. SCROLL PROGRESS VA TA'LIM TIMELINE
    ========================================================= */

    function updateScrollUI() {
        const scrollTop =
            window.scrollY ||
            document.documentElement.scrollTop ||
            0;

        const pageHeight =
            document.documentElement.scrollHeight;

        const viewportHeight = window.innerHeight;

        const maximumScroll = Math.max(
            pageHeight - viewportHeight,
            1
        );

        const percentage = clamp(
            (scrollTop / maximumScroll) * 100,
            0,
            100
        );

        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
            progressBar.setAttribute(
                "aria-valuenow",
                String(Math.round(percentage))
            );
        }

        // Ta'lim timeline chizig'i scroll bilan to'ladi.
        if (timelineFill && timeline) {
            const rect = timeline.getBoundingClientRect();

            const startPoint = viewportHeight * 0.76;
            const travelled = startPoint - rect.top;

            const totalDistance = Math.max(
                rect.height - viewportHeight * 0.15,
                1
            );

            const amount = clamp(
                travelled / totalDistance,
                0,
                1
            );

            timelineFill.style.transformOrigin = "top";
            timelineFill.style.transform =
                `scaleY(${amount})`;
        }

        updateHeader();

        scrollFrameQueued = false;
    }


    function requestScrollUpdate() {
        if (scrollFrameQueued) return;

        scrollFrameQueued = true;

        window.requestAnimationFrame(updateScrollUI);
    }


    window.addEventListener(
        "scroll",
        requestScrollUpdate,
        { passive: true }
    );

    window.addEventListener(
        "resize",
        requestScrollUpdate,
        { passive: true }
    );

    updateScrollUI();


    /* =========================================================
       06. SAHIFA BO'LIMLARINING KIRIB KELISH ANIMATSIYASI
    ========================================================= */

    function initRevealAnimations() {
        const revealElements = $$(".reveal");

        if (!revealElements.length) return;

        if (
            prefersReducedMotion ||
            !("IntersectionObserver" in window)
        ) {
            revealElements.forEach((element) => {
                element.classList.add("is-visible");
            });

            return;
        }

        const observer = new IntersectionObserver(
            (entries, currentObserver) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    entry.target.classList.add("is-visible");

                    currentObserver.unobserve(entry.target);
                });
            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -45px 0px"
            }
        );

        revealElements.forEach((element, index) => {
            element.style.setProperty(
                "--reveal-delay",
                `${Math.min(index % 5, 4) * 65}ms`
            );

            observer.observe(element);
        });
    }

    initRevealAnimations();


    /* =========================================================
       07. MOBIL MENYU
    ========================================================= */

    function closeMenu() {
        if (!menuToggle || !mainNav) return;

        menuToggle.classList.remove("is-open");
        mainNav.classList.remove("is-open");

        body.classList.remove("menu-open");

        menuToggle.setAttribute(
            "aria-expanded",
            "false"
        );

        menuToggle.setAttribute(
            "aria-label",
            "Menyuni ochish"
        );
    }


    function toggleMenu() {
        if (!menuToggle || !mainNav) return;

        const willOpen = !mainNav.classList.contains(
            "is-open"
        );

        menuToggle.classList.toggle("is-open", willOpen);

        mainNav.classList.toggle("is-open", willOpen);

        body.classList.toggle("menu-open", willOpen);

        menuToggle.setAttribute(
            "aria-expanded",
            String(willOpen)
        );

        menuToggle.setAttribute(
            "aria-label",
            willOpen ? "Menyuni yopish" : "Menyuni ochish"
        );
    }


    if (menuToggle && mainNav) {
        menuToggle.addEventListener("click", toggleMenu);

        // Havola bosilganda menyuni yopish.
        navLinks.forEach((link) => {
            link.addEventListener("click", closeMenu);
        });

        // Menyudan tashqariga bosilganda yopish.
        document.addEventListener("pointerdown", (event) => {
            if (!mainNav.classList.contains("is-open")) {
                return;
            }

            const clickedInsideMenu = mainNav.contains(
                event.target
            );

            const clickedToggle = menuToggle.contains(
                event.target
            );

            if (!clickedInsideMenu && !clickedToggle) {
                closeMenu();
            }
        });

        // Escape orqali menyuni yopish.
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeMenu();
            }
        });

        // Desktop holatiga qaytganda mobil menyuni tozalash.
        window.addEventListener("resize", () => {
            if (window.innerWidth > 900) {
                closeMenu();
            }
        });
    }


    /* =========================================================
       08. NAVIGATSIYA — FAOL BO'LIMNI BELGILASH
    ========================================================= */

    function initActiveNavigation() {
        const sections = navLinks
            .map((link) => {
                const hash = link.getAttribute("href");

                if (!hash || !hash.startsWith("#")) {
                    return null;
                }

                const section = $(hash);

                if (!section) return null;

                return {
                    link,
                    section
                };
            })
            .filter(Boolean);

        if (!sections.length) return;

        if (!("IntersectionObserver" in window)) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    sections.forEach(({ link, section }) => {
                        const active =
                            section === entry.target;

                        link.classList.toggle(
                            "is-active",
                            active
                        );

                        if (active) {
                            link.setAttribute(
                                "aria-current",
                                "location"
                            );
                        } else {
                            link.removeAttribute("aria-current");
                        }
                    });
                });
            },
            {
                rootMargin: "-30% 0px -55% 0px",
                threshold: 0
            }
        );

        sections.forEach(({ section }) => {
            observer.observe(section);
        });
    }

    initActiveNavigation();


    /* =========================================================
       09. SILLIQ ANCHOR NAVIGATSIYA
    ========================================================= */

    $$('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", (event) => {
            const href = link.getAttribute("href");

            if (!href || href === "#") return;

            const target = $(href);

            if (!target) return;

            event.preventDefault();

            closeMenu();

            const headerHeight = header
                ? header.getBoundingClientRect().height
                : 0;

            const targetTop =
                target.getBoundingClientRect().top +
                window.scrollY -
                headerHeight -
                16;

            window.scrollTo({
                top: Math.max(0, targetTop),
                behavior: prefersReducedMotion
                    ? "auto"
                    : "smooth"
            });

            // URL manzilini yangilash, lekin sahifani qayta yuklamaslik.
            try {
                history.replaceState(null, "", href);
            } catch (error) {
                // Ba'zi lokal fayl muhitlarida History API
                // cheklangan bo'lishi mumkin.
            }
        });
    });


    /* =========================================================
       10. KURSOR ORTIDAN ERGASHUVCHI YORUG'LIK
    ========================================================= */

    function initCursorGlow() {
        if (
            !cursorGlow ||
            !hasFinePointer ||
            prefersReducedMotion ||
            isSmallScreen
        ) {
            return;
        }

        let pointerX = window.innerWidth / 2;
        let pointerY = window.innerHeight / 2;

        let currentX = pointerX;
        let currentY = pointerY;

        let animationFrame = null;

        window.addEventListener(
            "pointermove",
            (event) => {
                pointerX = event.clientX;
                pointerY = event.clientY;

                if (animationFrame !== null) return;

                animationFrame = requestAnimationFrame(
                    function renderCursor() {
                        currentX = lerp(
                            currentX,
                            pointerX,
                            0.16
                        );

                        currentY = lerp(
                            currentY,
                            pointerY,
                            0.16
                        );

                        cursorGlow.style.left =
                            `${currentX}px`;

                        cursorGlow.style.top =
                            `${currentY}px`;

                        const distance = Math.hypot(
                            pointerX - currentX,
                            pointerY - currentY
                        );

                        if (
                            distance > 0.5 &&
                            !isPageHidden
                        ) {
                            animationFrame =
                                requestAnimationFrame(
                                    renderCursor
                                );
                        } else {
                            animationFrame = null;
                        }
                    }
                );
            },
            { passive: true }
        );

        // Interaktiv elementlar ustida effektni kuchaytirish.
        $$("a, button, .project-card, .gallery-card").forEach(
            (element) => {
                element.addEventListener("pointerenter", () => {
                    cursorGlow.classList.add("is-hovering");
                });

                element.addEventListener("pointerleave", () => {
                    cursorGlow.classList.remove("is-hovering");
                });
            }
        );
    }

    initCursorGlow();


    /* =========================================================
       11. FON MUSIQASI
    ========================================================= */

    function updateSoundUI(isPlaying, label = null) {
        if (soundToggle) {
            soundToggle.setAttribute(
                "aria-pressed",
                String(isPlaying)
            );

            soundToggle.classList.toggle(
                "is-playing",
                isPlaying
            );
        }

        if (soundLabel) {
            soundLabel.textContent =
                label || (isPlaying ? "SOUND ON" : "SOUND OFF");
        }
    }


    function initAudio() {
        if (!soundToggle || !ambientAudio) return;

        ambientAudio.volume = 0.24;
        ambientAudio.loop = true;

        updateSoundUI(false);

        soundToggle.addEventListener("click", async () => {
            const isPlaying =
                !ambientAudio.paused &&
                !ambientAudio.ended;

            if (isPlaying) {
                ambientAudio.pause();

                updateSoundUI(false);

                return;
            }

            try {
                await ambientAudio.play();

                updateSoundUI(true);
            } catch (error) {
                // Brauzer foydalanuvchi harakatidan oldin
                // yoki fayl mavjud bo'lmasa audio ochmasligi mumkin.
                updateSoundUI(false, "CHECK MUSIC");

                console.warn(
                    "Musiqa ijro etilmadi. music/ambient.mp3 faylini tekshiring.",
                    error
                );
            }
        });

        ambientAudio.addEventListener("play", () => {
            updateSoundUI(true);
        });

        ambientAudio.addEventListener("pause", () => {
            updateSoundUI(false);
        });

        ambientAudio.addEventListener("ended", () => {
            updateSoundUI(false);
        });

        ambientAudio.addEventListener("error", () => {
            updateSoundUI(false, "MUSIC UNAVAILABLE");
        });
    }

    initAudio();


    /* =========================================================
       12. RASMLAR — YUKLANMAGAN RASMNI ANIQLASH
    ========================================================= */

    function initImageFallbacks() {
        $$("img").forEach((img) => {
            const markAsLoaded = () => {
                img.classList.add("image-loaded");
                img.classList.remove("image-error");
            };

            const markAsError = () => {
                img.classList.add("image-error");

                const container =
                    img.closest("figure") ||
                    img.parentElement;

                if (!container) return;

                container.classList.add(
                    "has-image-placeholder"
                );

                if (
                    container.querySelector(
                        ".image-placeholder"
                    )
                ) {
                    return;
                }

                const placeholder =
                    document.createElement("div");

                placeholder.className =
                    "image-placeholder";

                placeholder.setAttribute(
                    "aria-hidden",
                    "true"
                );

                placeholder.innerHTML = `
                    <span class="image-placeholder-icon">✳</span>
                    <span class="image-placeholder-title">
                        RASM JOYLASH
                    </span>
                    <span class="image-placeholder-hint">
                        images/ papkasini tekshiring
                    </span>
                `;

                container.appendChild(placeholder);
            };

            img.addEventListener("load", markAsLoaded, {
                once: true
            });

            img.addEventListener("error", markAsError, {
                once: true
            });

            if (img.complete) {
                if (img.naturalWidth > 0) {
                    markAsLoaded();
                } else if (img.currentSrc || img.src) {
                    markAsError();
                }
            }
        });
    }

    initImageFallbacks();


    /* =========================================================
       13. FOTO GALEREYA — LIGHTBOX
    ========================================================= */

    let lightbox = null;
    let lightboxImage = null;
    let lightboxCaption = null;
    let lightboxClose = null;

    let previousFocus = null;


    function createLightbox() {
        if (lightbox) return;

        const wrapper = document.createElement("div");

        wrapper.className = "portfolio-lightbox";

        wrapper.setAttribute("role", "dialog");
        wrapper.setAttribute("aria-modal", "true");
        wrapper.setAttribute(
            "aria-label",
            "Rasmni katta ko'rish"
        );

        wrapper.setAttribute("aria-hidden", "true");

        wrapper.innerHTML = `
            <div class="lightbox-backdrop"></div>

            <div class="lightbox-panel">

                <button
                    class="lightbox-close"
                    type="button"
                    aria-label="Rasmni yopish">
                    ×
                </button>

                <div class="lightbox-media">
                    <img
                        class="lightbox-image"
                        alt=""
                        draggable="false">
                </div>

                <div class="lightbox-caption"></div>

            </div>
        `;

        document.body.appendChild(wrapper);

        lightbox = wrapper;

        lightboxImage = $(".lightbox-image", wrapper);
        lightboxCaption = $(".lightbox-caption", wrapper);
        lightboxClose = $(".lightbox-close", wrapper);

        // Orqa fonga bosilsa yopish.
        $(".lightbox-backdrop", wrapper)
            .addEventListener("click", closeLightbox);

        lightboxClose.addEventListener(
            "click",
            closeLightbox
        );

        // Keyingi/oldingi rasmga o'tish uchun strelkalar,
        // Escape — yopish.
        document.addEventListener("keydown", (event) => {
            if (!lightbox || !lightbox.classList.contains("is-open")) {
                return;
            }

            if (event.key === "Escape") {
                closeLightbox();
            }

            if (event.key === "ArrowRight") {
                showAdjacentImage(1);
            }

            if (event.key === "ArrowLeft") {
                showAdjacentImage(-1);
            }

            // Modal ochiq paytda fokusni boshqarish.
            if (event.key === "Tab") {
                const focusables = $$(
                    "button, a, [tabindex]:not([tabindex='-1'])",
                    lightbox
                ).filter((element) => {
                    return !element.hasAttribute("disabled");
                });

                if (!focusables.length) return;

                const first = focusables[0];
                const last = focusables[focusables.length - 1];

                if (
                    event.shiftKey &&
                    document.activeElement === first
                ) {
                    event.preventDefault();
                    last.focus();
                } else if (
                    !event.shiftKey &&
                    document.activeElement === last
                ) {
                    event.preventDefault();
                    first.focus();
                }
            }
        });
    }


    function getGalleryImages() {
        return $$(".gallery-card img").filter((img) => {
            return (
                !img.classList.contains("image-error") &&
                Boolean(img.currentSrc || img.src)
            );
        });
    }


    function openLightbox(img) {
        if (!img || img.classList.contains("image-error")) {
            return;
        }

        createLightbox();

        previousFocus = document.activeElement;

        const figure = img.closest("figure");
        const caption = figure
            ? $("figcaption", figure)
            : null;

        lightboxImage.src = img.currentSrc || img.src;

        lightboxImage.alt = img.alt || "Portfolio rasmi";

        lightboxCaption.textContent = caption
            ? caption.textContent.trim()
            : (img.alt || "Portfolio rasmi");

        lightbox.classList.add("is-open");

        lightbox.setAttribute("aria-hidden", "false");

        body.classList.add("lightbox-open");

        lightboxClose.focus();

        if (!prefersReducedMotion) {
            lightboxImage.animate(
                [
                    {
                        opacity: 0,
                        transform: "scale(0.96)"
                    },
                    {
                        opacity: 1,
                        transform: "scale(1)"
                    }
                ],
                {
                    duration: 240,
                    easing: "cubic-bezier(.2,.75,.25,1)"
                }
            );
        }
    }


    function closeLightbox() {
        if (!lightbox) return;

        lightbox.classList.remove("is-open");

        lightbox.setAttribute("aria-hidden", "true");

        body.classList.remove("lightbox-open");

        if (lightboxImage) {
            lightboxImage.removeAttribute("src");
        }

        if (
            previousFocus &&
            typeof previousFocus.focus === "function"
        ) {
            previousFocus.focus();
        }
    }


    function showAdjacentImage(direction) {
        if (!lightboxImage || !lightboxImage.src) return;

        const images = getGalleryImages();

        if (!images.length) return;

        let currentIndex = images.findIndex((img) => {
            return (
                (img.currentSrc || img.src) ===
                lightboxImage.src
            );
        });

        if (currentIndex < 0) currentIndex = 0;

        const nextIndex =
            (currentIndex + direction + images.length) %
            images.length;

        openLightbox(images[nextIndex]);
    }


    function initGallery() {
        const galleryImages = $$(".gallery-card img");

        galleryImages.forEach((img) => {
            const figure = img.closest("figure");

            if (figure) {
                figure.setAttribute("tabindex", "0");

                figure.setAttribute("role", "button");

                figure.setAttribute(
                    "aria-label",
                    `Rasmni katta ko'rish: ${img.alt || "Portfolio rasmi"}`
                );
            }

            img.addEventListener("click", () => {
                openLightbox(img);
            });

            if (figure) {
                figure.addEventListener("keydown", (event) => {
                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {
                        event.preventDefault();
                        openLightbox(img);
                    }
                });
            }
        });
    }

    initGallery();


    /* =========================================================
       14. 3D LOYIHA KARTALARI
    ========================================================= */

    function initCardTilt() {
        if (
            !hasFinePointer ||
            prefersReducedMotion ||
            isSmallScreen
        ) {
            return;
        }

        const tiltCards = $$(".project-card, .gallery-card");

        tiltCards.forEach((card) => {
            let rect = null;

            card.addEventListener("pointerenter", () => {
                rect = card.getBoundingClientRect();

                card.style.willChange = "transform";
            });

            card.addEventListener("pointermove", (event) => {
                if (!rect) {
                    rect = card.getBoundingClientRect();
                }

                const relativeX =
                    (event.clientX - rect.left) / rect.width;

                const relativeY =
                    (event.clientY - rect.top) / rect.height;

                const rotateY =
                    (relativeX - 0.5) * 7;

                const rotateX =
                    (0.5 - relativeY) * 7;

                card.style.transform =
                    `perspective(1100px) ` +
                    `rotateX(${rotateX}deg) ` +
                    `rotateY(${rotateY}deg) ` +
                    `translateY(-3px)`;

                card.style.setProperty(
                    "--pointer-x",
                    `${relativeX * 100}%`
                );

                card.style.setProperty(
                    "--pointer-y",
                    `${relativeY * 100}%`
                );
            });

            card.addEventListener("pointerleave", () => {
                rect = null;

                card.style.transform = "";

                card.style.willChange = "auto";
            });
        });
    }

    initCardTilt();


    /* =========================================================
       15. HERO PARALLAX — SICHQONCHAGA JAVOB
    ========================================================= */

    function initHeroParallax() {
        if (
            !heroVisual ||
            !hasFinePointer ||
            prefersReducedMotion ||
            isSmallScreen
        ) {
            return;
        }

        let pointerX = 0;
        let pointerY = 0;

        let targetX = 0;
        let targetY = 0;

        let rafId = null;

        heroVisual.addEventListener("pointermove", (event) => {
            const rect = heroVisual.getBoundingClientRect();

            targetX =
                ((event.clientX - rect.left) / rect.width - 0.5) *
                2;

            targetY =
                ((event.clientY - rect.top) / rect.height - 0.5) *
                2;

            if (rafId !== null) return;

            const update = () => {
                pointerX = lerp(pointerX, targetX, 0.08);
                pointerY = lerp(pointerY, targetY, 0.08);

                heroVisual.style.setProperty(
                    "--parallax-x",
                    `${pointerX * 8}px`
                );

                heroVisual.style.setProperty(
                    "--parallax-y",
                    `${pointerY * 8}px`
                );

                if (
                    Math.abs(pointerX - targetX) > 0.002 ||
                    Math.abs(pointerY - targetY) > 0.002
                ) {
                    rafId = requestAnimationFrame(update);
                } else {
                    rafId = null;
                }
            };

            rafId = requestAnimationFrame(update);
        });

        heroVisual.addEventListener("pointerleave", () => {
            targetX = 0;
            targetY = 0;

            heroVisual.style.setProperty("--parallax-x", "0px");
            heroVisual.style.setProperty("--parallax-y", "0px");
        });
    }

    initHeroParallax();


    /* =========================================================
       16. THREE.JS — FALLBACK ORB
    ========================================================= */

    function createFallbackOrb() {
        if (!threeStage) return;

        if (threeStage.querySelector(".fallback-orb")) {
            return;
        }

        threeStage.innerHTML = "";

        const fallback = document.createElement("div");

        fallback.className = "fallback-orb";

        fallback.setAttribute("aria-hidden", "true");

        fallback.innerHTML = `
            <div class="fallback-orb-ring ring-1"></div>
            <div class="fallback-orb-ring ring-2"></div>
            <div class="fallback-orb-ring ring-3"></div>

            <div class="fallback-orb-core">
                <span>A</span>
            </div>

            <div class="fallback-orb-dot dot-1"></div>
            <div class="fallback-orb-dot dot-2"></div>
            <div class="fallback-orb-dot dot-3"></div>
        `;

        Object.assign(fallback.style, {
            position: "absolute",
            inset: "0",
            display: "grid",
            placeItems: "center",
            perspective: "900px",
            overflow: "hidden"
        });

        const core = $(".fallback-orb-core", fallback);

        if (core) {
            Object.assign(core.style, {
                width: "150px",
                height: "150px",
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                border: "1px solid rgba(237,237,243,.7)",
                background: "radial-gradient(circle at 35% 30%, rgba(237,237,243,.18), rgba(30,30,42,.75) 65%, rgba(23,23,33,.96))",
                color: "#ededf3",
                fontSize: "60px",
                fontWeight: "400",
                letterSpacing: ".04em"
            });
        }

        $$(".fallback-orb-ring", fallback).forEach((ring, index) => {
            Object.assign(ring.style, {
                position: "absolute",
                width: `${230 + index * 65}px`,
                height: `${90 + index * 30}px`,
                border: "1px solid rgba(195,195,204,.45)",
                borderRadius: "50%",
                transform: `rotate(${index * 35 - 35}deg)`,
                animation: prefersReducedMotion
                    ? "none"
                    : `fallbackOrbit${index + 1} ${10 + index * 4}s linear infinite`
            });
        });

        threeStage.style.position = "relative";

        threeStage.appendChild(fallback);

        if (!$("#portfolioFallbackAnimation")) {
            const styles = document.createElement("style");

            styles.id = "portfolioFallbackAnimation";

            styles.textContent = `
                @keyframes fallbackOrbit1 {
                    from { transform: rotate(0deg) rotateX(58deg); }
                    to   { transform: rotate(360deg) rotateX(58deg); }
                }

                @keyframes fallbackOrbit2 {
                    from { transform: rotate(0deg) rotateX(68deg); }
                    to   { transform: rotate(-360deg) rotateX(68deg); }
                }

                @keyframes fallbackOrbit3 {
                    from { transform: rotate(0deg) rotateY(58deg); }
                    to   { transform: rotate(360deg) rotateY(58deg); }
                }
            `;

            document.head.appendChild(styles);
        }
    }


    /* =========================================================
       17. THREE.JS — SAHNANI YARATISH
    ========================================================= */

    function initThreeScene() {
        if (!threeStage) return;

        const THREE = window.THREE;

        // Three.js kutubxonasi yuklanmagan bo'lsa zaxira dizayn.
        if (!THREE) {
            createFallbackOrb();
            return;
        }

        let renderer;
        let scene;
        let camera;

        let mainGroup;
        let core;
        let wireCore;

        let orbitGroup;
        let particleField;

        let networkLines;

        let animationFrame = null;
        let disposed = false;

        let pointerTargetX = 0;
        let pointerTargetY = 0;

        let pointerCurrentX = 0;
        let pointerCurrentY = 0;

        const clock = new THREE.Clock();

        const sceneMaterialColor = 0xc3c3cc;
        const highlightColor = 0xededf3;
        const mutedColor = 0x70707d;

        try {
            scene = new THREE.Scene();

            camera = new THREE.PerspectiveCamera(
                38,
                1,
                0.1,
                100
            );

            camera.position.set(0, 0, 6.8);


            /* -----------------------------------------------
               RENDERER
            ----------------------------------------------- */

            renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: !isSmallScreen,
                powerPreference: "high-performance"
            });

            renderer.setPixelRatio(
                Math.min(
                    window.devicePixelRatio || 1,
                    isSmallScreen ? 1.25 : 1.75
                )
            );

            renderer.setClearColor(0x000000, 0);

            renderer.outputColorSpace = THREE.SRGBColorSpace;

            renderer.domElement.setAttribute(
                "aria-hidden",
                "true"
            );

            renderer.domElement.style.display = "block";
            renderer.domElement.style.width = "100%";
            renderer.domElement.style.height = "100%";
            renderer.domElement.style.outline = "none";

            threeStage.innerHTML = "";

            threeStage.style.position = "relative";
            threeStage.style.overflow = "hidden";

            threeStage.appendChild(renderer.domElement);


            /* -----------------------------------------------
               LIGHTING
            ----------------------------------------------- */

            const ambientLight = new THREE.AmbientLight(
                0xffffff,
                1.65
            );

            scene.add(ambientLight);

            const keyLight = new THREE.PointLight(
                0xffffff,
                2.7,
                24
            );

            keyLight.position.set(3, 4, 5);

            scene.add(keyLight);

            const rimLight = new THREE.PointLight(
                0xc3c3cc,
                1.6,
                20
            );

            rimLight.position.set(-4, -2, -2);

            scene.add(rimLight);


            /* -----------------------------------------------
               MAIN 3D GROUP
            ----------------------------------------------- */

            mainGroup = new THREE.Group();

            scene.add(mainGroup);


            /* -----------------------------------------------
               CENTRAL FACETED CORE
            ----------------------------------------------- */

            const coreGeometry = new THREE.IcosahedronGeometry(
                1.08,
                2
            );

            const coreMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x888a9b,
                metalness: 0.38,
                roughness: 0.3,
                transparent: true,
                opacity: 0.84,
                transmission: 0.0,
                clearcoat: 0.45,
                clearcoatRoughness: 0.24,
                flatShading: true
            });

            core = new THREE.Mesh(
                coreGeometry,
                coreMaterial
            );

            mainGroup.add(core);


            /* -----------------------------------------------
               OUTER WIREFRAME
            ----------------------------------------------- */

            const wireGeometry = new THREE.EdgesGeometry(
                new THREE.IcosahedronGeometry(1.16, 2)
            );

            const wireMaterial = new THREE.LineBasicMaterial({
                color: highlightColor,
                transparent: true,
                opacity: 0.47
            });

            wireCore = new THREE.LineSegments(
                wireGeometry,
                wireMaterial
            );

            mainGroup.add(wireCore);


            /* -----------------------------------------------
               SECONDARY FINE WIREFRAME
            ----------------------------------------------- */

            const fineWireGeometry =
                new THREE.EdgesGeometry(
                    new THREE.IcosahedronGeometry(0.88, 1)
                );

            const fineWireMaterial =
                new THREE.LineBasicMaterial({
                    color: mutedColor,
                    transparent: true,
                    opacity: 0.45
                });

            const fineWire = new THREE.LineSegments(
                fineWireGeometry,
                fineWireMaterial
            );

            fineWire.rotation.set(0.4, 0.8, 0.2);

            mainGroup.add(fineWire);


            /* -----------------------------------------------
               ORBITAL RINGS
            ----------------------------------------------- */

            orbitGroup = new THREE.Group();

            mainGroup.add(orbitGroup);


            function createOrbit(
                radius,
                tube,
                color,
                opacity,
                rotationX,
                rotationY,
                rotationZ
            ) {
                const geometry = new THREE.TorusGeometry(
                    radius,
                    tube,
                    8,
                    180
                );

                const material = new THREE.MeshBasicMaterial({
                    color,
                    transparent: true,
                    opacity
                });

                const orbit = new THREE.Mesh(
                    geometry,
                    material
                );

                orbit.rotation.set(
                    rotationX,
                    rotationY,
                    rotationZ
                );

                orbitGroup.add(orbit);

                return orbit;
            }


            const orbitOne = createOrbit(
                1.48,
                0.009,
                highlightColor,
                0.65,
                1.0,
                0.1,
                0.2
            );

            const orbitTwo = createOrbit(
                1.68,
                0.008,
                sceneMaterialColor,
                0.4,
                0.3,
                0.85,
                0.4
            );

            const orbitThree = createOrbit(
                1.32,
                0.006,
                mutedColor,
                0.5,
                0.65,
                0.6,
                1.0
            );


            /* -----------------------------------------------
               ORBITAL SATELLITES
            ----------------------------------------------- */

            function createSatellite(
                radius,
                color,
                position
            ) {
                const geometry = new THREE.SphereGeometry(
                    radius,
                    16,
                    16
                );

                const material = new THREE.MeshStandardMaterial({
                    color,
                    metalness: 0.3,
                    roughness: 0.3
                });

                const satellite = new THREE.Mesh(
                    geometry,
                    material
                );

                satellite.position.copy(position);

                orbitGroup.add(satellite);

                return satellite;
            }


            const satelliteOne = createSatellite(
                0.055,
                highlightColor,
                new THREE.Vector3(1.48, 0, 0)
            );

            const satelliteTwo = createSatellite(
                0.038,
                sceneMaterialColor,
                new THREE.Vector3(-1.68, 0, 0)
            );

            const satelliteThree = createSatellite(
                0.032,
                highlightColor,
                new THREE.Vector3(0, 1.32, 0)
            );


            /* -----------------------------------------------
               PARTICLE FIELD
            ----------------------------------------------- */

            function createParticleField(count = 180) {
                const positions = new Float32Array(count * 3);

                const sizes = new Float32Array(count);

                for (let i = 0; i < count; i++) {
                    positions[i * 3] = random(-5.0, 5.0);

                    positions[i * 3 + 1] = random(-4.2, 4.2);

                    positions[i * 3 + 2] = random(-5.0, 2.0);

                    sizes[i] = random(0.6, 1.8);
                }

                const geometry =
                    new THREE.BufferGeometry();

                geometry.setAttribute(
                    "position",
                    new THREE.BufferAttribute(positions, 3)
                );

                geometry.setAttribute(
                    "size",
                    new THREE.BufferAttribute(sizes, 1)
                );

                const material =
                    new THREE.PointsMaterial({
                        color: sceneMaterialColor,
                        size: 0.022,
                        transparent: true,
                        opacity: 0.63,
                        sizeAttenuation: true,
                        depthWrite: false
                    });

                const points = new THREE.Points(
                    geometry,
                    material
                );

                scene.add(points);

                return points;
            }

            particleField = createParticleField(
                isSmallScreen ? 100 : 190
            );


            /* -----------------------------------------------
               NETWORK NODES AND CONNECTING LINES
            ----------------------------------------------- */

            function createNetwork() {
                const nodeCount = isSmallScreen ? 28 : 48;

                const vertices = [];

                for (let i = 0; i < nodeCount; i++) {
                    vertices.push(
                        new THREE.Vector3(
                            random(-2.8, 2.8),
                            random(-2.5, 2.5),
                            random(-1.8, 0.9)
                        )
                    );
                }

                const linePositions = [];

                // Har tugun faqat yaqin tugunlar bilan ulanadi.
                for (let i = 0; i < vertices.length; i++) {
                    for (let j = i + 1; j < vertices.length; j++) {
                        const distance = vertices[i].distanceTo(
                            vertices[j]
                        );

                        if (
                            distance < 1.08 &&
                            Math.random() > 0.3
                        ) {
                            linePositions.push(
                                vertices[i].x,
                                vertices[i].y,
                                vertices[i].z,

                                vertices[j].x,
                                vertices[j].y,
                                vertices[j].z
                            );
                        }
                    }
                }

                const geometry =
                    new THREE.BufferGeometry();

                geometry.setAttribute(
                    "position",
                    new THREE.Float32BufferAttribute(
                        linePositions,
                        3
                    )
                );

                const material =
                    new THREE.LineBasicMaterial({
                        color: mutedColor,
                        transparent: true,
                        opacity: 0.19,
                        depthWrite: false
                    });

                const lines = new THREE.LineSegments(
                    geometry,
                    material
                );

                scene.add(lines);

                // Alohida kichik nuqtalar.
                const pointPositions = [];

                vertices.forEach((vertex) => {
                    pointPositions.push(
                        vertex.x,
                        vertex.y,
                        vertex.z
                    );
                });

                const pointGeometry =
                    new THREE.BufferGeometry();

                pointGeometry.setAttribute(
                    "position",
                    new THREE.Float32BufferAttribute(
                        pointPositions,
                        3
                    )
                );

                const pointMaterial =
                    new THREE.PointsMaterial({
                        color: highlightColor,
                        size: 0.028,
                        transparent: true,
                        opacity: 0.7,
                        sizeAttenuation: true
                    });

                const points = new THREE.Points(
                    pointGeometry,
                    pointMaterial
                );

                scene.add(points);

                return { lines, points };
            }

            const network = createNetwork();

            networkLines = network.lines;


            /* -----------------------------------------------
               RESPONSIVE RESIZE
            ----------------------------------------------- */

            function resizeThreeScene() {
                if (disposed || !renderer || !camera) return;

                const width = Math.max(
                    1,
                    threeStage.clientWidth
                );

                const height = Math.max(
                    1,
                    threeStage.clientHeight
                );

                camera.aspect = width / height;

                camera.position.z = width < 420 ? 7.8 : 6.8;

                camera.updateProjectionMatrix();

                renderer.setSize(
                    width,
                    height,
                    false
                );

                renderStaticScene();
            }


            /* -----------------------------------------------
               STATIC RENDER
            ----------------------------------------------- */

            function renderStaticScene() {
                if (
                    !renderer ||
                    !scene ||
                    !camera ||
                    disposed
                ) {
                    return;
                }

                renderer.render(scene, camera);
            }


            /* -----------------------------------------------
               ANIMATION LOOP
            ----------------------------------------------- */

            function animateThreeScene() {
                if (
                    disposed ||
                    isPageHidden ||
                    prefersReducedMotion
                ) {
                    animationFrame = null;
                    return;
                }

                animationFrame =
                    requestAnimationFrame(animateThreeScene);

                const elapsed = clock.getElapsedTime();

                // Markaziy shaklning sekin 3D aylanishi.
                if (core) {
                    core.rotation.x =
                        Math.sin(elapsed * 0.23) * 0.15 +
                        pointerCurrentY * 0.12;

                    core.rotation.y =
                        elapsed * 0.18 +
                        pointerCurrentX * 0.15;
                }

                if (wireCore) {
                    wireCore.rotation.x =
                        -elapsed * 0.11 +
                        pointerCurrentY * 0.12;

                    wireCore.rotation.y =
                        elapsed * 0.15 +
                        pointerCurrentX * 0.13;
                }

                // Orbitlar turli tezliklarda aylanadi.
                if (orbitGroup) {
                    orbitGroup.rotation.x =
                        Math.sin(elapsed * 0.18) * 0.16 +
                        pointerCurrentY * 0.09;

                    orbitGroup.rotation.y =
                        elapsed * 0.1 +
                        pointerCurrentX * 0.1;
                }

                // Satellitlarning kichik pulsatsiyasi.
                const pulse =
                    1 + Math.sin(elapsed * 1.2) * 0.1;

                satelliteOne.scale.setScalar(pulse);

                satelliteTwo.scale.setScalar(
                    1 + Math.sin(elapsed * 1.55 + 1) * 0.12
                );

                satelliteThree.scale.setScalar(
                    1 + Math.sin(elapsed * 1.4 + 2) * 0.1
                );

                // Yengil chuqurlik va parallax.
                if (mainGroup) {
                    mainGroup.rotation.z =
                        Math.sin(elapsed * 0.12) * 0.055;

                    mainGroup.position.y =
                        Math.sin(elapsed * 0.42) * 0.055;
                }

                if (particleField) {
                    particleField.rotation.y =
                        elapsed * 0.012;

                    particleField.rotation.x =
                        Math.sin(elapsed * 0.08) * 0.025;
                }

                if (networkLines) {
                    networkLines.rotation.y =
                        -elapsed * 0.018;
                }

                // Sichqoncha harakatiga yumshoq javob.
                pointerCurrentX = lerp(
                    pointerCurrentX,
                    pointerTargetX,
                    0.035
                );

                pointerCurrentY = lerp(
                    pointerCurrentY,
                    pointerTargetY,
                    0.035
                );

                renderer.render(scene, camera);
            }


            /* -----------------------------------------------
               POINTER INTERACTION
            ----------------------------------------------- */

            function updateThreePointer(event) {
                const rect =
                    threeStage.getBoundingClientRect();

                if (
                    rect.width <= 0 ||
                    rect.height <= 0
                ) {
                    return;
                }

                pointerTargetX = clamp(
                    ((event.clientX - rect.left) / rect.width - 0.5) * 2,
                    -1,
                    1
                );

                pointerTargetY = clamp(
                    ((event.clientY - rect.top) / rect.height - 0.5) * 2,
                    -1,
                    1
                );
            }

            function resetThreePointer() {
                pointerTargetX = 0;
                pointerTargetY = 0;
            }

            if (!isSmallScreen) {
                threeStage.addEventListener(
                    "pointermove",
                    updateThreePointer,
                    { passive: true }
                );

                threeStage.addEventListener(
                    "pointerleave",
                    resetThreePointer
                );
            }


            /* -----------------------------------------------
               VISIBILITY AND RESOURCE CLEANUP
            ----------------------------------------------- */

            function onVisibilityChange() {
                isPageHidden = document.hidden;

                if (isPageHidden) {
                    if (animationFrame !== null) {
                        cancelAnimationFrame(animationFrame);

                        animationFrame = null;
                    }
                } else {
                    if (!prefersReducedMotion && !disposed) {
                        clock.start();
                        animateThreeScene();
                    } else {
                        renderStaticScene();
                    }
                }
            }

            document.addEventListener(
                "visibilitychange",
                onVisibilityChange
            );


            /* -----------------------------------------------
               START SCENE
            ----------------------------------------------- */

            resizeThreeScene();

            if ("ResizeObserver" in window) {
                const resizeObserver = new ResizeObserver(() => {
                    resizeThreeScene();
                });

                resizeObserver.observe(threeStage);
            } else {
                window.addEventListener(
                    "resize",
                    resizeThreeScene,
                    { passive: true }
                );
            }

            if (!prefersReducedMotion && !isPageHidden) {
                animateThreeScene();
            } else {
                renderStaticScene();
            }


            /* -----------------------------------------------
               CONTROLLER
            ----------------------------------------------- */

            threeSceneController = {
                render: renderStaticScene,

                dispose() {
                    disposed = true;

                    if (animationFrame !== null) {
                        cancelAnimationFrame(animationFrame);
                    }

                    document.removeEventListener(
                        "visibilitychange",
                        onVisibilityChange
                    );

                    if (renderer) {
                        renderer.dispose();
                    }
                }
            };

        } catch (error) {
            console.error(
                "Three.js sahnasini yaratishda xatolik:",
                error
            );

            createFallbackOrb();
        }
    }

    initThreeScene();


    /* =========================================================
       18. SECTION HOVER INTERACTION
    ========================================================= */

    function initInteractiveElements() {
        const interactiveElements = $$(
            ".button, .header-cta, .text-link, .social-links a"
        );

        interactiveElements.forEach((element) => {
            element.addEventListener("pointerenter", () => {
                element.classList.add("is-interacting");
            });

            element.addEventListener("pointerleave", () => {
                element.classList.remove("is-interacting");
            });
        });
    }

    initInteractiveElements();


    /* =========================================================
       19. RASM GALEREYASI VA KONTENT YUKLANISHI
    ========================================================= */

    function initPageLoadState() {
        const images = $$("img");

        images.forEach((img) => {
            if (img.loading !== "lazy") {
                img.loading = "lazy";
            }
        });

        window.addEventListener("load", () => {
            body.classList.add("page-loaded");

            requestScrollUpdate();

            if (
                threeSceneController &&
                typeof threeSceneController.render === "function"
            ) {
                threeSceneController.render();
            }
        }, { once: true });
    }

    initPageLoadState();


    /* =========================================================
       20. KIBER / 3D HUD — YENGIL DEKORATIV EFFEKT
    ========================================================= */

    function initHeroHUD() {
        if (!hero || prefersReducedMotion) return;

        let frameQueued = false;

        function updateHUD() {
            const scrollTop = window.scrollY;

            const heroHeight = Math.max(
                hero.offsetHeight,
                1
            );

            const progress = clamp(
                scrollTop / heroHeight,
                0,
                1
            );

            hero.style.setProperty(
                "--hero-scroll-progress",
                progress.toFixed(3)
            );

            frameQueued = false;
        }

        function requestUpdate() {
            if (frameQueued) return;

            frameQueued = true;

            requestAnimationFrame(updateHUD);
        }

        window.addEventListener(
            "scroll",
            requestUpdate,
            { passive: true }
        );

        updateHUD();
    }

    initHeroHUD();


    /* =========================================================
       21. REDUCED MOTION — ANIMATSIYANI BOSHQARISH
    ========================================================= */

    function initMotionPreferences() {
        const motionQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        );

        function handleMotionChange(event) {
            body.classList.toggle(
                "reduced-motion",
                event.matches
            );

            if (event.matches) {
                $$(".reveal").forEach((element) => {
                    element.classList.add("is-visible");
                });

                if (
                    threeSceneController &&
                    typeof threeSceneController.render === "function"
                ) {
                    threeSceneController.render();
                }
            }
        }

        if (motionQuery.addEventListener) {
            motionQuery.addEventListener(
                "change",
                handleMotionChange
            );
        } else if (motionQuery.addListener) {
            motionQuery.addListener(handleMotionChange);
        }
    }

    initMotionPreferences();


    /* =========================================================
       22. HASH O'ZGARISHI VA MENYU HOLATI
    ========================================================= */

    window.addEventListener("hashchange", () => {
        closeMenu();
    });


    /* =========================================================
       23. FOYDALANUVCHI SAHIFADAN CHIQGANDA
    ========================================================= */

    document.addEventListener("visibilitychange", () => {
        isPageHidden = document.hidden;

        if (isPageHidden) {
            // Foydalanuvchi boshqa sahifaga o'tsa,
            // fon musiqasini majburan davom ettirmaymiz.
            // Audio foydalanuvchi tanloviga ko'ra boshqariladi.
        }
    });


    /* =========================================================
       24. DASTLABKI YAKUNIY SOZLASH
    ========================================================= */

    function initializePortfolio() {
        updateScrollUI();

        closeMenu();

        // Rasm xatolari uchun galereya modalini
        // faqat kerak bo'lganda yaratamiz.
        body.classList.add("portfolio-initialized");

        console.info(
            "Abrorbek portfolio: interaktiv tizim ishga tushdi."
        );
    }

    initializePortfolio();


})();