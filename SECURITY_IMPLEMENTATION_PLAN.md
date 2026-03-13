# Security Implementation Plan

This document outlines the security features that need to be implemented to enhance the security posture of the Emotion Journal System, especially for production deployment.

---

## 🔴 Critical Priority (Must Implement Before Production)

### 1. Environment-Based Configuration
**Current Issue:** Secret key and sensitive settings are hardcoded in `settings.py`

**Implementation:**
- Move `SECRET_KEY` to environment variable
- Use `python-decouple` or `os.environ` for all sensitive configs
- Create `.env.example` template (without actual secrets)
- Add `.env` to `.gitignore`

**Files to Modify:**
- `backend/config/settings.py`
- `backend/.env` (create)
- `backend/.gitignore`

**Example:**
```python
SECRET_KEY = config('SECRET_KEY', default='')
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is required")
```

---

### 2. Production Debug Mode Disable
**Current Issue:** `DEBUG = True` exposes sensitive error information

**Implementation:**
- Set `DEBUG = config('DEBUG', default=False, cast=bool)`
- Ensure DEBUG is False in production
- Configure proper error handling for production

**Files to Modify:**
- `backend/config/settings.py`

---

### 3. Configure ALLOWED_HOSTS
**Current Issue:** `ALLOWED_HOSTS = []` allows any host header attack

**Implementation:**
- Set `ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')`
- Add production domain(s) to environment variable
- Include localhost for development

**Files to Modify:**
- `backend/config/settings.py`

**Example:**
```python
ALLOWED_HOSTS = [
    'yourdomain.com',
    'www.yourdomain.com',
    'api.yourdomain.com',
    'localhost',
    '127.0.0.1',
]
```

---

### 4. HTTPS Enforcement
**Current Issue:** No HTTPS requirement configured

**Implementation:**
- Add security middleware settings
- Force HTTPS redirects in production
- Configure SSL/TLS certificates
- Add HSTS (HTTP Strict Transport Security) headers

**Files to Modify:**
- `backend/config/settings.py`

**Example:**
```python
# Security Settings
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
```

---

### 5. Rate Limiting / Throttling
**Current Issue:** No protection against brute force attacks

**Implementation:**
- Install `django-ratelimit` or use DRF throttling
- Add rate limits to login/registration endpoints
- Configure different limits for authenticated vs anonymous users
- Add IP-based rate limiting

**Files to Modify:**
- `backend/config/settings.py`
- `backend/users/views.py`
- `backend/requirements.txt`

**Example:**
```python
# In settings.py
REST_FRAMEWORK = {
    # ... existing settings ...
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '5/minute',  # 5 requests per minute for anonymous
        'user': '100/minute'  # 100 requests per minute for authenticated
    }
}

# In views.py
from rest_framework.throttling import AnonRateThrottle

class LoginView(APIView):
    throttle_classes = [AnonRateThrottle]  # Limit login attempts
```

---

## 🟡 High Priority (Important for Production)

### 6. Security Headers Configuration
**Current Issue:** Missing important security headers

**Implementation:**
- Add Content Security Policy (CSP)
- Configure X-Content-Type-Options
- Add Referrer-Policy
- Configure Permissions-Policy

**Files to Modify:**
- `backend/config/settings.py`
- Consider using `django-csp` package

**Example:**
```python
# Add to settings.py
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_CONTENT_TYPE_OPTIONS = 'nosniff'
REFERRER_POLICY = 'strict-origin-when-cross-origin'

# For CSP (requires django-csp)
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'")  # Adjust as needed
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
```

---

### 7. Secure Token Storage (Frontend)
**Current Issue:** Tokens stored in localStorage (vulnerable to XSS)

**Implementation:**
- Consider using httpOnly cookies for token storage
- Implement token refresh mechanism
- Add token expiration handling
- Clear tokens on logout

**Files to Modify:**
- `frontend/src/contexts/auth-context.tsx`
- `frontend/src/lib/api.ts`
- Backend: Configure cookie settings

**Alternative Approach:**
- Keep localStorage but add XSS protection
- Implement Content Security Policy
- Sanitize all user inputs
- Use httpOnly cookies for refresh tokens

---

### 8. Account Lockout Mechanism
**Current Issue:** No protection against brute force login attempts

**Implementation:**
- Track failed login attempts per user/IP
- Lock account after N failed attempts (e.g., 5)
- Implement lockout duration (e.g., 15 minutes)
- Add unlock mechanism (email or time-based)

**Files to Modify:**
- `backend/users/models.py` (add failed_attempts field)
- `backend/users/views.py` (LoginView)
- Create migration

**Example:**
```python
# In models.py
failed_login_attempts = models.IntegerField(default=0)
locked_until = models.DateTimeField(null=True, blank=True)

# In LoginView
if user.locked_until and user.locked_until > timezone.now():
    return Response(
        {"error": "Account temporarily locked. Try again later."},
        status=status.HTTP_423_LOCKED
    )
```

---

### 9. Password Reset Functionality
**Current Issue:** No password reset mechanism

**Implementation:**
- Create password reset endpoint
- Send reset email with secure token
- Token expiration (e.g., 1 hour)
- Password reset confirmation
- Log password reset events

**Files to Create/Modify:**
- `backend/users/views.py` (add PasswordResetView)
- `backend/users/serializers.py` (add PasswordResetSerializer)
- `backend/users/urls.py`
- Email template

---

### 10. API Versioning
**Current Issue:** No API versioning strategy

