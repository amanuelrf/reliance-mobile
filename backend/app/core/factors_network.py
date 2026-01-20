"""
FactorsNetwork API Client
"""

import httpx
from typing import List, Dict, Any, Optional

from app.core.config import settings


class FactorsNetworkClient:
    """Client for interacting with FactorsNetwork API"""
    
    def __init__(self):
        self.base_url = settings.FACTORS_NETWORK_BASE_URL
        self.username = settings.FACTORS_NETWORK_USERNAME
        self.password = settings.FACTORS_NETWORK_PASSWORD
        self.verify_ssl = settings.FACTORS_NETWORK_VERIFY_SSL
        self.timeout = settings.FACTORS_NETWORK_TIMEOUT_SECONDS
    
    def _get_auth(self) -> Optional[httpx.BasicAuth]:
        """Get authentication credentials"""
        if self.username and self.password:
            return httpx.BasicAuth(self.username, self.password)
        return None
    
    async def search_debtors(
        self,
        mc_number: Optional[str] = None,
        dot_number: Optional[str] = None,
        name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for debtors by MC number, DOT number, or name
        
        Args:
            mc_number: Motor carrier number
            dot_number: DOT number
            name: Company name
            
        Returns:
            List of debtor records
        """
        params = {}
        if mc_number:
            params["mcNumber"] = mc_number
        if dot_number:
            params["dotNumber"] = dot_number
        if name:
            params["name"] = name
        
        async with httpx.AsyncClient(
            base_url=self.base_url,
            timeout=self.timeout,
            verify=self.verify_ssl
        ) as client:
            response = await client.get(
                "/api/debtors.json",
                params=params,
                auth=self._get_auth()
            )
            response.raise_for_status()
            payload = response.json()
            debtors = payload.get("debtors", []) if isinstance(payload, dict) else []
            return debtors
    
    async def get_credit_status(self, debtor_uuid: str) -> Dict[str, Any]:
        """
        Get credit status for a debtor by UUID
        
        Args:
            debtor_uuid: UUID of the debtor
            
        Returns:
            Credit status data
        """
        async with httpx.AsyncClient(
            base_url=self.base_url,
            timeout=self.timeout,
            verify=self.verify_ssl
        ) as client:
            response = await client.get(
                f"/api/debtors/{debtor_uuid}/credit-status.json",
                auth=self._get_auth()
            )
            response.raise_for_status()
            return response.json()
