from pydantic import BaseModel
from typing import Optional


class RevokeRequest(BaseModel):
    token: str
    reason: Optional[str] = "admin_revoked"


class EmergencyRevokeRequest(BaseModel):
    document_id: str
    scope: str = "document"           # "document" | "department" | "all"
    action_type: str = "lockdown"     # "lockdown" | "revoke_all"
    reason: Optional[str] = "emergency"


class EmergencyRevokeResponse(BaseModel):
    success: bool
    locked_document_ids: list[str]
    message: str