**Implementation:**
- Add version prefix to URLs (e.g., `/api/v1/`)
- Plan for future API changes
- Maintain backward compatibility

**Files to Modify:**
- `backend/config/urls.py`
- All app `urls.py` files

---

### 11. Input Sanitization Enhancement
**Current Issue:** Basic validation exists but could be enhanced

**Implementation:**
- Add HTML sanitization for user inputs
- Validate file uploads (type, size, content)
- Implement SQL injection prevention (Django ORM helps, but review)
- Add XSS protection for stored content

**Files to Modify:**
- `backend/journal/serializers.py`
- `backend/users/serializers.py`
- Consider using `bleach` for HTML sanitization

---

### 12. Logging and Monitoring
**Current Issue:** Limited security event logging

**Implementation:**
- Log all authentication attempts (success/failure)
- Log sensitive operations (password changes, data exports)
- Log access to encrypted data
- Implement security event alerts
- Store logs securely (separate from application)

**Files to Modify:**
- `backend/users/views.py`
- `backend/journal/views.py`
- Create logging configuration

**Example:**
```python
import logging

security_logger = logging.getLogger('security')

# Log failed login
security_logger.warning(
    f"Failed login attempt for email: {email}, IP: {request.META.get('REMOTE_ADDR')}"
)
```

---

## 🟢 Medium Priority (Nice to Have)

### 13. Two-Factor Authentication (2FA)
**Implementation:**
- Add TOTP (Time-based One-Time Password) support
- Use libraries like `django-otp` or `pyotp`
- QR code generation for authenticator apps
- Backup codes for account recovery

**Files to Create/Modify:**
- New app: `backend/authentication/`
- `backend/users/models.py` (add 2FA fields)
- `backend/users/views.py`

---

### 14. Enhanced Audit Logging
**Implementation:**
- Track all data access (who, what, when)
- Log encryption/decryption operations
- Track permission changes
- Maintain audit trail for compliance

**Files to Create:**
- `backend/audit/models.py`
- `backend/audit/middleware.py`

---

### 15. Data Backup Encryption
**Implementation:**
- Verify Cloudinary encryption at rest
- Encrypt database backups
- Secure backup storage location
- Test backup restoration process

---

### 16. Session Management Enhancement
**Implementation:**
- Implement session timeout
- Add "Remember Me" functionality
- Track active sessions
- Allow users to revoke sessions

---

### 17. Email Verification
**Implementation:**
- Verify email addresses on registration
- Send verification link
- Prevent unverified accounts from accessing features
- Resend verification email option

**Files to Modify:**
- `backend/users/models.py` (add email_verified field)
- `backend/users/views.py` (RegisterView)
- Email template

---

### 18. IP Whitelisting/Blacklisting
**Implementation:**
- Optional IP whitelist for admin access
- IP blacklist for known attackers
- Geographic restrictions (if needed)
- Track suspicious IP addresses

---

### 19. Data Export Security
**Implementation:**
- Secure data export endpoint
- Encrypt exported files
- Add password protection for exports
- Time-limited download links
- Log all export requests

---

### 20. Privacy Controls Enhancement
**Implementation:**
- Data retention policies
- Right to deletion (GDPR compliance)
- Data portability
- Consent management
- Privacy policy acceptance tracking

---

## 📋 Implementation Checklist

### Phase 1: Critical (Before Production)
- [ ] Move SECRET_KEY to environment variable
- [ ] Disable DEBUG in production
- [ ] Configure ALLOWED_HOSTS
- [ ] Implement HTTPS enforcement
- [ ] Add rate limiting/throttling

### Phase 2: High Priority (Production Hardening)
- [ ] Configure security headers
- [ ] Improve token storage security
- [ ] Implement account lockout
- [ ] Add password reset functionality
- [ ] Implement API versioning
- [ ] Enhance input sanitization
- [ ] Improve logging and monitoring

### Phase 3: Medium Priority (Future Enhancements)
- [ ] Two-factor authentication
- [ ] Enhanced audit logging
- [ ] Data backup encryption verification
- [ ] Session management enhancement
- [ ] Email verification
- [ ] IP whitelisting/blacklisting
- [ ] Data export security
- [ ] Privacy controls enhancement

---

## 🔧 Recommended Packages

Add these to `backend/requirements.txt`:

```txt
# Security
django-ratelimit==4.1.0          # Rate limiting
django-csp==3.8                  # Content Security Policy
bleach==6.1.0                    # HTML sanitization
django-otp==1.2.7                # 2FA support (optional)
django-auditlog==3.0.0           # Audit logging (optional)
```

---

## 📚 Additional Resources

- [Django Security Best Practices](https://docs.djangoproject.com/en/5.1/topics/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/)
- [JWT Security Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

## ⚠️ Security Testing

Before deploying to production, ensure:

1. **Penetration Testing:** Conduct security audit
2. **Vulnerability Scanning:** Use tools like OWASP ZAP
3. **Code Review:** Security-focused code review
4. **Dependency Scanning:** Check for vulnerable packages (`pip-audit`)
5. **SSL/TLS Testing:** Verify certificate configuration
6. **Load Testing:** Ensure rate limiting works under load

---

## 📝 Notes

- Prioritize Critical items before any production deployment
- High Priority items should be implemented within first month of production
- Medium Priority items can be planned for future releases
- Regular security audits should be conducted quarterly
- Keep dependencies updated (`pip list --outdated`)
- Monitor security advisories for Django and related packages

---

**Last Updated:** 2026-01-26  
**Next Review:** Quarterly

