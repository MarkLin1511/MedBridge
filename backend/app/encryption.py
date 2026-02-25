"""
Field-level encryption for PHI using Fernet symmetric encryption.
Uses ENCRYPTION_KEY env var (must be a valid Fernet key).
Generate one with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
"""
import os
from cryptography.fernet import Fernet

_key = os.environ.get("ENCRYPTION_KEY")


def _get_fernet() -> Fernet | None:
    if _key:
        return Fernet(_key.encode() if isinstance(_key, str) else _key)
    return None


def encrypt_field(value: str) -> str:
    """Encrypt a string field. Returns original if no key configured."""
    f = _get_fernet()
    if f and value:
        return f.encrypt(value.encode()).decode()
    return value


def decrypt_field(value: str) -> str:
    """Decrypt a string field. Returns original if not encrypted or no key."""
    f = _get_fernet()
    if f and value:
        try:
            return f.decrypt(value.encode()).decode()
        except Exception:
            return value  # Not encrypted or wrong key, return as-is
    return value
