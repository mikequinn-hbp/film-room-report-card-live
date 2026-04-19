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
  "Michael Floyd",
  "Jose Garcia"
]);
const MVP_EXCLUDED = new Set([
  "Mike Quinn",
  "Joe Adams",
  "Charlie Zlatkos",
  "Todd Hayes",
  "Bill Bersard",
  "Bill Bersard",
  "Jose Garcia",
  "Michael Floyd"
]);

const app = document.querySelector("#scoreboard-app");

render();

function render() {
  const members = (SCOREBOARD_DATA.members || []).filter(shouldDisplayMember);
  const mvp = buildMvp(members);
  const mvpPoints = mvp?.points || 0;
  const rankedMembers = buildTierRankList(members);
  const rankLookup = new Map(rankedMembers.map((member, index) => [member.name, index + 1]));
  const tiers = buildTiers(members, rankLookup);

  app.innerHTML = `
    <div class="report-shell">
      <div class="report-shell__glow report-shell__glow--left"></div>
      <div class="report-shell__glow report-shell__glow--right"></div>

      <header class="hero-card">
        <div class="hero-card__scanline"></div>
        <div class="hero-card__meta">
          <span class="eyebrow">Film Room Report Card</span>
          <span class="stamp">${escapeHtml(SCOREBOARD_DATA.stamp)}</span>
        </div>
        <div class="hero-card__body">
          <div class="hero-card__copy">
            <h1>${escapeHtml(SCOREBOARD_DATA.title)}</h1>
            <p>${escapeHtml(SCOREBOARD_DATA.subtitle)}</p>
          </div>
          <div class="hero-card__stats">
            ${renderHeroStat("Mode", "Live Link", "Digital board active")}
            ${renderHeroStat("Current MVP", mvp ? mvp.name : "TBD", mvp ? `${mvp.grade} • ${mvpPoints} pts` : "No leader yet")}
            ${renderHeroStat("Visible", String(members.length), "Ranked on the board")}
          </div>
        </div>
      </header>

      <section class="mvp-section">
        <div class="section-head">
          <div>
            <span class="section-kicker">Leaderboard</span>
            <h2>MVP</h2>
            <p>The live points leader on the board. This spot belongs to whoever is stacking the strongest visible score right now.</p>
          </div>
        </div>
        ${mvp ? renderMvp(mvp) : renderEmptyMvp()}
      </section>

      <section class="tiers-stack">
        ${tiers.map((tier) => renderTier(tier)).join("")}
      </section>

      <section class="grading-card">
        <span class="section-kicker">Grading Standard</span>
        <h2>${escapeHtml(SCOREBOARD_DATA.gradingTitle || "How I Grade This")}</h2>
        <p>${escapeHtml(SCOREBOARD_DATA.gradingIntro || "")}</p>
        <ul class="grading-list">
          ${SCOREBOARD_DATA.basis.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
        <p>${escapeHtml(SCOREBOARD_DATA.gradingStandard || "")}</p>
      </section>
    </div>
  `;
}

function renderHeroStat(label, value, meta) {
  return `
    <div class="hero-stat">
      <span class="hero-stat__label">${escapeHtml(label)}</span>
      <strong class="hero-stat__value">${escapeHtml(value)}</strong>
      <span class="hero-stat__meta">${escapeHtml(meta)}</span>
    </div>
  `;
}

function buildMvp(members) {
  return members
    .slice()
    .sort(compareMembers)
    .find((member) => !MVP_EXCLUDED.has(member.name)) || null;
}

function shouldDisplayMember(member) {
  return !EXCLUDED_FROM_REPORT.has(member.name);
}

function buildTierRankList(members) {
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

function renderMvp(member) {
  const points = member.points || 0;
  return `
    <article class="mvp-card mvp-card--${toGradeClass(member.grade)}">
      <div class="mvp-card__top">
        <div>
          <span class="section-kicker">Top Eligible Performer</span>
          <h3>${escapeHtml(member.name)}</h3>
          <span class="member-note">${escapeHtml(member.note || "")}</span>
        </div>
        <div class="mvp-card__meta">
          <span class="grade-chip grade-chip--${toGradeClass(member.grade)}">${escapeHtml(member.grade)}</span>
          <span class="score-chip">${escapeHtml(points)} pts</span>
          ${renderTrendChip(member.trend)}
        </div>
      </div>
      <p class="mvp-callout">${escapeHtml(member.name)} is holding the top live score right now with ${escapeHtml(points)} points.</p>
      ${renderModifierLine(member)}
      <p class="member-line"><strong>Doing:</strong> ${escapeHtml(member.doing || member.label || member.note || "")}</p>
      <p class="member-line"><strong>Step Up:</strong> ${escapeHtml(member.improve || "Keep stacking visible reps.")}</p>
    </article>
  `;
}

function renderEmptyMvp() {
  return `
    <article class="mvp-card">
      <div class="mvp-card__top">
        <div>
          <span class="section-kicker">Top Eligible Performer</span>
          <h3>No MVP Yet</h3>
        </div>
      </div>
      <p class="mvp-callout">No eligible person has built a lead on the live points board yet.</p>
      <p class="member-line"><strong>Doing:</strong> No eligible non-leadership person has separated from the field yet.</p>
      <p class="member-line"><strong>Step Up:</strong> More visible reps, stronger follow-through, and more proof can earn this spot.</p>
    </article>
  `;
}

function renderTier(tier) {
  return `
    <section class="tier-section tier-section--${toGradeClass(tier.grade)}">
      <div class="tier-section__head">
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
  const points = member.points || 0;
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
          <span class="score-chip">${escapeHtml(points)} pts</span>
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
