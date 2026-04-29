const stage = document.querySelector(".snap-stage");
const header = document.querySelector(".site-header");
const navShell = document.querySelector(".nav-shell");
const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
const navLinks = [...document.querySelectorAll(".nav-link")];
const screens = [...document.querySelectorAll(".screen")];
const carousel = document.querySelector(".home-carousel");
const carouselTrack = document.querySelector(".carousel-track");
const carouselSlides = [...document.querySelectorAll(".home-slide")];
const carouselDots = [...document.querySelectorAll(".carousel-dots span")];
const waitlistModal = document.querySelector(".waitlist-modal");
const waitlistTriggers = [...document.querySelectorAll(".waitlist-trigger")];
const waitlistClosers = [...document.querySelectorAll("[data-waitlist-close]")];
let activeSlide = 1;
let scrollFrame = 0;
let carouselPointerId = null;
let carouselStartX = 0;
let carouselDeltaX = 0;
let carouselScrollFrame = 0;

const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    const nav = visible.target.dataset.nav;
    header.dataset.theme = visible.target.dataset.header || "light";
    visible.target.classList.add("is-visible");

    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.dataset.target === nav);
    });
  },
  {
    root: stage,
    threshold: [0.45, 0.65, 0.85],
  }
);

screens.forEach((screen) => observer.observe(screen));

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function updateHomeCarousel() {
  if (!carousel || !carouselTrack || !carouselSlides.length) return;

  const isMobileCarousel = window.matchMedia("(max-width: 900px)").matches;
  const slideWidth = carouselSlides[0].getBoundingClientRect().width;

  if (isMobileCarousel) {
    carouselTrack.style.transform = "";

    carouselSlides.forEach((slide, index) => {
      slide.classList.toggle("is-active", index === activeSlide);
    });

    carouselDots.forEach((dot, index) => {
      dot.classList.toggle("active", index === activeSlide);
    });

    return;
  }

  const gap = parseFloat(getComputedStyle(carouselTrack).columnGap) || 24;
  const leftInset = Math.min(24, Math.max(0, (window.innerWidth - slideWidth) / 2));
  const offset = leftInset - activeSlide * (slideWidth + gap);

  carouselTrack.style.transform = `translate3d(${offset}px, 0, 0)`;

  carouselSlides.forEach((slide, index) => {
    slide.classList.toggle("is-active", index === activeSlide);
  });

  carouselDots.forEach((dot, index) => {
    dot.classList.toggle("active", index === activeSlide);
  });
}

function setActiveSlide(index) {
  activeSlide = (index + carouselSlides.length) % carouselSlides.length;

  if (carousel && window.matchMedia("(max-width: 900px)").matches) {
    carouselSlides[activeSlide]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }

  updateHomeCarousel();
}

