/* ── PAGE NAVIGATION ─────────────────────────────────────── */
const PAGE_ORDER = [
  "home",
  "about",
  "admissions",
  "subjects",
  "timetable",
  "team",
  "song",
  "gallery",
  "contact",
];

function showPage(id) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll("#desktop-nav .nav-link")
    .forEach((l) => l.classList.remove("active"));
  const page = document.getElementById("page-" + id);
  if (page) page.classList.add("active");
  const idx = PAGE_ORDER.indexOf(id);
  const navBtns = document.querySelectorAll("#desktop-nav .nav-link");
  if (navBtns[idx]) navBtns[idx].classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
  setTimeout(initFadeIns, 100);
  if (id === "timetable") loadAllTimetables();
}

/* ── MOBILE NAV ──────────────────────────────────────────── */
function toggleMobileNav() {
  document.getElementById("mobile-nav").classList.toggle("open");
  document.getElementById("hamburger").classList.toggle("open");
}
function closeMobileNav() {
  document.getElementById("mobile-nav").classList.remove("open");
  document.getElementById("hamburger").classList.remove("open");
}
document.addEventListener("click", (e) => {
  if (
    !document.querySelector("header").contains(e.target) &&
    !document.getElementById("mobile-nav").contains(e.target)
  ) {
    closeMobileNav();
  }
});

/* ── CAROUSEL ────────────────────────────────────────────── */
let curSlide = 0;
const slides = document.querySelectorAll(".slide");
const dots = document.querySelectorAll(".dot");

function goToSlide(n) {
  slides[curSlide].classList.remove("active");
  dots[curSlide].classList.remove("active");
  curSlide = n;
  slides[curSlide].classList.add("active");
  dots[curSlide].classList.add("active");
}
setInterval(() => goToSlide((curSlide + 1) % slides.length), 5500);

/* ── COUNTERS ────────────────────────────────────────────── */
function animateCounter(el) {
  const target = parseInt(el.getAttribute("data-target"));
  const step = target / (2000 / 16);
  let cur = 0;
  const t = setInterval(() => {
    cur += step;
    if (cur >= target) {
      el.textContent = target.toLocaleString();
      clearInterval(t);
    } else el.textContent = Math.floor(cur).toLocaleString();
  }, 16);
}
function initCounters() {
  document.querySelectorAll("[data-target]").forEach((el) => {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        animateCounter(el);
        obs.disconnect();
      }
    });
    obs.observe(el);
  });
}

/* ── FADE IN ─────────────────────────────────────────────── */
function initFadeIns() {
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.08 },
  );
  document
    .querySelectorAll(".fade-in:not(.visible)")
    .forEach((el) => obs.observe(el));
}

