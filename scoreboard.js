import { SCOREBOARD_DATA } from "./scoreboard-data.js";

const GRADE_ORDER = ["A+", "A", "B", "C", "D", "F"];
const GRADE_LABELS = {
  "A+": "A+ Tier",
  A: "A Tier",
  B: "B Tier",
  C: "C Tier",
  D: "D Tier",
  F: "F Tier"
};
const DEFAULT_TIER_DESCRIPTIONS = {
  "A+": "Setting the pace and defining the room standard.",
  A: "Strong momentum with real consistency and presence.",
  B: "Active, improving, and moving in the right direction.",
  C: "In the mix, but needs stronger follow-through.",
  D: "Some signs of life, but not enough pressure yet.",
  F: "Not enough visible movement on the board."
};
const TREND_LABELS = {
  up: "Up",
  down: "Down",
  hold: "Hold",
  new: "New"
};
const EXCLUDED_FROM_REPORT = new Set([
  "Mike Quinn",
  "Glenn Piccolo",
  "Charlie Zlatkos",
  "Joe Adams",
  "Patty Adams",
  "Gary Walker",
  "Bill Broussard",
  "Bill Brusard",
  "Bill Bersard",
  "Michael Floyd",
  "Jose Garcia"
]);
const MVP_EXCLUDED = new Set([
  "Mike Quinn",
  "Joe Adams",
  "Patty Adams",
  "Charlie Zlatkos",
  "Todd Hayes",
  "Gary Walker",
  "Bill Broussard",
  "Bill Brusard",
  "Bill Bersard",
  "Jose Garcia",
  "Glenn Piccolo",
  "Michael Floyd"
]);

const app = document.querySelector("#scoreboard-app");

render();

function render() {
  const members = (SCOREBOARD_DATA.members || []).filter(shouldDisplayMember);
  const rankedMembers = buildRankedMembers(members);
  const rankLookup = new Map(rankedMembers.map((member, index) => [member.name, index + 1]));
  const tiers = buildTiers(members, rankLookup);
  const mvp = rankedMembers.find((member) => !MVP_EXCLUDED.has(member.name)) || null;
  const spotlight = buildSpotlight(mvp, rankedMembers);

  app.innerHTML = `
    <div class="arena-shell">
      <div class="arena-shell__glow arena-shell__glow--left"></div>
      <div class="arena-shell__glow arena-shell__glow--right"></div>

      <header class="hero-board">
        <div class="hero-board__scanline"></div>
        <div class="hero-board__meta">
          <span class="eyebrow">Film Room Report Card</span>
          <span class="stamp">${escapeHtml(SCOREBOARD_DATA.stamp || "")}</span>
        </div>
        <div class="hero-board__body">
          <div class="hero-board__copy">
            <span class="hero-board__kicker">Live Jumbotron</span>
            <h1>${escapeHtml(SCOREBOARD_DATA.title || "Film Room Report Card")}</h1>
            <p>${escapeHtml(SCOREBOARD_DATA.subtitle || "")}</p>
          </div>
          <div class="hero-board__stats">
            ${renderHeroPanel("Current MVP", mvp ? mvp.name : "TBD", mvp ? `${mvp.grade} • ${mvp.points} pts` : "No leader yet")}
            ${renderHeroPanel("Visible Board", String(members.length), "Ranked live right now")}
            ${renderHeroPanel("Board Style", "Jumbotron", "Permanent live link")}
          </div>
        </div>
        <div class="ticker">
          <span class="ticker__label">Live Feed</span>
          <div class="ticker__viewport">
            <div class="ticker__track">
              <span>${escapeHtml(buildTickerCopy(mvp, spotlight))}</span>
              <span>${escapeHtml(buildTickerCopy(mvp, spotlight))}</span>
            </div>
          </div>
        </div>
      </header>

      <section class="spotlight-section">
        <div class="section-head">
          <div>
            <span class="section-kicker">Top Board</span>
            <h2>Jumbotron Leaders</h2>
          </div>
        </div>
        <div class="spotlight-grid">
          ${spotlight.map((member, index) => renderSpotlightCard(member, index + 1)).join("")}
        </div>
      </section>

      <section class="tier-deck">
        ${tiers.map((tier) => renderTier(tier)).join("")}
      </section>

      <section class="grading-board">
        <div class="section-head">
          <div>
            <span class="section-kicker">Grading Standard</span>
            <h2>${escapeHtml(SCOREBOARD_DATA.gradingTitle || "How I Grade This")}</h2>
          </div>
        </div>
        <p>${escapeHtml(SCOREBOARD_DATA.gradingIntro || "")}</p>
        <ul class="grading-list">
          ${(SCOREBOARD_DATA.basis || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
        <p>${escapeHtml(SCOREBOARD_DATA.gradingStandard || "")}</p>
      </section>
    </div>
  `;
}

function renderHeroPanel(label, value, meta) {
  return `
    <div class="hero-panel">
      <span class="hero-panel__label">${escapeHtml(label)}</span>
      <strong class="hero-panel__value">${escapeHtml(value)}</strong>
      <span class="hero-panel__meta">${escapeHtml(meta)}</span>
    </div>
  `;
}

