"""
Views for chat API endpoints
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .models import AIChatMessage
from .serializers import ChatMessageSerializer, ChatMessageCreateSerializer, ChatResponseSerializer
from .rag_service import get_bot_instance
import traceback
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request):
    """
    Send a message to the AI companion and get a response
    POST /api/chat/send/
    """
    print("\n" + "="*80)
    print("🤖 RAG CHATBOT - New Message Received")
    print("="*80)
    
    serializer = ChatMessageCreateSerializer(data=request.data)
    
    if not serializer.is_valid():
        print("❌ Invalid request data:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    user_message = serializer.validated_data['message']
    entry_reference_id = serializer.validated_data.get('entry_reference')
    emotion_context = serializer.validated_data.get('emotion_context', {})
    
    print(f"👤 User: {request.user.email}")
    print(f"💬 Message: {user_message}")
    print(f"😊 Emotion Context: {emotion_context}")
    print("-" * 80)
    
    try:
        # Save user message to database
        user_chat_message = AIChatMessage.objects.create(
            user=request.user,
            sender='user',
            message=user_message,
            entry_reference_id=entry_reference_id,
            emotion_context=emotion_context
        )
        print("✅ User message saved to database")
        
        # Get bot instance and generate response
        print("🔄 Initializing RAG bot instance...")
        bot = get_bot_instance()
        print("🔍 Generating RAG response...")
        bot_response = bot.get_response(user_message)
        print(f"✅ RAG response generated: {bot_response.get('answer', '')[:100]}...")
        
        # Save AI response to database
        ai_chat_message = AIChatMessage.objects.create(
            user=request.user,
            sender='ai',
            message=bot_response.get('answer', ''),
            entry_reference_id=entry_reference_id,
            emotion_context={
                **emotion_context,
                'sources': bot_response.get('sources', []),
                'error': bot_response.get('error')
            }
        )
        print("✅ AI response saved to database")
        
        # Return response
        response_serializer = ChatResponseSerializer({
            'message': bot_response.get('answer', ''),
            'sources': bot_response.get('sources', []),
            'error': bot_response.get('error')
        })
        
        print("✅ Response sent to frontend")
        print("="*80 + "\n")
        
        return Response({
            'user_message': ChatMessageSerializer(user_chat_message).data,
            'ai_response': ChatMessageSerializer(ai_chat_message).data,
            'response': response_serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        error_message = str(e)
        print(f"\n❌ ERROR in RAG chatbot:")
        print(f"Error: {error_message}")
        traceback.print_exc()
        print("="*80 + "\n")
        
        # Try to save error message
        try:
            AIChatMessage.objects.create(
                user=request.user,
                sender='user',
                message=user_message,
                entry_reference_id=entry_reference_id,
                emotion_context=emotion_context
            )
            
            AIChatMessage.objects.create(
                user=request.user,
                sender='ai',
                message=f"I'm sorry, I encountered an error: {error_message}",
                entry_reference_id=entry_reference_id,
                emotion_context={'error': error_message}
            )
        except:
            pass
        
        # Return error in format expected by frontend
        error_detail = error_message
        if "quota" in error_message.lower() or "429" in error_message:
            error_detail = "API quota exceeded. Please try again later or check your API plan."
        elif "model" in error_message.lower() or "invalid" in error_message.lower():
            error_detail = f"Model configuration error: {error_message}"
        
        return Response({
            'error': error_detail,
            'message': "I'm sorry, I encountered an error processing your message. Please try again.",
            'detail': error_message  # Include full error for debugging
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chat_history(request):
    """
    Get chat history for the authenticated user
    GET /api/chat/history/?limit=50
    """
    limit = int(request.query_params.get('limit', 50))
    
    messages = AIChatMessage.objects.filter(user=request.user).order_by('-created_at')[:limit]
    
    # Reverse to show oldest first
    messages = list(reversed(messages))
    
    serializer = ChatMessageSerializer(messages, many=True)
    return Response({
        'messages': serializer.data,
        'count': len(serializer.data)
    }, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_chat_history(request):
    """
    Clear chat history for the authenticated user
    DELETE /api/chat/clear/
    """
    deleted_count, _ = AIChatMessage.objects.filter(user=request.user).delete()
    
    return Response({
        'message': 'Chat history cleared successfully',
        'deleted_count': deleted_count
    }, status=status.HTTP_200_OK)
