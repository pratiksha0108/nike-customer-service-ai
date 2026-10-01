import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_RULES,
  unpack,
  filterTickets,
  countBy,
  summarize,
  route,
  simulate,
  makeDraft,
  decisionBrief,
} from "./support.mjs";
import { esc } from "./common.mjs";
const snapshot = JSON.parse(
  await readFile(new URL("./data/support.json", import.meta.url), "utf8"),
);
const tickets = unpack(snapshot);
const ticket = {
  id: "TEST",
  status: "Open",
  type: "Product inquiry",
  priority: "Low",
  channel: "Chat",
  subject: "Product setup",
  product: "Example product",
  rating: null,
};
test("published snapshot has only approved fields and unique IDs", () => {
  assert.deepEqual(snapshot.columns, [
    "id",
    "type",
    "subject",
    "status",
    "priority",
    "channel",
    "product",
    "rating",
  ]);
  assert.equal(tickets.length, 8469);
  assert.equal(new Set(tickets.map((t) => t.id)).size, 8469);
  assert.ok(snapshot.rows.every((row) => row.length === 8));
  assert.ok(
    snapshot.rows.every((row) =>
      row.slice(0, 7).every((v) => typeof v === "string" && !v.includes("@")),
    ),
  );
});
test("missing satisfaction is not zero and coverage is explicit", () => {
  const s = summarize(tickets);
  assert.equal(s.rated, 2769);
  assert.equal(s.total - s.rated, 5700);
  assert.equal(s.active, 5700);
  assert.equal(s.critical, 2129);
  assert.equal(summarize([{ ...ticket, rating: 4 }, ticket]).rating, 4);
  assert.equal(summarize([]).rating, null);
  assert.equal(summarize([ticket]).rating, null);
});
test("category counts reconcile to source rows", () => {
  for (const key of ["type", "channel", "status", "priority"])
    assert.equal(
      countBy(tickets, key).reduce((s, x) => s + x.count, 0),
      8469,
    );
});
test("filters intersect and search normalizes case", () => {
  const rows = filterTickets(tickets, {
    type: "Product inquiry",
    channel: "Chat",
  });
  assert.ok(rows.length > 0);
  assert.ok(
    rows.every((t) => t.type === "Product inquiry" && t.channel === "Chat"),
  );
  assert.equal(filterTickets(tickets, { query: "  case-0001  " }).length, 1);
  assert.equal(filterTickets(tickets, { query: "nonexistentxyz" }).length, 0);
});
test("closed status takes precedence", () => {
  assert.equal(
    route({ ...ticket, status: "Closed", priority: "Critical" }).key,
    "closed",
  );
  assert.equal(makeDraft({ ...ticket, status: "Closed" }), null);
});
test("critical always escalates even with optional escalation disabled", () => {
  assert.equal(
    route(
      { ...ticket, priority: "Critical" },
      { ...DEFAULT_RULES, escalateHigh: false },
    ).key,
    "specialist",
  );
});
test("high priority can never be draft-assisted", () => {
  assert.equal(route({ ...ticket, priority: "High" }).key, "specialist");
  assert.equal(
    route(
      { ...ticket, priority: "High" },
      { ...DEFAULT_RULES, escalateHigh: false },
    ).key,
    "human",
  );
});
test("money and account cases always require people", () => {
  for (const type of [
    "Billing inquiry",
    "Refund request",
    "Cancellation request",
  ])
    assert.equal(route({ ...ticket, type }).key, "human");
});
test("sensitive subjects override an inconsistent product-inquiry type", () => {
  for (const subject of [
    "Refund request",
    "Payment issue",
    "Cancellation request",
    "Account access",
    "Data loss",
  ]) {
    assert.equal(route({ ...ticket, subject }).key, "human");
    assert.equal(makeDraft({ ...ticket, subject }), null);
  }
});
test("draft switch is respected and templates do not promise resolution", () => {
  assert.equal(route(ticket).key, "draft");
  assert.ok(makeDraft(ticket).includes("verify"));
  assert.equal(
    makeDraft(ticket, { ...DEFAULT_RULES, allowProductDrafts: false }),
    null,
  );
});
test("all records reconcile across route buckets", () => {
  const s = simulate(tickets);
  assert.equal(s.closed + s.specialist + s.human + s.draft, tickets.length);
  assert.equal(s.active, 5700);
  assert.equal(s.baseline, s.active * 12);
  assert.equal(s.difference, s.draft * 5);
});
test("disabling drafts creates zero handling-time difference", () => {
  const s = simulate(tickets, { ...DEFAULT_RULES, allowProductDrafts: false });
  assert.equal(s.draft, 0);
  assert.equal(s.difference, 0);
});
test("slower assisted workflow reports a negative difference honestly", () => {
  assert.equal(
    simulate([ticket], { ...DEFAULT_RULES, manualMinutes: 5, draftMinutes: 10 })
      .difference,
    -5,
  );
});
test("empty views produce zero counts without invalid ratios", () => {
  assert.deepEqual(simulate([]), {
    closed: 0,
    specialist: 0,
    human: 0,
    draft: 0,
    active: 0,
    baseline: 0,
    assisted: 0,
    difference: 0,
  });
});
test("invalid time assumptions are rejected", () => {
  for (const value of [0, -1, 61, NaN, Infinity])
    assert.throws(() =>
      simulate([ticket], { ...DEFAULT_RULES, manualMinutes: value }),
    );
});
test("brief separates source observations and assumptions", () => {
  const b = decisionBrief([ticket], {}, DEFAULT_RULES);
  assert.equal(b.practiceOnly, true);
  assert.equal(b.observed.total, 1);
  assert.equal(b.assumptions.manualMinutes, 12);
  assert.ok(b.caveats.length >= 4);
});
test("rendered user input is escaped", () => {
  assert.equal(esc('<img onerror="x">'), "&lt;img onerror=&quot;x&quot;&gt;");
});
