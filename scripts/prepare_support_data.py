"""Build a public, categorical-only practice snapshot. Never copy customer text."""
import csv
import hashlib
import io
import json
import pathlib
import sys
import zipfile

archive = pathlib.Path(sys.argv[1])
with zipfile.ZipFile(archive) as z:
    with z.open("customer_support_tickets.csv") as raw:
        rows = list(csv.DictReader(io.TextIOWrapper(raw, encoding="utf-8-sig")))

fields = ["Ticket ID", "Ticket Type", "Ticket Subject", "Ticket Status", "Ticket Priority", "Ticket Channel", "Product Purchased", "Customer Satisfaction Rating"]
result = []
for row in rows:
    rating = float(row[fields[-1]]) if row[fields[-1]].strip() else None
    if rating is not None and (not rating.is_integer() or not 1 <= rating <= 5):
        raise ValueError("Invalid satisfaction rating")
    result.append(["CASE-" + str(int(row[fields[0]])).zfill(4)] + [row[f] for f in fields[1:-1]] + [rating])
if len({row[0] for row in result}) != len(result):
    raise ValueError("Duplicate ticket IDs")
snapshot = {
    "source": {
        "title": "Customer Support Ticket Dataset",
        "author": "Suraj (suraj520 on Kaggle)",
        "url": "https://www.kaggle.com/datasets/suraj520/customer-support-ticket-dataset",
        "license": "CC0: Public Domain (Kaggle metadata)",
        "retrieved": "2026-10-01",
        "archiveSha256": hashlib.sha256(archive.read_bytes()).hexdigest(),
        "provenance": "Real versus synthetic provenance is not established. Use as a practice dataset, not evidence of a real business.",
        "excluded": [f for f in rows[0] if f not in fields],
        "limitations": ["Categories may not agree with each other. No semantic consistency or accuracy is assumed.", "Satisfaction is missing for 5700 records. Missing ratings are excluded, never treated as zero.", "No ticket creation timestamps are included. No SLA, time trends, or resolution-speed claims are made.", "The dataset covers technology products, not an actual Nike service operation. This project is independent and unaffiliated."]
    },
    "columns": ["id", "type", "subject", "status", "priority", "channel", "product", "rating"],
    "rows": result
}
dest = pathlib.Path(__file__).resolve().parents[1] / "demo/data/support.json"
dest.parent.mkdir(parents=True, exist_ok=True)
dest.write_text(json.dumps(snapshot, separators=(",", ":")), encoding="utf-8")
print(json.dumps({"rows": len(result), "rated": sum(r[-1] is not None for r in result), "publishedFields": snapshot["columns"], "bytes": dest.stat().st_size}))
