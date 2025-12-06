from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
import cloudinary.uploader

from .serializers import (
    LoginSerializer,
    RegisterSerializer,
    UserSerializer,
    get_tokens_for_user,
)


class RegisterView(APIView):
    """
    POST /api/auth/register/

    Creates a new user account and returns JWT tokens + basic user data.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        tokens = get_tokens_for_user(user)

        return Response(
            {
                "message": "Account created successfully.",
                "access": tokens["access"],
                "refresh": tokens["refresh"],
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """
    POST /api/auth/login/

    Logs in a user with email + password and returns JWT tokens + user data.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data["user"]
        tokens = get_tokens_for_user(user)

        return Response(
            {
                "message": "Login successful.",
                "access": tokens["access"],
                "refresh": tokens["refresh"],
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    """
    GET /api/auth/me/

    Returns the authenticated user's profile.
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)

    def patch(self, request):
        """
        PATCH /api/auth/me/

        Allows the authenticated user to update their own profile.
        Supports multipart form data for profile_picture uploads which are
        uploaded to Cloudinary and stored as a URL on the user model.
        """

        user = request.user

        # Make a mutable copy of incoming data
        data = request.data.copy()

        # Handle optional profile picture upload
        profile_file = request.FILES.get("profile_picture")
        if profile_file:
            try:
                upload_result = cloudinary.uploader.upload(
                    profile_file,
                    folder="emotion-journal/profile_pictures",
                    resource_type="image",
                )
                data["profile_picture"] = upload_result.get("secure_url")
            except Exception as e:  # pragma: no cover - safety net
                return Response(
                    {"detail": f"Failed to upload profile picture: {e}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Normalize JSON-like fields coming from simple text inputs
        concerns = data.get("mental_health_concerns")
        if isinstance(concerns, str):
            items = [s.strip() for s in concerns.split(",") if s.strip()]
            data["mental_health_concerns"] = items

        goals = data.get("journaling_goals")
        if isinstance(goals, str):
            items = [s.strip() for s in goals.split(",") if s.strip()]
            data["journaling_goals"] = items

        serializer = UserSerializer(user, data=data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
