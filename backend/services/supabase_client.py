from supabase import create_client, Client
from config import settings

_client: Client | None = None
_service_client: Client | None = None

def get_supabase() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.supabase_url, settings.supabase_anon_key)
    return _client

def get_service_supabase() -> Client:
    """Service-role client — bypasses RLS. Use only server-side."""
    global _service_client
    if _service_client is None:
        _service_client = create_client(settings.supabase_url, settings.supabase_service_key)
    return _service_client
