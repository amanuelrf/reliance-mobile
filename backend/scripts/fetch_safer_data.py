#!/usr/bin/env python3
"""
Fetch SAFER/FMCSA data for companies missing safer_is_broker.

Uses the FMCSA API to look up carriers by MC number and updates
SAFER fields on the companies table.

Required env var:
  SAFER_WEB_KEY=your_key

Example:
  python scripts/fetch_safer_data.py --limit 100
"""

import argparse
import json
import os
import sys
import time
from typing import Any, Dict, Optional, Tuple

import httpx

# Ensure app imports resolve when running from repo root or backend/
CURRENT_DIR = os.path.dirname(__file__)
BACKEND_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
sys.path.insert(0, BACKEND_ROOT)

from app.core.config import settings
from app.db.database import SessionLocal
from app.db.models import Company


BASE_URL = "https://mobile.fmcsa.dot.gov/qc/services/carriers"

CANDIDATE_KEYS = {
    "legalName",
    "legal_name",
    "name",
    "dbaName",
    "dba_name",
    "phyStreet",
    "phy_street",
    "address",
    "street",
    "street1",
    "phyCity",
    "phy_city",
    "city",
    "phyState",
    "phy_state",
    "state",
    "phyZipcode",
    "phy_zipcode",
    "zip",
    "zipcode",
    "statusCode",
    "status_code",
    "operatingStatus",
    "operating_status",
    "allowedToOperate",
    "allowed_to_operate",
    "brokerAuthorityStatus",
    "broker_authority_status",
    "brokerAuthority",
    "broker_authority",
}


def truncate_json(payload: Any, limit: int = 800) -> str:
    try:
        text = json.dumps(payload, ensure_ascii=True)
    except TypeError:
        text = str(payload)
    return text if len(text) <= limit else f"{text[:limit]}...<truncated>"


def fetch_json(
    client: httpx.Client,
    url: str,
    api_key: str,
    *,
    debug: bool = False,
    label: str = "SAFER",
) -> Optional[Dict[str, Any]]:
    try:
        response = client.get(url, params={"webKey": api_key}, timeout=30)
        if debug:
            print(f"{label} status: {response.status_code} url: {response.url}")
        if response.status_code == 200:
            payload = response.json()
            if debug:
                print(f"{label} response preview: {truncate_json(payload)}")
            return payload
        if debug:
            print(f"{label} non-200 response: {response.text[:500]}")
        return None
    except httpx.HTTPError as exc:
        if debug:
            print(f"{label} http error: {exc}")
        return None
    finally:
        time.sleep(2)


