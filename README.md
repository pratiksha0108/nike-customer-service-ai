# Care Canvas · Retail Service AI

A human-first support-operations lab that connects data analysis, working software, and product judgment.

**[Open the live workspace](https://pratiksha0108.github.io/nike-customer-service-ai/)** · [Product brief and review SOP](docs/product-brief.md)

## Try a 3-minute workflow

1. On **Overview**, select a ticket-category bar to drill into its cases.
2. In **Case room**, inspect a route and complete the practice-review checks. Export your session reviews if needed.
3. Open **Playbook lab**, switch assistance on/off and adjust handling-time assumptions. Download a decision brief with the source, filters and caveats.
4. In **Customer desk**, try separate fictional order lookup, product matching and a human handoff. An optional image is previewed locally only.

## Data, not theater

- 8,469 records from [Suraj's Customer Support Ticket Dataset on Kaggle](https://www.kaggle.com/datasets/suraj520/customer-support-ticket-dataset), marked CC0/Public Domain in Kaggle metadata.
- Real-versus-synthetic provenance is unverified: this is practice data, not an actual company's performance.
- Only eight approved fields are published. Names, emails, demographics, free-text messages, resolution text and timestamps are excluded.
- 2,769 satisfaction ratings are available. Missing ratings are excluded and coverage is visible.
- No ticket-created dates, SLA analysis, live queues, causal savings or measured customer outcomes are claimed.
- Source categories can conflict. Sensitive subjects override draft eligibility even when the ticket type says “Product inquiry.”

## Honest assistance boundaries

The live site uses deterministic routing and opening templates, not a live LLM. Critical cases always escalate; financial/account decisions and data-loss issues remain with people. All drafts require review. No customer messages, refunds or ticket updates are sent. Handling minutes are scenario inputs, not observed savings. Session reviews reset when the page reloads.

The original React/OpenAI concept remains in `src/` and the root package configuration. It is not the application deployed to GitHub Pages. Care Canvas is independent and not affiliated with Nike or the products represented in the practice dataset.

## Run the deployed version

Requires Node.js 20+ and npm:

```sh
npm ci --prefix demo
npm test --prefix demo
npm run build --prefix demo
python3 -m http.server 4322 --directory site
```

Open `http://localhost:4322/`. Serve `site/`, not the unbundled source folder. The build embeds the dataset in a single versioned script and uses content-hashed styles. A startup-recovery message replaces endless loading if the script fails.

## Reproduce the data preparation

Download the dataset archive from the linked Kaggle source, then run:

```sh
python3 scripts/prepare_support_data.py /path/to/customer-support.zip
```

The script reads the named CSV inside the archive without extracting arbitrary paths, validates unique IDs and ratings, and publishes only an explicit allowlist. The snapshot includes the archive SHA-256 and provenance notes. Do not commit the original archive or customer free text.

## Verification

21 automated checks cover source reconciliation, missing ratings, intersecting filters, sensitive-case precedence, draft controls, empty inputs, slower assistance, export structure, output escaping, the original retail functions, and self-contained release assets.

Browser checks cover chart drill-down, review gates, routing controls, scenario recalculation, download contents, empty-state recovery and customer tasks. Reduced-motion preferences and a manual pause control are supported. This prototype is not a production helpdesk; see the product brief for research and rollout requirements.
