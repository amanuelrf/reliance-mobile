"""
Company Routes
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, cast, String
from typing import List, Optional

from app.db.database import get_db
from app.db.models import Company
from app.schemas.company import CompanyAutocompleteResponse
from app.core.security import get_current_user_id

router = APIRouter()


def normalize_digits(query: str) -> Optional[int]:
    """
    Normalize query string for MC/DOT number lookup.
    Removes 'mc' or 'mc-' prefix (case-insensitive) and trailing zeros.
    
    Examples:
        "mc-123" -> 123
        "MC 456" -> 456
        "789000" -> 789
        "total q" -> None
    """
    if not query:
        return None
    
    # Remove mc or mc- prefix (case-insensitive)
    normalized = query.strip()
    normalized = normalized.lower()
    if normalized.startswith("mc-"):
        normalized = normalized[3:]
    elif normalized.startswith("mc"):
        normalized = normalized[2:]
    
    # Remove leading/trailing whitespace
    normalized = normalized.strip()
    
    # Remove trailing zeros
    normalized = normalized.rstrip("0")
    if not normalized:
        return None
    
    # Try to convert to int
    try:
        return int(normalized)
    except ValueError:
        return None


@router.get("/autocomplete", response_model=List[CompanyAutocompleteResponse])
async def autocomplete_companies(
    query: str = Query(..., description="Search query for company name, MC number, or DOT number"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of results to return"),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> List[CompanyAutocompleteResponse]:
    """
    Autocomplete companies by name, MC number, or DOT number.
    
    Search logic:
    1. Exact MC match (highest priority)
    2. Exact DOT match
    3. MC prefix match
    4. DOT prefix match
    5. Text match in search_text (substring, case-insensitive)
    
    Query normalization:
    - Removes "mc" or "mc-" prefix
    - Removes trailing zeros for numeric queries
    - Supports both numeric and text searches
    """
    if not query or not query.strip():
        return []
    
    normalized_int = normalize_digits(query)
    results = []
    seen_ids = set()
    
    # Base filter: user_id and not deleted
    base_filter = and_(
        Company.user_id == user_id,
        Company.deleted_at.is_(None)
    )
    
    # 1. Exact MC match (rank 1)
    if normalized_int is not None:
        mc_exact = db.query(Company).filter(
            base_filter,
            Company.mc_number == normalized_int
        ).all()
        for company in mc_exact:
            if company.id not in seen_ids:
                results.append((1, company))
                seen_ids.add(company.id)
    
    # 2. Exact DOT match (rank 2)
    if normalized_int is not None:
        dot_exact = db.query(Company).filter(
            base_filter,
            Company.dot_number == normalized_int
        ).all()
        for company in dot_exact:
            if company.id not in seen_ids:
                results.append((2, company))
                seen_ids.add(company.id)
    
    # 3. MC prefix match (rank 3)
    if normalized_int is not None:
        mc_prefix = db.query(Company).filter(
            base_filter,
            Company.mc_number.isnot(None),
            cast(Company.mc_number, String).like(f"{normalized_int}%")
        ).all()
        for company in mc_prefix:
            if company.id not in seen_ids:
                results.append((3, company))
                seen_ids.add(company.id)
    
    # 4. DOT prefix match (rank 4)
    if normalized_int is not None:
        dot_prefix = db.query(Company).filter(
            base_filter,
            Company.dot_number.isnot(None),
            cast(Company.dot_number, String).like(f"{normalized_int}%")
        ).all()
        for company in dot_prefix:
            if company.id not in seen_ids:
                results.append((4, company))
                seen_ids.add(company.id)
    
    # 5. Text match in search_text (rank 5)
    text_matches = db.query(Company).filter(
        base_filter,
        Company.search_text.isnot(None),
        Company.search_text.ilike(f"%{query}%")
    ).order_by(Company.name.asc()).all()
    
    for company in text_matches:
        if company.id not in seen_ids:
            results.append((5, company))
            seen_ids.add(company.id)
    
    # Sort by rank, then by name
    results.sort(key=lambda x: (x[0], x[1].name))
    
    # Limit results
    limited_results = [company for _, company in results[:limit]]
    
    return limited_results