function buildTickerCopy(mvp, spotlight) {
  const parts = [];
  if (mvp) {
    parts.push(`${mvp.name} leads the Film Room at ${mvp.points} points.`);
  }
  if (spotlight[1]) {
    parts.push(`${spotlight[1].name} is chasing at ${spotlight[1].points} points.`);
  }
  if (spotlight[2]) {
    parts.push(`${spotlight[2].name} is still climbing at ${spotlight[2].points}.`);
  }
  if (SCOREBOARD_DATA.leadersSummary) {
    parts.push(SCOREBOARD_DATA.leadersSummary);
  }
  return parts.join("  •  ");
}

function shouldDisplayMember(member) {
  return !EXCLUDED_FROM_REPORT.has(member.name);
}

function buildRankedMembers(members) {
  return GRADE_ORDER.flatMap((grade) =>
    members
      .filter((member) => member.grade === grade)
      .sort(compareMembers)
  );
}

function buildTiers(members, rankLookup) {
  return GRADE_ORDER
    .map((grade) => ({
      grade,
      label: GRADE_LABELS[grade] || grade,
      description: (SCOREBOARD_DATA.tierDescriptions || DEFAULT_TIER_DESCRIPTIONS)[grade] || "",
      members: members
        .filter((member) => member.grade === grade)
        .sort(compareMembers)
        .map((member) => ({
          ...member,
          rank: rankLookup.get(member.name) || 0
        }))
    }))
    .filter((tier) => tier.members.length > 0);
}

function buildSpotlight(mvp, rankedMembers) {
  const spotlight = [];
  const seen = new Set();

  if (mvp) {
    spotlight.push(mvp);
    seen.add(mvp.name);
  }

  for (const member of rankedMembers) {
    if (seen.has(member.name)) {
      continue;
    }
    spotlight.push(member);
    seen.add(member.name);
    if (spotlight.length === 4) {
      break;
    }
  }

  return spotlight;
}

function renderSpotlightCard(member, rank) {
  return `
    <article class="spotlight-card spotlight-card--rank-${rank}">
      <div class="spotlight-card__top">
        <span class="spotlight-rank">#${rank}</span>
        <div class="spotlight-card__chips">
          <span class="grade-chip grade-chip--${toGradeClass(member.grade)}">${escapeHtml(member.grade)}</span>
          <span class="score-chip">${escapeHtml(member.points || 0)} pts</span>
          ${renderTrendChip(member.trend)}
        </div>
      </div>
      <h3>${escapeHtml(member.name)}</h3>
      <span class="member-note">${escapeHtml(member.note || "")}</span>
      ${renderModifierLine(member)}
      <p class="member-line"><strong>Doing:</strong> ${escapeHtml(member.doing || "Not enough visible work yet.")}</p>
      <p class="member-line"><strong>Step Up:</strong> ${escapeHtml(member.improve || "Keep stacking visible reps.")}</p>
    </article>
  `;
}

function renderTier(tier) {
  return `
    <section class="tier-board tier-board--${toGradeClass(tier.grade)}">
      <div class="tier-board__head">
        <div>
          <span class="section-kicker">${escapeHtml(tier.label)}</span>
          <h2>${escapeHtml(tier.description)}</h2>
        </div>
        <span class="tier-count">${tier.members.length}</span>
      </div>
      <div class="member-grid">
        ${tier.members.map((member) => renderMember(member)).join("")}
      </div>
    </section>
  `;
}

function renderMember(member) {
  return `
    <article class="member-card">
      <div class="member-card__top">
        <div class="member-card__identity">
          <span class="member-rank">${escapeHtml(member.rank || 0)}</span>
          <div>
            <h3>${escapeHtml(member.name)}</h3>
            <span class="member-note">${escapeHtml(member.note || "")}</span>
          </div>
        </div>
        <div class="member-card__meta">
          <span class="grade-chip grade-chip--${toGradeClass(member.grade)}">${escapeHtml(member.grade)}</span>
          <span class="score-chip">${escapeHtml(member.points || 0)} pts</span>
          ${renderTrendChip(member.trend)}
        </div>
      </div>
      ${renderModifierLine(member)}
      <p class="member-line"><strong>Doing:</strong> ${escapeHtml(member.doing || "Not enough visible work yet.")}</p>
      <p class="member-line"><strong>Step Up:</strong> ${escapeHtml(member.improve || "Add more visible reps.")}</p>
    </article>
  `;
}

function renderModifierLine(member) {
  if (!member.modifier) {
    return "";
  }

  return `<p class="member-line member-line--modifier"><strong>Modifier:</strong> ${escapeHtml(member.modifier)}</p>`;
}

function compareMembers(a, b) {
  const pointDiff = (b.points || 0) - (a.points || 0);
  if (pointDiff !== 0) {
    return pointDiff;
  }

  return a.name.localeCompare(b.name);
}

function renderTrendChip(trend) {
  if (!trend) {
    return "";
  }

  const label = TREND_LABELS[trend] || trend;
  return `<span class="trend-chip trend-chip--${escapeHtml(trend)}">${escapeHtml(label)}</span>`;
}

function toGradeClass(grade) {
  return grade.toLowerCase().replace("+", "plus");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