function updateMobileCarouselFromScroll() {
  if (!carousel || !carouselSlides.length || !window.matchMedia("(max-width: 900px)").matches) {
    carouselScrollFrame = 0;
    return;
  }

  const carouselCenter = carousel.getBoundingClientRect().left + carousel.clientWidth / 2;
  let closestIndex = activeSlide;
  let closestDistance = Number.POSITIVE_INFINITY;

  carouselSlides.forEach((slide, index) => {
    const box = slide.getBoundingClientRect();
    const slideCenter = box.left + box.width / 2;
    const distance = Math.abs(slideCenter - carouselCenter);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  if (closestIndex !== activeSlide) {
    activeSlide = closestIndex;
  }

  updateHomeCarousel();
  carouselScrollFrame = 0;
}

function requestMobileCarouselUpdate() {
  if (carouselScrollFrame) return;
  carouselScrollFrame = requestAnimationFrame(updateMobileCarouselFromScroll);
}

function setMobileMenuOpen(isOpen) {
  if (!navShell || !mobileMenuToggle) return;
  navShell.classList.toggle("is-menu-open", isOpen);
  mobileMenuToggle.setAttribute("aria-expanded", String(isOpen));
}

function updateScrollEffects() {
  const viewport = stage.clientHeight;

  screens.forEach((screen) => {
    const box = screen.getBoundingClientRect();
    const visible = clamp(Math.min(box.bottom, viewport) - Math.max(box.top, 0), 0, viewport);
    const visibleRatio = visible / viewport;
    const progress = clamp((0.72 - visibleRatio) / 0.42, 0, 1);
    const opacity = 1 - progress * 0.24;
    screen.style.setProperty("--screen-opacity", opacity.toFixed(3));
  });

  scrollFrame = 0;
}

function requestScrollEffects() {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(updateScrollEffects);
}

document.querySelector(".carousel-button.previous")?.addEventListener("click", () => {
  setActiveSlide(activeSlide - 1);
});

document.querySelector(".carousel-button.next")?.addEventListener("click", () => {
  setActiveSlide(activeSlide + 1);
});

carouselDots.forEach((dot, index) => {
  dot.addEventListener("click", () => setActiveSlide(index));
});

carousel?.addEventListener("pointerdown", (event) => {
  if (window.matchMedia("(max-width: 900px)").matches) return;
  carouselPointerId = event.pointerId;
  carouselStartX = event.clientX;
  carouselDeltaX = 0;
  carousel.classList.add("is-dragging");
  carousel.setPointerCapture?.(event.pointerId);
});

carousel?.addEventListener("pointermove", (event) => {
  if (window.matchMedia("(max-width: 900px)").matches) return;
  if (carouselPointerId !== event.pointerId) return;
  carouselDeltaX = event.clientX - carouselStartX;
});

function finishCarouselSwipe(event) {
  if (window.matchMedia("(max-width: 900px)").matches) return;
  if (carouselPointerId !== event.pointerId) return;

  if (Math.abs(carouselDeltaX) > 44) {
    setActiveSlide(activeSlide + (carouselDeltaX < 0 ? 1 : -1));
  }

  carouselPointerId = null;
  carouselDeltaX = 0;
  carousel.classList.remove("is-dragging");
}

carousel?.addEventListener("pointerup", finishCarouselSwipe);
carousel?.addEventListener("pointercancel", finishCarouselSwipe);
carousel?.addEventListener("scroll", requestMobileCarouselUpdate, { passive: true });

mobileMenuToggle?.addEventListener("click", () => {
  setMobileMenuOpen(!navShell?.classList.contains("is-menu-open"));
});

document.addEventListener("click", (event) => {
  if (!navShell?.classList.contains("is-menu-open")) return;
  if (navShell.contains(event.target)) return;
  setMobileMenuOpen(false);
});

stage.addEventListener("scroll", requestScrollEffects, { passive: true });
window.addEventListener("resize", updateHomeCarousel);

updateHomeCarousel();
updateScrollEffects();

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.getElementById(link.dataset.target);
    if (!target) return;
    event.preventDefault();
    setMobileMenuOpen(false);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

function openWaitlist() {
  if (!waitlistModal) return;
  waitlistModal.classList.add("is-open");
  waitlistModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("waitlist-open");
}

function closeWaitlist() {
  if (!waitlistModal) return;
  waitlistModal.classList.remove("is-open");
  waitlistModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("waitlist-open");
}

waitlistTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    openWaitlist();
  });
});

waitlistClosers.forEach((closer) => {
  closer.addEventListener("click", closeWaitlist);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeWaitlist();
    setMobileMenuOpen(false);
  }
});

window.addEventListener("load", () => {
  const target = location.hash ? document.querySelector(location.hash) : null;

  requestAnimationFrame(() => {
    if (target) {
      stage.scrollTop = target.offsetTop;
    } else {
      stage.scrollTop = 0;
    }

    updateScrollEffects();
    setActiveSlide(activeSlide);
  });
});