def extract_carrier(payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if "content" in payload and isinstance(payload["content"], list) and payload["content"]:
        first = payload["content"][0]
        if isinstance(first, dict):
            return (
                first.get("carrier")
                or first.get("basics")
                or first.get("basic")
                or first
            )
    if "carrier" in payload and isinstance(payload["carrier"], dict):
        return payload["carrier"]
    if "basics" in payload and isinstance(payload["basics"], dict):
        return payload["basics"]
    if "basic" in payload and isinstance(payload["basic"], dict):
        return payload["basic"]
    return find_carrier_dict(payload)


def find_carrier_dict(payload: Any) -> Optional[Dict[str, Any]]:
    def has_candidate_keys(obj: Dict[str, Any]) -> bool:
        return any(key in obj for key in CANDIDATE_KEYS)

    stack = [payload]
    while stack:
        current = stack.pop()
        if isinstance(current, dict):
            if has_candidate_keys(current):
                return current
            for preferred in ("carrier", "basics", "basic"):
                preferred_value = current.get(preferred)
                if isinstance(preferred_value, dict) and has_candidate_keys(preferred_value):
                    return preferred_value
                if isinstance(preferred_value, (dict, list)):
                    stack.append(preferred_value)
            for value in current.values():
                if isinstance(value, (dict, list)):
                    stack.append(value)
        elif isinstance(current, list):
            for item in current:
                if isinstance(item, (dict, list)):
                    stack.append(item)
    return None


def map_fields(carrier: Dict[str, Any]) -> Dict[str, Any]:
    legal_name = carrier.get("legalName") or carrier.get("legal_name") or carrier.get("name")
    dba_name = carrier.get("dbaName") or carrier.get("dba_name")
    safer_address = (
        carrier.get("phyStreet")
        or carrier.get("phy_street")
        or carrier.get("address")
        or carrier.get("street")
        or carrier.get("street1")
    )
    safer_city = carrier.get("phyCity") or carrier.get("phy_city") or carrier.get("city")
    safer_state = carrier.get("phyState") or carrier.get("phy_state") or carrier.get("state")
    safer_zip = (
        carrier.get("phyZipcode")
        or carrier.get("phy_zipcode")
        or carrier.get("zip")
        or carrier.get("zipcode")
    )
    operating_status = (
        carrier.get("statusCode")
        or carrier.get("status_code")
        or carrier.get("operatingStatus")
        or carrier.get("operating_status")
    )
    allowed_to_operate = carrier.get("allowedToOperate") or carrier.get("allowed_to_operate")
    broker_status = (
        carrier.get("brokerAuthorityStatus")
        or carrier.get("broker_authority_status")
        or carrier.get("brokerAuthority")
        or carrier.get("broker_authority")
    )

    safer_is_broker = 1 if str(broker_status).upper() == "A" else 0 if broker_status is not None else None
    safer_active = (
        1
        if str(operating_status).upper() == "A" and str(allowed_to_operate).upper() == "Y"
        else 0
        if operating_status is not None or allowed_to_operate is not None
        else None
    )

    return {
        "safer_name": legal_name,
        "safer_dba_name": dba_name,
        "safer_address": safer_address,
        "safer_city": safer_city,
        "safer_state": safer_state,
        "safer_zip": safer_zip,
        "safer_active": safer_active,
        "safer_is_broker": safer_is_broker,
    }


def process_company(
    client: httpx.Client,
    api_key: str,
    company: Company,
    *,
    debug: bool = False,
) -> Tuple[bool, str]:
    mc_number = company.mc_number
    if not mc_number:
        return False, "missing mc_number"

    mc_clean = str(mc_number).upper().replace("MC", "").lstrip("0") or "0"
    lookup_url = f"{BASE_URL}/docket-number/{mc_clean}"
    print(f"Fetching SAFER for company {company.id} MC {mc_number} (lookup: {lookup_url})")
    payload = fetch_json(client, lookup_url, api_key, debug=debug, label="SAFER lookup")
    if not payload:
        return False, "lookup_failed"

    print(f"SAFER lookup response keys: {list(payload.keys())}")
    if debug and isinstance(payload.get("content"), list):
        print(f"SAFER lookup content count: {len(payload['content'])}")
        if payload["content"]:
            first = payload["content"][0]
            if isinstance(first, dict):
                print(f"SAFER lookup first item keys: {list(first.keys())}")
                if "_links" in first:
                    print(f"SAFER lookup first item _links: {first['_links']}")
                print(f"SAFER lookup first item preview: {truncate_json(first)}")
    elif debug:
        print(f"SAFER lookup payload preview: {truncate_json(payload)}")

    carrier = extract_carrier(payload)
    if not carrier:
        company.safer_is_broker = 0
        company.safer_active = 0
        return True, "carrier_missing"
    if debug:
        print(f"SAFER carrier keys: {list(carrier.keys())}")
        print(f"SAFER carrier preview: {truncate_json(carrier)}")

    mapped = map_fields(carrier)
    print(f"Updating company {company.id} with SAFER fields: {mapped}")
    if debug and all(value is None for value in mapped.values()):
        print("Mapped SAFER fields are empty; carrier payload may use unexpected keys.")
    if mapped.get("safer_is_broker") is None and mapped.get("safer_active") is None:
        return False, "missing_safer_status"
    for key, value in mapped.items():
        setattr(company, key, value)

    return True, "updated"


def main() -> None:
    parser = argparse.ArgumentParser(description="Populate SAFER fields for companies.")
    parser.add_argument("--limit", type=int, default=100, help="Max rows to process.")
    parser.add_argument("--debug", action="store_true", help="Log SAFER responses.")
    args = parser.parse_args()

    api_key = settings.SAFER_WEB_KEY
    if not api_key:
        raise SystemExit("SAFER_WEB_KEY is required (env var or .env).")

    session = SessionLocal()
    updated = 0
    skipped = 0
    try:
        companies = (
            session.query(Company)
            .filter(Company.safer_is_broker.is_(None))
            .limit(args.limit)
            .all()
        )

        with httpx.Client(headers={"Accept": "application/json", "User-Agent": "FMCSA-Python-Client/1.0"}) as client:
            for company in companies:
                ok, reason = process_company(client, api_key, company, debug=args.debug)
                if ok:
                    updated += 1
                else:
                    skipped += 1
                    print(f"Skipped company {company.id}: {reason}")

        session.commit()
    finally:
        session.close()

    print(f"Updated: {updated}, Skipped: {skipped}")


if __name__ == "__main__":
    main()
