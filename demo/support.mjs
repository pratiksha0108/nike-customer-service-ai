export const DEFAULT_RULES = Object.freeze({
  escalateHigh: true,
  allowProductDrafts: true,
  manualMinutes: 12,
  draftMinutes: 7,
});
export const TYPES = [
  "Technical issue",
  "Billing inquiry",
  "Cancellation request",
  "Product inquiry",
  "Refund request",
];
export const CHANNELS = ["Chat", "Email", "Phone", "Social media"];
export function unpack(snapshot) {
  return snapshot.rows.map((row) =>
    Object.fromEntries(snapshot.columns.map((key, i) => [key, row[i]])),
  );
}
export function filterTickets(tickets, filters = {}) {
  const query = String(filters.query || "")
    .trim()
    .toLowerCase();
  return tickets.filter(
    (t) =>
      ["type", "channel", "priority", "status"].every(
        (k) => !filters[k] || t[k] === filters[k],
      ) &&
      (!query ||
        [t.id, t.subject, t.product].some((v) =>
          v.toLowerCase().includes(query),
        )),
  );
}
export function countBy(tickets, field) {
  const counts = new Map();
  tickets.forEach((t) => counts.set(t[field], (counts.get(t[field]) || 0) + 1));
  return [...counts]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
export function summarize(tickets) {
  const rated = tickets.filter((t) => Number.isFinite(t.rating));
  return {
    total: tickets.length,
    active: tickets.filter((t) => t.status !== "Closed").length,
    critical: tickets.filter((t) => t.priority === "Critical").length,
    rated: rated.length,
    rating: rated.length
      ? rated.reduce((sum, t) => sum + t.rating, 0) / rated.length
      : null,
  };
}
export function route(ticket, rules = DEFAULT_RULES) {
  if (ticket.status === "Closed")
    return {
      key: "closed",
      label: "Already closed",
      reason:
        "Source record is closed. Excluded from the active-work simulation.",
    };
  if (ticket.priority === "Critical")
    return {
      key: "specialist",
      label: "Specialist review",
      reason:
        "Critical priority always requires a specialist. This safety rule cannot be disabled.",
    };
  if (rules.escalateHigh && ticket.priority === "High")
    return {
      key: "specialist",
      label: "Specialist review",
      reason: "Your playbook escalates all high-priority cases.",
    };
  if (
    ["Refund request", "Billing inquiry", "Cancellation request"].includes(
      ticket.type,
    ) ||
    [
      "Refund request",
      "Payment issue",
      "Cancellation request",
      "Account access",
      "Data loss",
    ].includes(ticket.subject)
  )
    return {
      key: "human",
      label: "Human review",
      reason:
        "The type or subject concerns money, account access, cancellation, or data loss. These require human review even if the categories disagree. No automatic approvals.",
    };
  if (
    rules.allowProductDrafts &&
    ticket.type === "Product inquiry" &&
    ["Low", "Medium"].includes(ticket.priority)
  )
    return {
      key: "draft",
      label: "Draft assistance",
      reason:
        "Low or medium product inquiry. A template can help, but a person must review it before sending.",
    };
  return {
    key: "human",
    label: "Human review",
    reason:
      "No eligible draft-assistance rule. Route to a person for context and verification.",
  };
}
export function simulate(tickets, rules = DEFAULT_RULES) {
  for (const key of ["manualMinutes", "draftMinutes"])
    if (!Number.isFinite(rules[key]) || rules[key] < 1 || rules[key] > 60)
      throw Error("Minutes must be between 1 and 60.");
  const counts = { closed: 0, specialist: 0, human: 0, draft: 0 };
  tickets.forEach((t) => counts[route(t, rules).key]++);
  const active = tickets.length - counts.closed;
  const baseline = active * rules.manualMinutes;
  const assisted =
    (active - counts.draft) * rules.manualMinutes +
    counts.draft * rules.draftMinutes;
  return {
    ...counts,
    active,
    baseline,
    assisted,
    difference: baseline - assisted,
  };
}
export function makeDraft(ticket, rules = DEFAULT_RULES) {
  const decision = route(ticket, rules);
  if (decision.key !== "draft") return null;
  return `Thanks for contacting us about ${ticket.product}. To help with your ${ticket.subject.toLowerCase()} question, could you share the model or version and what you would like to do? A support specialist will verify the relevant product information before recommending next steps.`;
}
export function decisionBrief(tickets, filters, rules) {
  return {
    project: "Care Canvas",
    practiceOnly: true,
    generatedAt: new Date().toISOString(),
    source:
      "https://www.kaggle.com/datasets/suraj520/customer-support-ticket-dataset",
    filters,
    assumptions: { ...rules },
    observed: summarize(tickets),
    simulation: simulate(tickets, rules),
    caveats: [
      "Practice dataset with unverified real-versus-synthetic provenance.",
      "Routing is deterministic and not an AI quality evaluation.",
      "Minutes are user assumptions, not measured savings.",
      "Draft assistance still requires human review. No customer messages are sent.",
    ],
  };
}
