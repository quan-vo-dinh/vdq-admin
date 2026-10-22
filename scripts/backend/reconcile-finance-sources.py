"""Read-only comparison of the supplied VCB workbook and revised Markdown notes.

No imports or database mutations. Extracts cached values and original formulas
from OOXML, then independently checks the running arithmetic.
"""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import xml.etree.ElementTree as ET
import zipfile

args = argparse.ArgumentParser()
args.add_argument("--workbook", required=True, type=Path)
args.add_argument("--notes", required=True, type=Path)
args.add_argument("--directory", required=True, type=Path)
opts = args.parse_args()
root = Path(__file__).resolve().parents[2]
destination = opts.directory.resolve()
if destination == root or root in destination.parents:
    raise SystemExit("Private output directory must be outside the repository")
destination.mkdir(parents=True, exist_ok=True, mode=0o700)
ns = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
sheets = {}
with zipfile.ZipFile(opts.workbook) as archive:
    strings = []
    if "xl/sharedStrings.xml" in archive.namelist():
        strings = ["".join(cell.itertext()) for cell in ET.fromstring(archive.read("xl/sharedStrings.xml")).findall("s:si", ns)]
    relations = {r.attrib["Id"]: r.attrib["Target"] for r in ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))}
    for sheet in ET.fromstring(archive.read("xl/workbook.xml")).find("s:sheets", ns):
        target = relations[sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]]
        target = target.lstrip("/") if target.startswith("/") else "xl/" + target
        cells = {}
        for cell in ET.fromstring(archive.read(target)).findall(".//s:sheetData/s:row/s:c", ns):
            raw, formula = cell.find("s:v", ns), cell.find("s:f", ns)
            value, kind = raw.text if raw is not None else None, cell.attrib.get("t")
            if kind == "s":
                value = strings[int(value)]
            elif kind == "inlineStr":
                value = "".join(cell.find("s:is", ns).itertext())
            elif value is not None and kind not in ("str", "e", "b"):
                value = float(value)
                value = int(value) if value.is_integer() else value
            cells[cell.attrib["r"]] = {"value": value, "formula": formula.text if formula is not None else None}
        sheets[sheet.attrib["name"]] = cells

overview = sheets["01_Tong_quan"]
ledger = sheets["02_So_du_VCB_68_dong"]
opening, observed = overview["B4"]["value"], overview["B9"]["value"]
running, events, cached_errors = opening, [], []
for index in range(5, 73):
    row = {column: ledger.get(f"{column}{index}", {}).get("value") for column in "ABCDEFGHIJK"}
    amount = row["D"]
    if not isinstance(amount, int):
        raise SystemExit(f"Non-integer VND at ledger row {index}")
    inferred = row["I"] == "Điều chỉnh suy ra" or str(row["K"]).startswith("ADJ-")
    date = (datetime.date(1899, 12, 30) + datetime.timedelta(days=row["B"])).isoformat()
    running += amount
    if row["E"] != running:
        cached_errors.append({"cell": f"E{index}", "expected": running, "cached": row["E"]})
    if isinstance(row["F"], int) and row["G"] != row["F"] - running:
        cached_errors.append({"cell": f"G{index}", "expected": row["F"] - running, "cached": row["G"]})
    events.append({"row": index, "date": date, "time": row["C"], "amount": amount, "reference": row["K"], "inferred": inferred, "description": row["H"]})

notes = opts.notes.read_text()
note_rows, note_refs = {}, {}
for line in notes.splitlines():
    columns = [c.strip() for c in line.split("|")]
    if len(columns) < 4 or not re.fullmatch(r"\d{2}", columns[1]):
        continue
    match = re.match(r"(\d{2})/(\d{2})\s*·\s*(\d{2}:\d{2})", columns[2])
    if match:
        note_rows[columns[1]] = {"date": f"2026-{match[2]}-{match[1]}", "time": match[3], "amount": int(columns[3].replace(".", "").replace("−", "-"))}
    elif columns[2].startswith("`"):
        note_refs[columns[1]] = columns[2].strip("`")
source = [e for e in events if not e["inferred"]]
by_ref = {e["reference"]: e for e in source}
differences = []
for identifier, row in note_rows.items():
    workbook_row = by_ref.get(note_refs.get(identifier))
    if workbook_row is None or any(row[k] != workbook_row[k] for k in ("date", "time", "amount")):
        differences.append({"noteId": identifier, "note": row, "workbook": workbook_row})
incoming = sum(e["amount"] for e in source if e["amount"] > 0)
outgoing = -sum(e["amount"] for e in source if e["amount"] < 0)
result = {"readOnly": True, "sources": {str(p): hashlib.sha256(p.read_bytes()).hexdigest() for p in (opts.workbook, opts.notes)}, "sheetCount": len(sheets), "sourceRows": len(source), "inferredRows": len(events) - len(source), "noteRows": len(note_rows), "opening": opening, "incomingSourceOnly": incoming, "outgoingSourceOnly": outgoing, "closingSourceOnly": opening + incoming - outgoing, "observedClosing": observed, "unexplained": observed - (opening + incoming - outgoing), "includingInferred": running, "cachedArithmeticErrors": cached_errors, "sourceDifferences": differences, "events": events, "boundary": "Secondary transcription, not verification against original bank images. Inferred rows are never real transactions. Formulas were inspected and arithmetic recomputed; native Excel recalculation was not performed."}
output = destination / "source-reconciliation.json"
with open(output, "w", opener=lambda path, flags: os.open(path, flags, 0o600)) as file:
    json.dump(result, file, ensure_ascii=False, indent=2)
print(json.dumps({"readOnly": True, "output": str(output), "sourceRows": len(source), "inferredRows": result["inferredRows"], "cachedArithmeticErrors": len(cached_errors), "sourceDifferences": len(differences)}))
