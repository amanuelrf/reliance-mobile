#!/usr/bin/env python3
"""
Import companies from a CSV file into the companies table.

Execution:
  python scripts/import_companies_from_csv.py --csv /path/to/file.csv
  python scripts/import_companies_from_csv.py --csv /path/to/file.csv --limit 100
  python scripts/import_companies_from_csv.py --csv /path/to/file.csv --dry-run

CSV source file
    	 https://data.transportation.gov/Trucking-and-Motorcoaches/Carrier-All-With-History/6eyk-hxee/explore/query/SELECT%0A%20%20%60docket_number%60%2C%0A%20%20%60dot_number%60%2C%0A%20%20%60mx_type%60%2C%0A%20%20%60rfc_number%60%2C%0A%20%20%60common_stat%60%2C%0A%20%20%60contract_stat%60%2C%0A%20%20%60broker_stat%60%2C%0A%20%20%60common_app_pend%60%2C%0A%20%20%60contract_app_pend%60%2C%0A%20%20%60broker_app_pend%60%2C%0A%20%20%60common_rev_pend%60%2C%0A%20%20%60contract_rev_pend%60%2C%0A%20%20%60broker_rev_pend%60%2C%0A%20%20%60property_chk%60%2C%0A%20%20%60passenger_chk%60%2C%0A%20%20%60hhg_chk%60%2C%0A%20%20%60private_auth_chk%60%2C%0A%20%20%60enterprise_chk%60%2C%0A%20%20%60min_cov_amount%60%2C%0A%20%20%60cargo_req%60%2C%0A%20%20%60bond_req%60%2C%0A%20%20%60bipd_file%60%2C%0A%20%20%60cargo_file%60%2C%0A%20%20%60bond_file%60%2C%0A%20%20%60undeliverable_mail%60%2C%0A%20%20%60dba_name%60%2C%0A%20%20%60legal_name%60%2C%0A%20%20%60bus_street_po%60%2C%0A%20%20%60bus_colonia%60%2C%0A%20%20%60bus_city%60%2C%0A%20%20%60bus_state_code%60%2C%0A%20%20%60bus_ctry_code%60%2C%0A%20%20%60bus_zip_code%60%2C%0A%20%20%60bus_telno%60%2C%0A%20%20%60bus_fax%60%2C%0A%20%20%60mail_street_po%60%2C%0A%20%20%60mail_colonia%60%2C%0A%20%20%60mail_city%60%2C%0A%20%20%60mail_state_code%60%2C%0A%20%20%60mail_ctry_code%60%2C%0A%20%20%60mail_zip_code%60%2C%0A%20%20%60mail_telno%60%2C%0A%20%20%60mail_fax%60%0AWHERE%0A%20%20caseless_contains%28%60broker_stat%60%2C%20%22A%22%29%0A%20%20AND%20caseless_ne%28%60broker_app_pend%60%2C%20%22Y%22%29%0A%20%20AND%20caseless_ne%28%60broker_rev_pend%60%2C%20%22Y%22%29/page/filter

Expected CSV headers include:
  DOCKET_NUMBER, DOT_NUMBER, LEGAL_NAME, DBA_NAME, BUS_* address fields.

Rules:
  - Normalize DOCKET_NUMBER by stripping "MC" prefix and leading zeros.
  - Require both MC (DOCKET_NUMBER) and DOT_NUMBER to be present.
  - Update existing company only when both MC and DOT match.
  - Insert new company when both MC and DOT are present but no match exists.
"""

import argparse
import csv
import os
import sys
from typing import Dict, Optional, Tuple

# Ensure app imports resolve when running from repo root or backend/
CURRENT_DIR = os.path.dirname(__file__)
BACKEND_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
sys.path.insert(0, BACKEND_ROOT)

from app.db.database import SessionLocal
from app.db.models import Company


