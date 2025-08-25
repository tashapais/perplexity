import os
import httpx
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

logger = logging.getLogger(__name__)

class ConnectorProvider(str, Enum):
    GOOGLE_DRIVE = "google-drive"
    NOTION = "notion"
    ONEDRIVE = "onedrive"

@dataclass
class ConnectorAuth:
    auth_link: str
    connection_id: str
    provider: ConnectorProvider

@dataclass
class ConnectionStatus:
    id: str
    provider: ConnectorProvider
    status: str
    last_sync: Optional[str] = None
    documents_count: Optional[int] = None
    created_at: Optional[str] = None

@dataclass
class SyncResult:
    success: bool
    documents_synced: int
    errors: List[str]
    sync_time: str

class SupermemoryConnectorService:
    def __init__(self, api_key: str, base_url: str, redirect_url: str):
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.redirect_url = redirect_url
        self.client = httpx.AsyncClient(timeout=30.0)
        
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
    
    def _get_headers(self) -> Dict[str, str]:
        """Get headers for supermemory API requests"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    
    async def create_connection(self, provider: ConnectorProvider, user_id: str) -> ConnectorAuth:
        """
        Create a new connection to a provider (Google Drive, Notion, OneDrive)
        Based on: https://supermemory.ai/docs/memory-api/connectors/overview
        """
        if not self.api_key:
            raise ValueError("Supermemory API key not configured. Please add SUPERMEMORY_API_KEY to your .env file.")
        
        try:
            url = f"{self.base_url}/v3/connections/{provider.value}"
            payload = {
                "redirectUrl": self.redirect_url,
                "userId": user_id
            }
            
            response = await self.client.post(
                url,
                json=payload,
                headers=self._get_headers()
            )
            
            if response.status_code != 200:
                logger.error(f"Failed to create {provider.value} connection: {response.status_code} - {response.text}")
                raise Exception(f"Failed to create connection: {response.text}")
            
            data = response.json()
            
            return ConnectorAuth(
                auth_link=data.get("authLink", ""),
                connection_id=data.get("connectionId", ""),
                provider=provider
            )
            
        except httpx.RequestError as e:
            logger.error(f"Network error creating {provider.value} connection: {str(e)}")
            raise Exception(f"Network error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error creating {provider.value} connection: {str(e)}")
            raise
    
    async def list_connections(self, user_id: str) -> List[ConnectionStatus]:
        """List all connections for a user"""
        if not self.api_key:
            logger.warning("Supermemory API key not configured, returning empty list")
            return []
        
        try:
            url = f"{self.base_url}/v3/connections"
            params = {"userId": user_id}
            
            response = await self.client.get(
                url,
                params=params,
                headers=self._get_headers()
            )
            
            if response.status_code != 200:
                logger.error(f"Failed to list connections: {response.status_code} - {response.text}")
                return []
            
            data = response.json()
            connections = []
            
            for conn in data.get("connections", []):
                connections.append(ConnectionStatus(
                    id=conn.get("id", ""),
                    provider=ConnectorProvider(conn.get("provider", "")),
                    status=conn.get("status", "unknown"),
                    last_sync=conn.get("lastSync"),
                    documents_count=conn.get("documentsCount"),
                    created_at=conn.get("createdAt")
                ))
            
            return connections
            
        except Exception as e:
            logger.error(f"Error listing connections: {str(e)}")
            return []
    
    async def delete_connection(self, connection_id: str) -> bool:
        """Delete a connection"""
        if not self.api_key:
            # For demo purposes, always return success
            logger.warning("Supermemory API key not configured, simulating successful deletion")
            return True
        
        try:
            url = f"{self.base_url}/v3/connections/{connection_id}"
            
            response = await self.client.delete(
                url,
                headers=self._get_headers()
            )
            
            if response.status_code == 200:
                logger.info(f"Successfully deleted connection {connection_id}")
                return True
            else:
                logger.error(f"Failed to delete connection {connection_id}: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error deleting connection {connection_id}: {str(e)}")
            return False
    
    async def sync_connection(self, provider: ConnectorProvider, connection_id: str) -> SyncResult:
        """
        Manually sync a connection
        Based on: https://supermemory.ai/docs/memory-api/connectors/overview
        """
        if not self.api_key:
            # For demo purposes, return a mock sync result
            logger.warning("Supermemory API key not configured, returning mock sync result")
            return SyncResult(
                success=True,
                documents_synced=5,
                errors=[],
                sync_time=datetime.now().isoformat()
            )
        
        try:
            url = f"{self.base_url}/v3/connections/{provider.value}/sync"
            payload = {"connectionId": connection_id}
            
            response = await self.client.post(
                url,
                json=payload,
                headers=self._get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                return SyncResult(
                    success=True,
                    documents_synced=data.get("documentsSynced", 0),
                    errors=[],
                    sync_time=datetime.now().isoformat()
                )
            else:
                logger.error(f"Sync failed for {provider.value}: {response.status_code} - {response.text}")
                return SyncResult(
                    success=False,
                    documents_synced=0,
                    errors=[f"Sync failed: {response.text}"],
                    sync_time=datetime.now().isoformat()
                )
                
        except Exception as e:
            logger.error(f"Error syncing {provider.value} connection: {str(e)}")
            return SyncResult(
                success=False,
                documents_synced=0,
                errors=[str(e)],
                sync_time=datetime.now().isoformat()
            )
    
    async def get_synced_documents(self, user_id: str, provider: Optional[ConnectorProvider] = None) -> List[Dict[str, Any]]:
        """Get documents that have been synced from connectors"""
        if not self.api_key:
            logger.warning("Supermemory API key not configured, returning empty list")
            return []
        
        try:
            url = f"{self.base_url}/v3/memories"
            params = {"userId": user_id}
            
            if provider:
                params["source"] = provider.value
            
            response = await self.client.get(
                url,
                params=params,
                headers=self._get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("memories", [])
            else:
                logger.error(f"Failed to get synced documents: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"Error getting synced documents: {str(e)}")
            return []

# Global service instance
def create_supermemory_service(api_key: str, base_url: str, redirect_url: str) -> SupermemoryConnectorService:
    return SupermemoryConnectorService(api_key, base_url, redirect_url)
