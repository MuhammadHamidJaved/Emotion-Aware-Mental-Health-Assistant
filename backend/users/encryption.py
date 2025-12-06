"""
AES-256 encryption utility for sensitive user data
"""
import os
import base64
from django.conf import settings
import json
import logging

logger = logging.getLogger(__name__)

try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.backends import default_backend
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    CRYPTOGRAPHY_AVAILABLE = True
except ImportError:
    CRYPTOGRAPHY_AVAILABLE = False
    logger.warning("cryptography package not installed. Encryption features will not work.")


class EncryptionService:
    """
    AES-256-GCM encryption service for user data
    Uses PBKDF2 key derivation for enhanced security
    """
    
    def __init__(self):
        if not CRYPTOGRAPHY_AVAILABLE:
            raise ImportError(
                "cryptography package is required for encryption. "
                "Install it with: pip install cryptography"
            )
        
        # Get encryption key from environment or settings
        # In production, this should be stored in environment variables
        self.master_key = os.environ.get('ENCRYPTION_KEY', getattr(settings, 'ENCRYPTION_KEY', None))
        
        if not self.master_key:
            # Generate a default key (for development only)
            # In production, you MUST set ENCRYPTION_KEY environment variable
            logger.warning(
                "ENCRYPTION_KEY not set! Using default key for development. "
                "Set ENCRYPTION_KEY environment variable in production."
            )
            self.master_key = b'default_dev_key_32_bytes_long!!!!!'[:32]
        else:
            # Convert string key to bytes if needed
            if isinstance(self.master_key, str):
                self.master_key = self.master_key.encode('utf-8')[:32].ljust(32, b'0')
            elif len(self.master_key) < 32:
                self.master_key = self.master_key.ljust(32, b'0')
            elif len(self.master_key) > 32:
                self.master_key = self.master_key[:32]
        
        # Ensure key is exactly 32 bytes for AES-256
        if len(self.master_key) != 32:
            raise ValueError("Encryption key must be exactly 32 bytes")
    
    def _derive_key(self, salt: bytes = None):
        """
        Derive encryption key from master key using PBKDF2
        Returns (derived_key, salt)
        """
        if salt is None:
            salt = os.urandom(16)  # Generate random salt
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,  # High iteration count for security
            backend=default_backend()
        )
        
        derived_key = kdf.derive(self.master_key)
        return derived_key, salt
    
    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt a string using AES-256-GCM
        Returns base64-encoded string containing: salt + nonce + ciphertext + tag
        """
        if not plaintext:
            return ""
        
        # Convert string to bytes
        if isinstance(plaintext, str):
            plaintext = plaintext.encode('utf-8')
        
        # Derive key with random salt
        key, salt = self._derive_key()
        
        # Generate nonce (12 bytes for GCM)
        nonce = os.urandom(12)
        
        # Encrypt
        aesgcm = AESGCM(key)
        ciphertext = aesgcm.encrypt(nonce, plaintext, None)
        
        # Combine: salt (16) + nonce (12) + ciphertext
        encrypted_data = salt + nonce + ciphertext
        
        # Return as base64 string
        return base64.b64encode(encrypted_data).decode('utf-8')
    
    def decrypt(self, encrypted_data: str) -> str:
        """
        Decrypt a base64-encoded encrypted string
        """
        if not encrypted_data:
            return ""
        
        try:
            # Decode from base64
            encrypted_bytes = base64.b64decode(encrypted_data.encode('utf-8'))
            
            # Extract salt, nonce, and ciphertext
            salt = encrypted_bytes[:16]
            nonce = encrypted_bytes[16:28]
            ciphertext = encrypted_bytes[28:]
            
            # Derive key using the salt
            key, _ = self._derive_key(salt)
            
            # Decrypt
            aesgcm = AESGCM(key)
            plaintext = aesgcm.decrypt(nonce, ciphertext, None)
            
            # Return as string
            return plaintext.decode('utf-8')
        
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            return ""
    
    def encrypt_json(self, data: dict) -> str:
        """
        Encrypt a JSON-serializable object
        """
        if not data:
            return ""
        
        json_str = json.dumps(data, ensure_ascii=False)
        return self.encrypt(json_str)
    
    def decrypt_json(self, encrypted_data: str) -> dict:
        """
        Decrypt and parse JSON
        """
        if not encrypted_data:
            return {}
        
        try:
            json_str = self.decrypt(encrypted_data)
            return json.loads(json_str)
        except Exception as e:
            logger.error(f"JSON decryption failed: {e}")
            return {}


# Singleton instance
_encryption_service = None


def get_encryption_service() -> EncryptionService:
    """
    Get singleton encryption service instance
    """
    global _encryption_service
    if _encryption_service is None:
        _encryption_service = EncryptionService()
    return _encryption_service

