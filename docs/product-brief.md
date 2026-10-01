# Care Canvas: from support activity to a human-first decision

## Why build this?

A support lead needs more than a chatbot demonstration. They need to understand the incoming workload, inspect a proposed route, and decide what can be assisted without quietly approving unsafe actions. Care Canvas connects those steps in a free, inspectable browser prototype.

**Target-user hypothesis:** a support operations lead at a small technology retailer or service business, evaluating assistance before connecting it to customer systems. This persona has not yet been validated through interviews.

**Job to be done:** “When I evaluate a support-assistance workflow, help me see which cases it touches and why, so I can approve a limited pilot with clear human ownership.”

## The connected workflow

1. **Overview:** filter a source-backed practice snapshot, inspect volume and missing-data coverage, then drill into a ticket category.
2. **Case room:** inspect categorical context, see the deterministic route and its reason, and record a separate practice review. Original records never change.
3. **Playbook lab:** adjust optional escalation and drafting rules. Keep critical escalation and financial/account review locked. Explore handling-time assumptions and export a decision brief.
4. **Customer desk:** preserve the original retail journeys as a clearly separate fictional sandbox: order tracking, budget-constrained product matching, and a human handoff with an optional local image preview.

## Data contract and limitations

- Source: [Customer Support Ticket Dataset on Kaggle](https://www.kaggle.com/datasets/suraj520/customer-support-ticket-dataset), CC0/Public Domain according to Kaggle metadata. Retrieved October 1, 2026.
- 8,469 records; only eight fields published. Names, emails, demographics, original free text, resolution text, and timestamps are excluded by an explicit ingestion allowlist.
- Real-versus-synthetic provenance is not established. Treat as practice data, not actual business evidence.
- 2,769 ratings are present; 5,700 are missing. Averages use rated records only and always disclose coverage.
- No ticket-created timestamp is published. Purchase dates are not repurposed as ticket dates. We make no SLA, trend, or resolution-duration claims.
- Category consistency is not assumed. A subject may disagree with its ticket type. Routing demonstrates rules, not validated intent classification.
- Closed tickets are excluded from the active-work scenario. Pending customer-response tickets are included, but this is not a claim that each is immediately actionable.
- The snapshot’s “not closed” count is not a live queue or a current operational backlog.

## Product choices and trade-offs

**Transparent rules before live AI:** recruiters and evaluators can inspect exactly why a case gets its route. This does not demonstrate LLM quality. A future classifier must be evaluated against reviewer labels before it can drive routing.

**Draft assistance, not automatic resolution:** low/medium product inquiries may receive an opening template. All drafts still need human review; no messages are sent. Financial, cancellation, and critical cases retain explicit human ownership.

**Separate fact and scenario:** source counts are observations; minutes per case are adjustable assumptions. The exported brief includes both and the caveats. Negative time differences are displayed when the assisted process is assumed slower.

**Local-first, accessible interactions:** no paid APIs, account, tracking or customer integration. Native form controls, keyboard focus, reduced-motion support, and a motion pause control. A self-contained, content-hashed release avoids separate cached module/data versions.

## Pilot and measurement plan

This is a plan, not completed research or achieved impact.

1. Interview five support leads. Test whether route transparency or drafting is the more painful problem. Document counter-evidence.
2. Observe five participants completing three tasks: find a relevant case, explain its route, and export a scenario. Record completion, misunderstandings and recovery, not a self-selected satisfaction score alone.
3. With explicit permission, run read-only shadow mode on de-identified tickets. Sample across types, priorities and channels. Have two trained reviewers independently label route correctness and reconcile disagreements.
4. Predefine a review rubric for unsafe promises, incorrect routes, missing context and tone. Use a held-out evaluation set. Report per-category results, disagreement, abstention, and uncertainty, not just an overall score.
5. Measure handling time including review and rework. Compare like-for-like cases and control for changes in case mix. Do not infer causal savings from this practice dataset.
6. Start with a human-reviewed pilot; keep an override and rollback. Expand only after review findings support it.

**Primary outcome candidate:** proportion of reviewed cases with a correct, actionable next step. **Guardrails:** unsafe commitments, missed urgent cases, rework, and customer privacy incidents. **Operational measures:** total handling time including review, escalation load, and reviewer agreement. Targets should be agreed with a real pilot partner, not invented here.

## Production requirements, deliberately out of scope

Authentication and tenant isolation; scoped helpdesk access; consent and retention policies; secure audit storage; backend validation; observability; role-based review; policy versioning; appeals and overrides; prompt-injection testing if an LLM is introduced; accessibility evaluation with real users. A GitHub Pages prototype is not a production helpdesk.

## Review SOP

1. Confirm source and filters. Distinguish a practice case from the fictional customer sandbox.
2. Inspect type, subject, priority and status. Treat disagreement or missing conversation context as a reason to seek clarification.
3. Read the route explanation. Never use a template as verified policy or mark a draft as sent.
4. Complete the two practice-review checks and record the review. This creates a session entry, not a ticket update.
5. Export session reviews if needed before reloading. Record the rules used, route, and unchanged source status.
6. For an actual pilot, escalate uncertainty to the assigned human owner. Do not use this prototype to make customer commitments.