def normalize_mc(value: Optional[str]) -> Optional[int]:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    upper = text.upper()
    if upper.startswith("MC"):
        text = text[2:].strip()
    text = text.lstrip("0")
    if not text:
        return None
    if not text.isdigit():
        return None
    return int(text)


def normalize_dot(value: Optional[str]) -> Optional[int]:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    if not text.isdigit():
        return None
    return int(text)


def extract_row_fields(row: Dict[str, str]) -> Tuple[Optional[int], Optional[int], str, Dict[str, str]]:
    mc_number = normalize_mc(row.get("DOCKET_NUMBER"))
    dot_number = normalize_dot(row.get("DOT_NUMBER"))
    legal_name = (row.get("LEGAL_NAME") or "").strip()
    dba_name = (row.get("DBA_NAME") or "").strip()
    name = legal_name or dba_name or "Unknown"
    safer_fields = {
        "safer_name": legal_name or None,
        "safer_dba_name": dba_name or None,
        "safer_address": (row.get("BUS_STREET_PO") or "").strip() or None,
        "safer_city": (row.get("BUS_CITY") or "").strip() or None,
        "safer_state": (row.get("BUS_STATE_CODE") or "").strip() or None,
        "safer_zip": (row.get("BUS_ZIP_CODE") or "").strip() or None,
        "safer_active": 1,
        "safer_is_broker": 1,
    }
    return mc_number, dot_number, name, safer_fields


def upsert_from_csv(csv_path: str, limit: Optional[int] = None, dry_run: bool = False) -> Tuple[int, int, int]:
    inserted = 0
    updated = 0
    skipped = 0

    session = SessionLocal()
    try:
        with open(csv_path, newline="", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            for idx, row in enumerate(reader, start=1):
                if idx % 1000 == 0:
                    print(
                        "Processed rows: "
                        f"{idx} (Inserted: {inserted}, Updated: {updated}, Skipped: {skipped})"
                    )
                if limit is not None and idx > limit:
                    break

                mc_number, dot_number, name, safer_fields = extract_row_fields(row)
                if mc_number is None or dot_number is None:
                    skipped += 1
                    continue

                company = (
                    session.query(Company)
                    .filter(Company.mc_number == mc_number, Company.dot_number == dot_number)
                    .first()
                )

                if company:
                    if name:
                        company.name = name
                    for key, value in safer_fields.items():
                        if value is not None:
                            setattr(company, key, value)
                    updated += 1
                else:
                    company = Company(
                        user_id=1,
                        name=name,
                        mc_number=mc_number,
                        dot_number=dot_number,
                        safer_name=safer_fields["safer_name"],
                        safer_dba_name=safer_fields["safer_dba_name"],
                        safer_address=safer_fields["safer_address"],
                        safer_city=safer_fields["safer_city"],
                        safer_state=safer_fields["safer_state"],
                        safer_zip=safer_fields["safer_zip"],
                        safer_active=safer_fields["safer_active"],
                        safer_is_broker=safer_fields["safer_is_broker"],
                        status=None,
                    )
                    session.add(company)
                    inserted += 1
                if not dry_run and idx % 1000 == 0:
                    session.commit()
                    session.expunge_all()

        if dry_run:
            session.rollback()
        else:
            session.commit()
    finally:
        session.close()

    return inserted, updated, skipped


def main() -> None:
    parser = argparse.ArgumentParser(description="Import companies from CSV.")
    parser.add_argument("--csv", required=True, help="Path to CSV file.")
    parser.add_argument("--limit", type=int, default=None, help="Max rows to process.")
    parser.add_argument("--dry-run", action="store_true", help="Parse and report without saving.")
    args = parser.parse_args()

    inserted, updated, skipped = upsert_from_csv(args.csv, limit=args.limit, dry_run=args.dry_run)
    print(f"Inserted: {inserted}, Updated: {updated}, Skipped: {skipped}")


if __name__ == "__main__":
    main()
