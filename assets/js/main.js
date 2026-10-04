// Portfolio filters + lightbox. Without JS the thumbnails simply link to the full images.
(() => {
  const gallery = document.getElementById("gallery");
  const chips = document.querySelectorAll(".chip");
  const tiles = [...gallery.querySelectorAll(".tile")];

  // ----- masonry: span grid rows by each photo's aspect ratio, so tiles flow left-to-right -----
  const ROW = 2;
  const layout = () => {
    const gap = parseFloat(getComputedStyle(gallery).columnGap) || 0;
    tiles.forEach((t) => {
      if (t.hidden) return;
      const img = t.querySelector("a > img");
      const h = t.offsetWidth * (img.height / img.width);
      t.style.gridRowEnd = `span ${Math.ceil((h + gap) / ROW)}`;
    });
  };
  gallery.classList.add("masonry");
  layout();
  new ResizeObserver(layout).observe(gallery);

  // ----- filters (the "All" view starts with a preview and a "show more" button) -----
  const PREVIEW = 16;
  const moreBtn = document.getElementById("show-more");
  let expanded = false;
  const applyFilter = (cat) => {
    chips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.filter === cat)));
    let shown = 0;
    tiles.forEach((t) => {
      const match = cat === "all" || t.dataset.cat === cat;
      t.hidden = !match || (cat === "all" && !expanded && shown >= PREVIEW);
      if (match) shown++;
    });
    moreBtn.hidden = cat !== "all" || expanded || shown <= PREVIEW;
    layout();
  };
  moreBtn.addEventListener("click", () => {
    expanded = true;
    const firstNew = tiles.find((t) => t.hidden);
    applyFilter("all");
    firstNew?.querySelector("a").focus({ preventScroll: true });
  });
  chips.forEach((chip) => chip.addEventListener("click", () => {
    applyFilter(chip.dataset.filter);
    const hash = chip.dataset.filter === "all" ? "#work" : `#work/${chip.dataset.filter}`;
    history.replaceState(null, "", hash);
  }));
  const initial = location.hash.match(/^#work\/([\w-]+)$/);
  applyFilter(initial && [...chips].some((c) => c.dataset.filter === initial[1]) ? initial[1] : "all");

  // ----- opening hours: highlight today (in Greek time) -----
  const hours = document.querySelector(".hours");
  if (hours) {
    const day = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Athens", weekday: "short" }).format(new Date());
    const n = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day);
    const row = hours.querySelector(`tr[data-day="${n}"]`);
    if (row) {
      row.classList.add("today");
      row.querySelector("th").dataset.label = hours.dataset.todayLabel;
    }
  }

  // ----- lightbox -----
  const box = document.getElementById("lightbox");
  if (!box || typeof box.showModal !== "function") return;
  const img = box.querySelector("img");
  const cap = box.querySelector(".cap");
  const count = box.querySelector(".count");
  let slides = [];
  let index = 0;

  const show = (i) => {
    index = (i + slides.length) % slides.length;
    const s = slides[index];
    img.src = s.src;
    img.width = s.w;
    img.height = s.h;
    img.alt = s.caption;
    cap.textContent = s.caption;
    count.textContent = slides.length > 1 ? `${index + 1} / ${slides.length}` : "";
    // warm the cache for the neighbours
    [index + 1, index - 1].forEach((n) => {
      const next = slides[(n + slides.length) % slides.length];
      if (next) new Image().src = next.src;
    });
  };

  gallery.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-slides]");
    if (!link || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    // every photo of every visible tile, in order; before/after sets expand into their stages
    slides = [];
    let start = 0;
    tiles.filter((t) => !t.hidden).forEach((t) => {
      const a = t.querySelector("a[data-slides]");
      if (a === link) start = slides.length;
      slides.push(...JSON.parse(a.dataset.slides));
    });
    box.showModal();
    show(start);
  });

  box.addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "close" || e.target === box || e.target.tagName === "FIGURE") box.close();
    else if (act === "prev") show(index - 1);
    else if (act === "next") show(index + 1);
  });
  box.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });
  box.addEventListener("close", () => { img.removeAttribute("src"); });

  // swipe on touch screens
  let x0 = null;
  box.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    x0 = null;
  });
})();
