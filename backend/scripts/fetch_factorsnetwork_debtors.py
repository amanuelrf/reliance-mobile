#!/usr/bin/env python3
"""
Fetch all debtors from FactorsNetwork and insert into companies.

This script paginates the /api/debtors.json endpoint, de-duplicates
by factor_network_uuid or mc_number, and stores the results in the
companies table using user_id=1. It is intended for one-off or batch
imports when seeding the database from FactorsNetwork.
"""

import os
import sys
import time
from typing import Any, Dict, List, Optional, Tuple

import httpx

# Ensure app imports resolve when running from repo root or backend/
CURRENT_DIR = os.path.dirname(__file__)
BACKEND_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
sys.path.insert(0, BACKEND_ROOT)

from app.db.database import SessionLocal
from app.db.models import Company
from app.core.config import settings


def get_auth() -> Optional[httpx.BasicAuth]:
    if settings.FACTORS_NETWORK_USERNAME and settings.FACTORS_NETWORK_PASSWORD:
        return httpx.BasicAuth(settings.FACTORS_NETWORK_USERNAME, settings.FACTORS_NETWORK_PASSWORD)
    return None


def fetch_page(client: httpx.Client, first_result: int, max_results: int) -> Tuple[List[Dict[str, Any]], int]:
    response = client.get(
        "/api/debtors.json",
        params={
            "firstResult": first_result,
            "maxResults": max_results,
            "includeBranches": "false",
        },
        auth=get_auth(),
    )
    response.raise_for_status()
    payload = response.json()
    debtors = payload.get("debtors", []) if isinstance(payload, dict) else []
    total_records = payload.get("totalRecords", len(debtors)) if isinstance(payload, dict) else len(debtors)
    return debtors, total_records


def upsert_companies(records: List[Dict[str, Any]]) -> Tuple[int, int]:
    inserted = 0
    skipped = 0
    session = SessionLocal()
    try:
        for debtor in records:
            factor_uuid = debtor.get("uuid")
            if not factor_uuid:
                skipped += 1
                continue

            mc_number = debtor.get("mcNumber")
            exists = (
                session.query(Company)
                .filter(
                    (Company.factor_network_uuid == factor_uuid)
                    | (
                        Company.mc_number.isnot(None)
                        & (Company.mc_number == (str(mc_number) if mc_number is not None else None))
                    )
                )
                .first()
            )
            if exists:
                skipped += 1
                continue

            company = Company(
                user_id=1,
                name=debtor.get("companyName") or "Unknown",
                mc_number=str(mc_number) if mc_number is not None else None,
                dot_number=str(debtor.get("dotNumber")) if debtor.get("dotNumber") is not None else None,
                factor_network_uuid=factor_uuid,
                status=None,
            )
            session.add(company)
            inserted += 1

        session.commit()
    finally:
        session.close()

    return inserted, skipped


def main() -> None:
    if not settings.FACTORS_NETWORK_BASE_URL:
        raise SystemExit("FACTORS_NETWORK_BASE_URL is required.")

    max_results = 1000
    first_result = 151000
    total_records = None
    total_inserted = 0
    total_skipped = 0

    with httpx.Client(
        base_url=settings.FACTORS_NETWORK_BASE_URL,
        timeout=settings.FACTORS_NETWORK_TIMEOUT_SECONDS,
        verify=settings.FACTORS_NETWORK_VERIFY_SSL,
    ) as client:
        while total_records is None or first_result < total_records:
            debtors, total_records = fetch_page(client, first_result, max_results)
            total_records = 500000
            if not debtors:
                break

            inserted, skipped = upsert_companies(debtors)
            total_inserted += inserted
            total_skipped += skipped

            first_result += max_results
            print(f"first_result: {first_result}, total_records: {total_records}")
            time.sleep(30)

    print(f"Inserted: {total_inserted}, Skipped: {total_skipped}")


if __name__ == "__main__":
    main()