/* ── CSV PARSER ──────────────────────────────────────────── */
function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  return lines
    .slice(1)
    .map((line) => {
      /* handle commas inside quoted fields */
      const cols = [];
      let cur = "",
        inQ = false;
      for (let ch of line) {
        if (ch === '"') {
          inQ = !inQ;
        } else if (ch === "," && !inQ) {
          cols.push(cur.trim());
          cur = "";
        } else cur += ch;
      }
      cols.push(cur.trim());
      const obj = {};
      headers.forEach((h, i) => (obj[h] = (cols[i] || "").replace(/"/g, "")));
      return obj;
    })
    .filter((r) => Object.values(r).some((v) => v));
}

/* ── FETCH SHEET OR FALL BACK TO SAMPLE ─────────────────── */
async function fetchSheet(url, sampleKey) {
  if (!url || url.includes("YOUR_")) return SAMPLE[sampleKey];
  try {
    const r = await fetch(url);
    const text = await r.text();
    const rows = parseCSV(text);
    return rows.length ? rows : SAMPLE[sampleKey];
  } catch {
    return SAMPLE[sampleKey];
  }
}

/* ── NEWS RENDERER ───────────────────────────────────────── */
const NEWS_GRADIENTS = [
  "linear-gradient(135deg,#dbeafe,#bfdbfe)",
  "linear-gradient(135deg,#fef3c7,#fde68a)",
  "linear-gradient(135deg,#ede9fe,#ddd6fe)",
];

async function loadNews() {
  const container = document.getElementById("news-container");
  if (!container) return;
  container.innerHTML =
    '<div class="loading-state"><div class="spinner"></div><p>Loading news…</p></div>';
  const items = await fetchSheet(SHEETS.news, "news");
  if (!items.length) {
    container.innerHTML =
      '<div class="empty-state"><div class="empty-icon">📰</div><p>No news available at this time.</p></div>';
    return;
  }
  container.innerHTML = `<div class="news-grid">${items
    .slice(0, 3)
    .map(
      (item, i) => `
      <div class="news-card">
        <div class="news-img" style="background:${NEWS_GRADIENTS[i % 3]}">${item.icon || item.Icon || "📰"}</div>
        <div class="news-body">
          <div class="news-meta">
            <span class="news-category">${item.category || item.Category || "News"}</span>
            <span class="news-date">${item.date || item.Date || ""}</span>
          </div>
          <h3>${item.title || item.Title || ""}</h3>
          <p>${item.description || item.Description || ""}</p>
        </div>
      </div>`,
    )
    .join("")}</div>`;
}

/* ── EVENTS RENDERER ─────────────────────────────────────── */
async function loadEvents() {
  const container = document.getElementById("events-container");
  if (!container) return;
  container.innerHTML =
    '<div class="loading-state"><div class="spinner"></div><p>Loading events…</p></div>';
  const items = await fetchSheet(SHEETS.events, "events");
  if (!items.length) {
    container.innerHTML =
      '<div class="empty-state"><div class="empty-icon">📅</div><p>No upcoming events at this time.</p></div>';
    return;
  }
  container.innerHTML = `<div class="events-list">${items
    .map(
      (item) => `
      <div class="event-item">
        <div class="event-date-box">
          <div class="event-day">${item.date || item.Date || "—"}</div>
          <div class="event-month">${item.month || item.Month || ""}</div>
        </div>
        <div class="event-info">
          <h4>${item.name || item["Event Name"] || item.event || ""}</h4>
          <p>${item.description || item.Description || ""}</p>
        </div>
        <div class="event-icon">${item.icon || item.Icon || "📅"}</div>
      </div>`,
    )
    .join("")}</div>`;
}

/* ── ANNOUNCEMENTS ───────────────────────────────────────── */
async function loadAnnouncements() {
  const bar = document.getElementById("announcement-bar");
  const text = document.getElementById("announcement-text");
  const items = await fetchSheet(SHEETS.announcements, "announcements");
  const active = items.find(
    (i) => (i.active || i.Active || "").toUpperCase() === "YES",
  );
  if (active) {
    text.textContent = `📢 ${active.message || active.Message || ""}`;
    bar.classList.add("show");
  }
}

function closeAnnouncement() {
  document.getElementById("announcement-bar").classList.remove("show");
}

/* ── TIMETABLE — GROUP BY DATE THEN BY TIME ─────────────── */
/*
  Logic:
  - Group rows by date → each date = one day block
  - Within each date, group by time → same start time = one session block
  - Same time = written simultaneously (different subjects/venues listed together)
  - Different times = separate session blocks (AM / PM)

  Sheet example:
    10 Jun | Monday | English P1   | 09:00 | 2 hrs | Hall A  ─┐ Session 1
    10 Jun | Monday | Afrikaans P1 | 09:00 | 2 hrs | Hall B  ─┘ (same time)
    10 Jun | Monday | English P2   | 14:00 | 2 hrs | Hall A     Session 2
*/
function groupByDateThenTime(rows) {
  const dateMap = new Map();
  rows.forEach(row => {
    const date    = (row.date    || row.Date    || '').trim();
    const day     = (row.day     || row.Day     || '').trim();
    const time    = (row.time    || row.Time    || row['Start Time'] || row.starttime || '').trim();
    const subject = (row.subject || row.Subject || '').trim();
    const duration= (row.duration|| row.Duration|| '').trim();
    const venue   = (row.venue   || row.Venue   || '').trim();
    if (!date) return;
    if (!dateMap.has(date)) dateMap.set(date, { day, timeSlots: new Map() });
    const dayGroup = dateMap.get(date);
    if (!dayGroup.timeSlots.has(time)) dayGroup.timeSlots.set(time, []);
    dayGroup.timeSlots.get(time).push({ subject, duration, venue });
  });
  return dateMap;
}

function isAMTime(time) {
  const hour = parseInt((time || '0').split(':')[0], 10);
  return hour < 12;
}

function renderTimetable(rows) {
  if (!rows || !rows.length) return '<div class="empty-state"><div class="empty-icon">📅</div><p>No timetable data available. Update the Google Sheet to populate this timetable.</p></div>';

  const dateMap = groupByDateThenTime(rows);
  let html = '';

  dateMap.forEach((dayGroup, date) => {
    const sessionCount = dayGroup.timeSlots.size;
    html += `<div class="tt-day-group">
      <div class="tt-day-header">
        <span class="tt-day-label">${date}</span>
        <span class="tt-day-name">${dayGroup.day}</span>
        ${sessionCount > 1 ? `<span class="meta-badge blue" style="margin-left:auto;font-size:.7rem;">${sessionCount} session${sessionCount > 1 ? 's' : ''}</span>` : ''}
      </div>
      <div class="tt-sessions">`;

    dayGroup.timeSlots.forEach((papers, time) => {
      const am = isAMTime(time);
      const pillClass = am ? '' : 'pm';
      const pillLabel = am ? 'AM' : 'PM';

      if (papers.length > 1) {
        /* Multiple subjects at the same time — one session block, list papers inside */
        html += `<div class="tt-session tt-session-multi">
          <div class="tt-time">${time}<span class="session-pill ${pillClass}">${pillLabel}</span></div>
          <div class="tt-multi-papers">
            ${papers.map(p => `
              <div class="tt-paper-row">
                <span class="tt-subject">${p.subject}</span>
                <span class="tt-duration">${p.duration}</span>
                <span class="tt-venue">${p.venue}</span>
              </div>`).join('')}
          </div>
        </div>`;
      } else {
        /* Single subject at this time — normal single row */
        const p = papers[0];
        html += `<div class="tt-session">
          <div class="tt-time">${time}<span class="session-pill ${pillClass}">${pillLabel}</span></div>
          <div class="tt-subject">${p.subject}</div>
          <div class="tt-duration">${p.duration}</div>
          <div class="tt-venue">${p.venue}</div>
        </div>`;
      }
    });

    html += `</div></div>`;
  });

  return html;
}


async function loadGradeTimetable(grade) {
  const key = `grade${grade}`;
  const url = SHEETS[key];
  const sKey = `grade${grade}`;
  const container = document.getElementById(`tt-${grade}`);
  if (!container) return;
  container.innerHTML =
    '<div class="loading-state"><div class="spinner"></div><p>Loading timetable…</p></div>';
  const rows = await fetchSheet(url, sKey);
  container.innerHTML = renderTimetable(rows);
}

async function loadAllTimetables() {
  await Promise.all([
    loadGradeTimetable(10),
    loadGradeTimetable(11),
    loadGradeTimetable(12),
  ]);
}

/* ── GRADE ACCORDION ─────────────────────────────────────── */
function toggleGrade(grade) {
  const item = document.getElementById(`gi-${grade}`);
  const isOpen = item.classList.contains("open");
  document
    .querySelectorAll(".grade-item")
    .forEach((i) => i.classList.remove("open"));
  if (!isOpen) item.classList.add("open");
}

/* ── PRINT TIMETABLE ─────────────────────────────────────── */
function printTimetable(grade) {
  const container = document.getElementById(`tt-${grade}`);
  if (!container) return;
  const win = window.open("", "_blank");
  win.document
    .write(`<!DOCTYPE html><html><head><title>Grade ${grade} Exam Timetable — Excellence High School</title>
  <style>
    body{font-family:sans-serif;padding:2rem;color:#111;}
    h1{color:#2563eb;font-size:1.4rem;margin-bottom:.25rem;}
    .sub{color:#666;font-size:.85rem;margin-bottom:2rem;}
    .tt-day-group{margin-bottom:1.5rem;}
    .tt-day-header{background:#f1f5f9;padding:.6rem 1rem;font-weight:700;font-size:.9rem;border:1px solid #e2e8f0;border-bottom:none;}
    .tt-sessions{border:1px solid #e2e8f0;}
    .tt-session{display:grid;grid-template-columns:100px 1fr 90px 120px;padding:.65rem 1rem;border-bottom:1px solid #f1f5f9;font-size:.85rem;gap:1rem;}
    .tt-session:last-child{border-bottom:none;}
    .tt-time{font-weight:700;color:#2563eb;}
    .footer{margin-top:2rem;font-size:.75rem;color:#999;border-top:1px solid #e2e8f0;padding-top:1rem;}
  </style></head><body>
  <h1>Excellence High School — Grade ${grade} Exam Timetable</h1>
  <div class="sub">Printed ${new Date().toLocaleDateString("en-ZA")} · info@excellencehigh.edu.za · +27 11 234 5678</div>
  ${container.innerHTML}
  <div class="footer">Excellence High School · 123 Education Avenue, Johannesburg · 2001 | Designed by Ambient Electron</div>
  </body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 600);
}

/* ── LOAD ALL DYNAMIC CONTENT ────────────────────────────── */
async function loadAllDynamic() {
  await Promise.all([loadNews(), loadEvents(), loadAnnouncements()]);
}

/* ── FORM ────────────────────────────────────────────────── */
function handleSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.textContent = "✓ Message Sent!";
  btn.style.background = "#10b981";
  setTimeout(() => {
    btn.textContent = "Send Message →";
    btn.style.background = "";
    e.target.reset();
  }, 3000);
}

/* ── DOWNLOADS ───────────────────────────────────────────── */
function fakeDownload(name) {
  alert(
    `"${name}" will download here.\n\nTo enable:\n1. Upload your PDF to the same folder as this HTML file\n2. Replace onclick with: window.open('filename.pdf')`,
  );
}

/* ── COOKIE ──────────────────────────────────────────────── */
function acceptCookie() {
  localStorage.setItem("ehs-cookie", "accepted");
  document.getElementById("cookie-banner").classList.remove("show");
}
function dismissCookie() {
  localStorage.setItem("ehs-cookie", "declined");
  document.getElementById("cookie-banner").classList.remove("show");
}

/* ── BACK TO TOP ─────────────────────────────────────────── */
window.addEventListener("scroll", () => {
  document
    .getElementById("back-top")
    .classList.toggle("show", window.scrollY > 400);
});

/* ── INIT ────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  initCounters();
  initFadeIns();
  loadAllDynamic();
  if (!localStorage.getItem("ehs-cookie")) {
    setTimeout(
      () => document.getElementById("cookie-banner").classList.add("show"),
      1800,
    );
  }
});
