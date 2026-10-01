import snapshot from "./data/support.json" with { type: "json" };
import { $, esc, download } from "./common.mjs";
import {
  DEFAULT_RULES,
  TYPES,
  CHANNELS,
  unpack,
  filterTickets,
  countBy,
  summarize,
  route,
  simulate,
  makeDraft,
  decisionBrief,
} from "./support.mjs";
import { findOrder, recommend, caseSummary } from "./engine.mjs";

const tickets = unpack(snapshot);
const state = {
  view: "overview",
  filters: {},
  rules: { ...DEFAULT_RULES },
  page: 0,
  selected: null,
  reviews: new Map(),
  desk: "track",
  deskDraft: null,
};
const fmt = (n) => Number(n).toLocaleString("en-US");
const pct = (n, d) => (d ? ((100 * n) / d).toFixed(1) + "%" : "Not available");
const selectedTickets = () => filterTickets(tickets, state.filters);
let toastTimer;
function say(message) {
  clearTimeout(toastTimer);
  $("#status").textContent = message;
  toastTimer = setTimeout(() => ($("#status").textContent = ""), 6500);
}
function option(value, current, label = value) {
  return `<option value="${esc(value)}" ${value === current ? "selected" : ""}>${esc(label)}</option>`;
}
function filterControls(extra = false) {
  return `<div class="filter-panel"><div class="filters">
    <label>Ticket type<select data-filter="type" aria-label="Ticket type">${option("", state.filters.type || "", "All types")}${TYPES.map((v) => option(v, state.filters.type)).join("")}</select></label>
    <label>Channel<select data-filter="channel" aria-label="Channel">${option("", state.filters.channel || "", "All channels")}${CHANNELS.map((v) => option(v, state.filters.channel)).join("")}</select></label>
    ${extra ? `<label>Priority<select data-filter="priority" aria-label="Priority">${option("", state.filters.priority || "", "All priorities")}${["Critical", "High", "Medium", "Low"].map((v) => option(v, state.filters.priority)).join("")}</select></label><label>Source status<select data-filter="status" aria-label="Source status">${option("", state.filters.status || "", "All statuses")}${["Open", "Pending Customer Response", "Closed"].map((v) => option(v, state.filters.status)).join("")}</select></label>` : ""}
    <button class="text-button" data-action="reset-filters">Reset filters</button>
  </div><span class="tiny">${fmt(selectedTickets().length)} of ${fmt(tickets.length)} records${state.filters.query ? " · search active" : ""}${!extra && (state.filters.priority || state.filters.status) ? " · case filters active" : ""}</span></div>`;
}
function intro(eyebrow, title, text) {
  return `<div class="page-intro"><span class="eyebrow">${eyebrow}</span><h1 tabindex="-1" id="page-title">${title}</h1><p>${text}</p></div>`;
}
function empty() {
  return `<div class="empty"><span aria-hidden="true">☁</span><h3>No cases match this view.</h3><p>Try a broader filter or clear your search.</p><button class="secondary" data-action="reset-filters">Show all cases</button></div>`;
}
function stat(label, value, detail, symbol) {
  return `<div class="stat"><span class="stat-label">${label}</span><span class="stat-symbol" aria-hidden="true">${symbol}</span><strong class="stat-number">${value}</strong><span class="stat-detail">${detail}</span></div>`;
}
function overview() {
  const rows = selectedTickets(),
    s = summarize(rows),
    types = countBy(rows, "type"),
    channels = countBy(rows, "channel");
  const colors = ["#96b68a", "#c6d39b", "#dfc6a3", "#cbc1e2"];
  let start = 0;
  const segments = channels
    .map((c, i) => {
      const end = start + (c.count / (s.total || 1)) * 100;
      const part = `${colors[i]} ${start}% ${end}%`;
      start = end;
      return part;
    })
    .join(",");
  return `<section><div class="hero"><div><span class="eyebrow">BETTER SUPPORT STARTS WITH A BETTER QUESTION</span><h1 id="page-title" tabindex="-1">A little less chaos.<br>A lot more <em>care.</em></h1><p>Step into a support lead’s shoes. Explore the workload, review a case, and decide where assistance helps without handing away control.</p><div class="hero-actions"><button class="primary" data-view="queue">Review your first case <span>↗</span></button><button class="secondary" data-action="guide">Give me the 60-second tour</button></div></div><div class="illustration" aria-hidden="true"><span class="spark">✳</span><div class="note one"><span>💬</span><div><b>Every case has context.</b>Let’s find the next step.</div></div><div class="mascot"><div class="eyes"><i></i><i></i></div><div class="smile"></div></div><div class="note two"><span>♡</span><div><b>People stay in the loop.</b>Thoughtful support, by design.</div></div></div></div>
  <div class="data-strip"><span><span class="source-dot"></span><strong>8,469 practice tickets</strong> · Kaggle dataset · customer details excluded</span><button class="text-button" data-action="source">What is this data? ↗</button></div>
  ${filterControls()}
  <div class="stats">${stat("Tickets in this view", fmt(s.total), "Categorical source records", "▤")}${stat("Not closed", fmt(s.active), "Open + pending customer response", "↗")}${stat("Critical priority", fmt(s.critical), "Source label, not independently verified", "!")}${stat("Average satisfaction", s.rating === null ? "N/A" : s.rating.toFixed(2) + " / 5", `${fmt(s.rated)} rated · ${pct(s.rated, s.total)} coverage`, "☆")}</div>
  ${
    s.total
      ? `<div class="grid-2"><div class="card"><div class="card-head"><div><h2>What’s bringing people in?</h2><p>Select a bar to investigate those cases.</p></div><span class="tag">Ticket mix</span></div><div class="bars" role="group" aria-label="Ticket counts by type">${types.map((t) => `<button class="bar" data-type-drill="${esc(t.label)}" aria-label="Review ${esc(t.label)}: ${t.count} tickets"><span>${esc(t.label)}</span><div class="bar-track"><div class="bar-fill" style="width:${(100 * t.count) / types[0].count}%"></div></div><span class="bar-count">${fmt(t.count)}</span></button>`).join("")}</div><p class="tiny">Counts in the current filtered view. Categories describe the practice file, not an actual company.</p></div>
  <div class="card"><div class="card-head"><div><h2>Meet them where they are.</h2><p>Choose a channel to narrow the view.</p></div></div><div class="donut-layout"><div class="donut" aria-hidden="true" style="background:conic-gradient(${segments})"><span>${channels.length}<small>channels</small></span></div><div class="legend">${channels.map((c, i) => `<button data-channel="${esc(c.label)}" aria-label="Filter ${esc(c.label)}: ${c.count} tickets"><span><i style="background:${colors[i]}"></i>${esc(c.label)}</span><strong>${pct(c.count, s.total)}</strong></button>`).join("")}</div></div><p class="tiny">Exact counts: ${channels.map((c) => `${esc(c.label)} ${fmt(c.count)}`).join(" · ")}.</p></div></div>`
      : empty()
  }
  <div class="callout"><span class="emoji" aria-hidden="true">🔎</span><div><h3>A good analyst notices what’s missing.</h3><p>${fmt(s.total - s.rated)} records in this view have no satisfaction rating. The average excludes blanks and may not represent all customers. There is no ticket-created timestamp, so we do not claim response-speed or time-trend insights.</p></div></div>
  <div class="callout"><span class="emoji" aria-hidden="true">🧭</span><div><h3>The product decision</h3><p>Where should assistance stop and human judgment begin? <button class="text-button" data-view="playbook">Try the playbook lab →</button> Changes stay in your browser session. No live customer systems are connected.</p></div></div></section>`;
}
function detail(ticket) {
  if (!ticket) return empty();
  const r = route(ticket, state.rules),
    draft = makeDraft(ticket, state.rules),
    reviewed = state.reviews.get(ticket.id);
  return `<article class="card case-detail"><span class="eyebrow">CASE CONTEXT / ${esc(ticket.id)}</span><h2 id="case-title" tabindex="-1">${esc(ticket.subject)}</h2><p>${esc(ticket.product)} · ${esc(ticket.type)}</p><p class="tiny">Categorical snapshot only. Original messages and customer details are intentionally excluded. Subject and type can disagree; verify the real conversation before taking action.</p>
  <dl class="facts">${[
    ["Source status", ticket.status],
    ["Priority", ticket.priority],
    ["Channel", ticket.channel],
    [
      "Satisfaction",
      ticket.rating === null ? "Not provided" : ticket.rating + " / 5",
    ],
  ]
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`)
    .join("")}</dl>
  <div class="route-box"><span class="pill ${r.key}">${r.key === "draft" ? "✎" : "◎"} ${r.label}</span><p>${r.reason}</p><button class="text-button" data-view="playbook">Inspect the rules →</button></div>
  ${draft ? `<div class="draft-box"><span class="eyebrow">TEMPLATE ASSISTANCE / NOT A LIVE AI RESPONSE</span><p>${esc(draft)}</p><p class="tiny">This is a suggested opening, not a factual answer or a resolution. It has not been sent.</p></div>` : `<div class="draft-box"><h3>${r.key === "closed" ? "No action needed." : "A human takes it from here."}</h3><p>${r.key === "closed" ? "The source marks this ticket closed. This lab will not reopen or change it." : "Check the original message, verify the issue and applicable policy, then select a safe next step. Refunds, account changes, and technical fixes are not approved here."}</p></div>`}
  ${r.key !== "closed" ? `<div class="checks"><label><input type="checkbox" id="review-context"> I understand this is a practice case with limited context.</label><label><input type="checkbox" id="review-policy"> I have checked the routing reason and next step.</label></div><button class="primary" data-action="review" ${reviewed ? "" : "disabled"} id="review-button">${reviewed ? "Review recorded ✓" : "Mark practice review complete"}</button>${reviewed ? `<div class="audit">✓ Reviewed in this session. Original source status remains ${esc(ticket.status)}. No message was sent.</div>` : ""}` : ""}
  <p class="tiny">${state.reviews.size} practice reviews this session · resets on reload.</p></article>`;
}
function queue() {
  const rows = selectedTickets(),
    size = 6;
  state.page = Math.min(
    state.page,
    Math.max(0, Math.ceil(rows.length / size) - 1),
  );
  const slice = rows.slice(state.page * size, (state.page + 1) * size);
  if (!rows.some((t) => t.id === state.selected)) state.selected = slice[0]?.id;
  const selected = rows.find((t) => t.id === state.selected);
  return `<section>${intro("02 / CASE ROOM", "Context before action.", "Pick a case, inspect its route, and complete a practice review. This is a read-only source dataset: your decisions are kept separately for this session.")}${filterControls(true)}
  <form id="search-form" class="filter-panel"><label class="field">Search case ID, subject, or product<input class="search" name="query" value="${esc(state.filters.query || "")}" placeholder="Try CASE-0001 or delivery" maxlength="100"></label><button class="secondary" type="submit">Search cases →</button><button class="text-button" type="button" data-action="export-reviews">Export session reviews (${state.reviews.size})</button></form>
  <div class="workspace-grid"><div><div class="queue-heading"><strong>${fmt(rows.length)} matching cases</strong><span>Source ID order · not chronological</span></div><div class="queue-list">${slice.map((t) => `<button class="ticket ${t.id === state.selected ? "selected" : ""}" data-ticket="${esc(t.id)}" aria-pressed="${t.id === state.selected}"><span class="ticket-top"><span>${esc(t.id)} · ${esc(t.channel)}</span><span class="pill ${t.priority.toLowerCase()}">${esc(t.priority)}</span></span><strong>${esc(t.subject)}</strong><span class="ticket-bottom"><span>${esc(t.type)}</span><span>${state.reviews.has(t.id) ? "Reviewed ✓" : esc(t.status)}</span></span></button>`).join("") || empty()}</div><div class="pager"><button data-page="-1" ${state.page === 0 ? "disabled" : ""}>← Previous</button><span>Page ${rows.length ? state.page + 1 : 0} of ${Math.ceil(rows.length / size)}</span><button data-page="1" ${(state.page + 1) * size >= rows.length ? "disabled" : ""}>Next →</button></div></div><div id="case-detail">${selected ? detail(selected) : ""}</div></div></section>`;
}
function results() {
  const rows = selectedTickets(),
    sim = simulate(rows, state.rules);
  return `<div class="card"><div class="card-head"><div><h2>Here’s where the work goes.</h2><p>${fmt(sim.active)} not-closed cases in your filtered view.</p></div><span class="tag">Simulation</span></div><div class="route-flow"><div class="route-card"><b>${fmt(sim.specialist)}</b><span>Specialist review</span></div><div class="route-card"><b>${fmt(sim.human)}</b><span>Human review</span></div><div class="route-card"><b>${fmt(sim.draft)}</b><span>Draft assistance</span></div></div><p class="tiny">${fmt(sim.closed)} closed cases excluded. Every route still involves a person. The source statuses are unchanged.</p><div class="comparison"><div><span>All-manual scenario</span><strong>${fmt(sim.baseline)} min</strong></div><div><span>Your assisted scenario</span><strong>${fmt(sim.assisted)} min</strong></div><div><span>Draft-eligible share of active cases</span><strong>${pct(sim.draft, sim.active)}</strong></div></div><div class="simulation-result"><span class="eyebrow">UNDER YOUR ASSUMPTIONS ONLY</span><strong>${fmt(Math.abs(sim.difference))} min</strong><span>${sim.difference > 0 ? "less handling time" : sim.difference < 0 ? "more handling time" : "difference in handling time"}</span><p>Not measured savings. The model assumes equal handling time for all non-draft routes and includes human review in assisted time. It excludes implementation cost, errors, rework, and queue dynamics.</p></div><div class="hero-actions" style="margin-top:20px"><button class="primary" data-action="export-brief">Download decision brief ↓</button><button class="text-button" data-action="find-draft">Inspect a draft-eligible case →</button></div></div>`;
}
function playbook() {
  return `<section>${intro("03 / PLAYBOOK LAB", "Automate the routine.<br>Keep the responsibility.", "Change a routing rule and see the workload move. Then test a handling-time assumption. These are transparent rules and scenarios, not a trained AI model or measured business impact.")}${filterControls()}
  <div class="workspace-grid"><div class="card"><div class="card-head"><div><h2>Your human-first playbook</h2><p>Rules run in the order shown below.</p></div><button class="text-button" data-action="reset-rules">Reset</button></div>
  <div class="rule"><span class="locked" aria-hidden="true">🔒</span><div><strong>1. Critical cases always go to a specialist</strong><p>Non-negotiable in this prototype. Closed cases are excluded first.</p></div></div>
  <label class="rule"><input type="checkbox" data-rule="escalateHigh" ${state.rules.escalateHigh ? "checked" : ""}><div><strong>2. Escalate high-priority cases too</strong><p>If off, high-priority cases still need human review. They cannot receive draft assistance.</p></div></label>
  <div class="rule"><span class="locked" aria-hidden="true">🔒</span><div><strong>3. People own money, accounts and data loss</strong><p>Check both type and subject for billing, payments, refunds, cancellation, account access and data loss. Human review wins even when categories disagree.</p></div></div>
  <label class="rule"><input type="checkbox" data-rule="allowProductDrafts" ${state.rules.allowProductDrafts ? "checked" : ""}><div><strong>4. Assist low/medium product inquiries with drafts</strong><p>Templates help ask for context. They never promise a refund, invent policy, or send themselves.</p></div></label>
  <h3 style="margin-top:25px">What if handling time changed?</h3><p class="tiny">Illustrative minutes per case. Include the time a person spends checking a draft.</p>
  ${[
    ["manualMinutes", "Manual handling time"],
    ["draftMinutes", "Assisted handling + review"],
  ]
    .map(
      ([key, label]) =>
        `<label class="range-field"><span class="range-label">${label}<output id="${key}-value">${state.rules[key]} min</output></span><input type="range" min="1" max="30" step="1" value="${state.rules[key]}" data-minutes="${key}" aria-label="${label}"></label>`,
    )
    .join("")}
  </div><div id="simulation">${results()}</div></div><div class="callout"><span class="emoji" aria-hidden="true">🧪</span><div><h3>What would we test before a real rollout?</h3><p>Run in shadow mode on consented, de-identified tickets. Have two reviewers judge route correctness and draft safety. Measure rework and handling time, not just automation rate. Keep a human override and rollback switch.</p></div></div></section>`;
}
function desk() {
  const forms = {
    track: `<form id="order-form" class="form-stack"><label class="field">Sample order ID<input name="order" value="DEMO-1042" maxlength="40" required></label><p class="tiny">Try DEMO-1042 (in transit) or DEMO-1043 (processing). No real order lookup.</p><button class="primary" type="submit">Find my sample order →</button></form>`,
    shop: `<form id="shop-form" class="form-stack"><label class="field">What are you shopping for?<select name="use"><option value="running">Running</option><option value="casual">Everyday casual</option><option value="training">Training</option></select></label><label class="field">Maximum budget (USD)<input name="budget" type="number" min="0" max="10000" value="100" required></label><button class="primary" type="submit">Find a match →</button><p class="tiny">Four fictional products. Matching uses activity and budget, not AI personalization.</p></form>`,
    issue: `<form id="case-form" class="form-stack"><label class="field">Sample order<select name="order"><option>DEMO-1042</option><option>DEMO-1043</option></select></label><label class="field">What went wrong?<select name="issue"><option>Damaged stitching</option><option>Wrong item</option><option>Packaging damage</option></select></label><label class="field">Practice description<textarea name="note" maxlength="500" required placeholder="Use a fictional example. Do not enter personal information."></textarea></label><label class="field">Optional local photo preview<input name="photo" type="file" accept="image/png,image/jpeg,image/webp"></label><p class="tiny">PNG, JPG or WebP up to 5 MB. Preview only, no image analysis or upload.</p><div id="photo-preview"></div><button class="primary" type="submit">Prepare human handoff →</button></form>`,
  };
  return `<section>${intro("04 / CUSTOMER DESK", "Try the other side<br>of the conversation.", "A separate fictional retail sandbox: track an order, find a product, or prepare a support handoff. These examples are not part of the Kaggle ticket dataset.")}
  <div class="workspace-grid"><div class="card"><div class="desk-tabs" role="group" aria-label="Customer task">${[
    ["track", "📦 Track order"],
    ["shop", "👟 Find a product"],
    ["issue", "🧵 Report an issue"],
  ]
    .map(
      ([key, label]) =>
        `<button data-desk="${key}" aria-pressed="${state.desk === key}">${label}</button>`,
    )
    .join(
      "",
    )}</div>${forms[state.desk]}<div id="desk-result" aria-live="polite"></div></div>
  <aside class="card"><span class="eyebrow">WHY THIS FLOW EXISTS</span><h2>Make the next step obvious.</h2><div class="steps"><div><b>1</b><p><strong>Understand the request.</strong><br>Give people a clear starting point instead of an empty chat box.</p></div><div><b>2</b><p><strong>Use only known information.</strong><br>Show order data and product matches without inventing facts.</p></div><div><b>3</b><p><strong>Hand off with context.</strong><br>A person owns exceptions, refunds and replacements. A draft is not a completed action.</p></div></div><div class="callout"><span class="emoji" aria-hidden="true">♡</span><p>No logins. No paid AI. No messages sent. Everything in this sandbox stays in this browser session.</p></div></aside></div></section>`;
}
function render(focus = false) {
  $("#workspace").innerHTML = { overview, queue, playbook, desk }[state.view]();
  document.querySelectorAll("header [data-view]").forEach((b) => {
    if (b.dataset.view === state.view) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  if (focus) $("#page-title")?.focus();
}
function showDetails(guide = false) {
  $("#details-body").innerHTML = guide
    ? `<h2>From a pattern to a decision.</h2><p>You’re the support lead. Your mission is to decide where assistance is useful and where a person must stay in control.</p><div class="steps"><div><b>1</b><p><strong>Explore.</strong> Click a ticket-mix bar on Overview. It opens those cases in the Case room.</p></div><div><b>2</b><p><strong>Review.</strong> Read a case’s source fields and routing reason. Complete the two checks to record a practice review.</p></div><div><b>3</b><p><strong>Experiment.</strong> In Playbook lab, toggle draft assistance. Change the minute assumptions and export your decision brief.</p></div></div><button class="primary" data-action="start-tour">Start with product inquiries →</button>`
    : `<h2>Useful work. Honest boundaries.</h2><p>Care Canvas extends the Retail Service AI portfolio project into a support-operations lab. It demonstrates data analysis, working software, and product decisions in one connected workflow.</p><h3>Where the data comes from</h3><p><a href="${snapshot.source.url}" target="_blank" rel="noopener">${esc(snapshot.source.title)} by ${esc(snapshot.source.author)} ↗</a><br>${esc(snapshot.source.license)} · retrieved ${snapshot.source.retrieved}<br>8,469 rows, 8 published categorical/numeric fields.</p><p>${esc(snapshot.source.provenance)}</p><h3>What we intentionally left out</h3><p>Names, emails, age, gender, original ticket descriptions, resolution text, and timestamps. Only categorical case fields and optional satisfaction ratings are published. No customer messages are reproduced.</p><ul>${snapshot.source.limitations.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><h3>What is simulated?</h3><p>Routes are deterministic rules. Suggested openings are templates, not generated AI. Handling times are adjustable assumptions. Reviews reset on reload. Customer desk uses fictional orders and products, separate from the Kaggle dataset.</p><h3>How would this become a real product?</h3><p>Validate with support leads, connect a scoped read-only helpdesk integration, run a reviewer-labeled pilot, and measure safe routing plus rework. Add authentication, tenant isolation, consent, audit retention and human override before operational use.</p><div class="hero-actions"><a class="secondary" href="./data/support.json" download>Download published dataset ↓</a><a class="secondary" href="https://github.com/pratiksha0108/nike-customer-service-ai/blob/main/docs/product-brief.md">Read product brief ↗</a></div>`;
  $("#details").showModal();
}
document.addEventListener("click", (event) => {
  const b = event.target.closest("button");
  if (!b) return;
  if (b.dataset.view) {
    state.view = b.dataset.view;
    render(true);
    return;
  }
  if (b.dataset.ticket) {
    state.selected = b.dataset.ticket;
    render();
    if (matchMedia('(max-width:760px)').matches) $('#case-title')?.focus();
    else document.querySelector(`[data-ticket="${state.selected}"]`)?.focus();
    return;
  }
  if (b.dataset.page) {
    state.page += Number(b.dataset.page);
    state.selected = null;
    render();
    return;
  }
  if (b.dataset.typeDrill) {
    state.filters.type = b.dataset.typeDrill;
    state.page = 0;
    state.selected = null;
    state.view = "queue";
    render(true);
    return;
  }
  if (b.dataset.channel) {
    state.filters.channel = b.dataset.channel;
    state.page = 0;
    render();
    say("Filtered to " + b.dataset.channel);
    return;
  }
  if (b.dataset.desk) {
    state.desk = b.dataset.desk;
    state.deskDraft = null;
    render();
    return;
  }
  const a = b.dataset.action;
  if (a === "reset-filters") {
    state.filters = {};
    state.page = 0;
    state.selected = null;
    render();
    say("All filters cleared.");
  }
  if (a === "reset-rules") {
    state.rules = { ...DEFAULT_RULES };
    render();
    say("Default routing rules and assumptions restored.");
  }
  if (a === "source" || a === "guide") showDetails(a === "guide");
  if (a === "start-tour") {
    state.filters = { type: "Product inquiry" };
    state.view = "queue";
    state.selected = null;
    state.page = 0;
    $("#details").close();
    render(true);
  }
  if (a === "review") {
    const t = tickets.find((t) => t.id === state.selected);
    if (!$("#review-context")?.checked || !$("#review-policy")?.checked) {
      say("Complete both checks before recording this practice review.");
      return;
    }
    state.reviews.set(t.id, {
      caseId: t.id,
      route: route(t, state.rules).label,
      sourceStatus: t.status,
      reviewedAt: new Date().toISOString(),
      rules: { ...state.rules },
      practiceOnly: true,
      messageSent: false,
    });
    render();
    say("Practice review recorded. No customer message sent.");
  }
  if (a === "export-reviews") {
    download("care-canvas-practice-reviews.json", {
      practiceOnly: true,
      reviews: [...state.reviews.values()],
    });
    say("Session reviews exported. Source statuses are unchanged.");
  }
  if (a === "export-brief") {
    download(
      "care-canvas-decision-brief.json",
      decisionBrief(selectedTickets(), { ...state.filters }, state.rules),
    );
    say("Decision brief downloaded with source and assumptions.");
  }
  if (a === "find-draft") {
    const t = selectedTickets().find(
      (t) => route(t, state.rules).key === "draft",
    );
    if (!t) {
      say(
        "No draft-eligible case in this view. Enable product drafts or broaden your filters.",
      );
      return;
    }
    state.selected = t.id;
    state.page = Math.floor(selectedTickets().indexOf(t) / 6);
    state.view = "queue";
    render(true);
  }
  if (a === "export-case" && state.deskDraft) {
    download("fictional-retail-handoff.json", state.deskDraft);
    say("Unsubmitted handoff draft downloaded.");
  }
});
document.addEventListener("change", (event) => {
  const el = event.target;
  if (el.dataset.filter) {
    state.filters[el.dataset.filter] = el.value;
    state.page = 0;
    state.selected = null;
    const key = el.dataset.filter;
    render();
    document.querySelector(`[data-filter="${key}"]`)?.focus();
    say(`${fmt(selectedTickets().length)} matching records.`);
  }
  if (el.dataset.rule) {
    state.rules[el.dataset.rule] = el.checked;
    $("#simulation").innerHTML = results();
    say("Routing simulation updated.");
  }
  if (el.id === "review-context" || el.id === "review-policy")
    $("#review-button").disabled = !(
      $("#review-context").checked && $("#review-policy").checked
    );
  if (el.name === "photo") {
    const file = el.files[0],
      target = $("#photo-preview");
    target.replaceChildren();
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      el.value = "";
      target.innerHTML =
        '<p class="error">Choose a PNG, JPG or WebP image no larger than 5 MB.</p>';
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;
    img.alt = "Local practice photo preview";
    img.style = "max-width:100%;max-height:180px;border-radius:12px";
    img.onload = () => URL.revokeObjectURL(url);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      el.value = "";
      target.textContent = "This image could not be opened.";
    };
    target.append(img);
  }
});
document.addEventListener("input", (event) => {
  const key = event.target.dataset.minutes;
  if (key) {
    state.rules[key] = Number(event.target.value);
    $("#" + key + "-value").textContent = state.rules[key] + " min";
    $("#simulation").innerHTML = results();
  }
});
document.addEventListener("submit", (event) => {
  const form = event.target;
  if (
    !["search-form", "order-form", "shop-form", "case-form"].includes(form.id)
  )
    return;
  event.preventDefault();
  const data = new FormData(form);
  if (form.id === "search-form") {
    state.filters.query = String(data.get("query")).trim();
    state.page = 0;
    state.selected = null;
    render();
    say(`${fmt(selectedTickets().length)} cases match your search.`);
    return;
  }
  const target = $("#desk-result");
  try {
    if (form.id === "order-form") {
      const order = findOrder(data.get("order"));
      target.innerHTML = order
        ? `<div class="desk-result"><span class="eyebrow">FICTIONAL ORDER FOUND</span><h2>${esc(order.stage)}</h2><strong>${esc(order.item)}</strong><p>${esc(order.detail)}</p><div class="journey" aria-hidden="true"><span class="done"></span><span class="${order.stage === "In transit" ? "done" : ""}"></span><span></span></div><p class="tiny">No connection to a store or delivery service.</p></div>`
        : '<p class="error">No sample order found. Try DEMO-1042 or DEMO-1043. Real orders are not supported.</p>';
    }
    if (form.id === "shop-form") {
      const matches = recommend(data.get("use"), Number(data.get("budget")));
      target.innerHTML = `<div class="desk-result"><span class="eyebrow">${matches.length} FICTIONAL MATCH${matches.length === 1 ? "" : "ES"}</span>${matches.map((p) => `<div class="product"><h3>${esc(p.name)} · $${p.price}</h3><p>${esc(p.detail)}</p></div>`).join("") || "<p>No product meets both filters. Try a higher budget or a different activity.</p>"}</div>`;
    }
    if (form.id === "case-form") {
      state.deskDraft = caseSummary(
        data.get("order"),
        data.get("issue"),
        String(data.get("note")),
      );
      target.innerHTML = `<div class="desk-result"><span class="eyebrow">HUMAN HANDOFF READY / NOT SUBMITTED</span><h2>Context, neatly packaged.</h2><p><strong>${esc(state.deskDraft.order)} · ${esc(state.deskDraft.issue)}</strong></p><p>${esc(state.deskDraft.description)}</p><p>${esc(state.deskDraft.next)}</p><button class="secondary" data-action="export-case">Download handoff draft ↓</button></div>`;
    }
  } catch (error) {
    target.innerHTML = `<p class="error">${esc(error.message)}</p>`;
  }
});
$("#source-button").addEventListener("click", () => showDetails());
$("#close-details").addEventListener("click", () => $("#details").close());
$("#motion-button").addEventListener("click", () => {
  const off = document.documentElement.dataset.motion !== "off";
  document.documentElement.dataset.motion = off ? "off" : "on";
  $("#motion-button").textContent = off ? "Resume motion" : "Pause motion";
  $("#motion-button").setAttribute("aria-pressed", String(off));
});
try {
  render();
  document.documentElement.dataset.ready = "true";
  clearTimeout(window.bootTimer);
} catch (error) {
  window.bootFailure();
  console.error("Care Canvas startup failed", error);
}
