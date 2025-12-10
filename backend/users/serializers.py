from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from rest_framework import serializers

from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "profile_picture",
            "date_of_birth",
            "bio",
            "phone_number",
            "mental_health_concerns",
            "journaling_goals",
            "preferred_journal_time",
            "enable_biometric",
            "enable_notifications",
            "onboarding_complete",
            "total_entries",
            "current_streak",
            "longest_streak",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "total_entries",
            "current_streak",
            "longest_streak",
            "created_at",
            "updated_at",
        ]


class RegisterSerializer(serializers.ModelSerializer):
    """
    Handles user registration. We treat email as the primary identifier
    and mirror it into the username field for compatibility with Django auth.
    """

    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "email",
            "password",
            "confirm_password",
        ]

    def validate_email(self, value: str) -> str:
        value = value.lower().strip()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data.pop("confirm_password", None)

        email = validated_data["email"].lower().strip()

        user = User(
            username=email,  # use email as username internally
            email=email,
            first_name=validated_data.get("first_name", "").strip(),
            last_name=validated_data.get("last_name", "").strip(),
        )
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """
    Email + password login. Internally we authenticate using the username
    that mirrors the email.
    """

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email", "").lower().strip()
        password = attrs.get("password")

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            raise serializers.ValidationError("Invalid email or password.")

        user = authenticate(username=user.username, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password.")

        if not user.is_active:
            raise serializers.ValidationError("This account is disabled.")

        attrs["user"] = user
        return attrs


class TokenResponseSerializer(serializers.Serializer):
    """
    Helper serializer to document the token response structure.
    Not used for input, only to shape output.
    """

    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()


def get_tokens_for_user(user: User) -> dict:
    """
    Generate a Simple JWT token pair for a user.
    """

    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


class OnboardingSerializer(serializers.Serializer):
    """
    Serializer for onboarding data
    Handles storage preference and feature permissions
    """
    storage = serializers.ChoiceField(
        choices=['cloud', 'local', 'hybrid'],
        required=True,
        help_text='Storage preference: cloud, local, or hybrid'
    )
    permissions = serializers.DictField(
        required=True,
        help_text='Dictionary of feature permissions (e.g., {"emotion-detection": true, "voice": false})'
    )
    
    def validate_storage(self, value):
        """Validate storage choice"""
        if value not in ['cloud', 'local', 'hybrid']:
            raise serializers.ValidationError("Storage must be 'cloud', 'local', or 'hybrid'")
        return value
    
    def validate_permissions(self, value):
        """Validate permissions dictionary"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Permissions must be a dictionary")
        
        # Expected permission keys
        valid_keys = [
            'storage', 'emotion-detection', 'voice', 'video', 
            'location', 'notifications', 'biometric'
        ]
        
        # Check if all values are boolean
        for key, val in value.items():
            if not isinstance(val, bool):
                raise serializers.ValidationError(f"Permission '{key}' must be a boolean value")
        
        return value


