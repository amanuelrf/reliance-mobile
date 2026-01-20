"""
Company Schemas
"""

from pydantic import BaseModel
from typing import Optional


class CompanyAutocompleteResponse(BaseModel):
    """Response schema for company autocomplete results"""
    id: int
    name: str
    legal_name: Optional[str] = None
    mc_number: Optional[int] = None
    dot_number: Optional[int] = None

    class Config:
        from_attributes = True
