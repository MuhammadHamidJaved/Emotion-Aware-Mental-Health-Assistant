# AES-256 Encryption Setup

## Overview
The Settings page now uses AES-256-GCM encryption for sensitive user data including:
- Bio
- Phone number
- Notification preferences
- Privacy settings
- Appearance settings

## Setup Instructions

### 1. Set Encryption Key
You MUST set the `ENCRYPTION_KEY` environment variable in production. For development, a default key is used (NOT SECURE).

**Production (Required):**
```bash
export ENCRYPTION_KEY="your-32-byte-encryption-key-here!!!!!!!!"
```

**Generate a secure key:**
```python
import secrets
key = secrets.token_bytes(32)
print(key.hex())
```

### 2. Install Dependencies
The encryption uses `cryptography` package. Install it if not already:
```bash
cd backend
pip install cryptography
```

### 3. Run Migrations
After adding the new models and fields:
```bash
cd backend
python manage.py makemigrations users
python manage.py migrate
```

## Files Created/Modified

### Backend:
- `backend/users/encryption.py` - AES-256-GCM encryption service
- `backend/users/settings_models.py` - UserPreferences model for encrypted settings
- `backend/users/settings_views.py` - Settings API endpoints with encryption
- `backend/users/models.py` - Updated User model with encrypted fields
- `backend/users/urls.py` - Added settings routes
- `backend/users/admin.py` - Admin registration for models

### Frontend:
- `frontend/src/lib/api.ts` - Added settings API functions
- `frontend/src/app/settings/page.tsx` - Will be updated to use backend

## API Endpoints

All endpoints require authentication (`Bearer <token>`):

- `GET /api/settings/profile/` - Get profile settings (decrypted)
- `PATCH /api/settings/profile/` - Update profile (encrypted on save)
- `GET /api/settings/notifications/` - Get notification settings
- `PATCH /api/settings/notifications/` - Update notification settings
- `GET /api/settings/privacy/` - Get privacy settings
- `PATCH /api/settings/privacy/` - Update privacy settings
- `GET /api/settings/appearance/` - Get appearance settings
- `PATCH /api/settings/appearance/` - Update appearance settings
- `POST /api/settings/export-data/` - Request data export
- `POST /api/settings/delete-account/` - Request account deletion

## Security Notes

1. **Encryption Key**: Must be 32 bytes. Never commit to version control.
2. **PBKDF2**: Uses 100,000 iterations for key derivation
3. **AES-GCM**: Provides authenticated encryption (prevents tampering)
4. **Salt**: Each encryption uses a unique salt for security
5. **Backward Compatibility**: Old plain text fields are kept temporarily

## Testing

1. Start backend server
2. Set encryption key (or use default for dev)
3. Run migrations
4. Test profile update through API
5. Verify data is encrypted in database
6. Verify data is decrypted when retrieved




