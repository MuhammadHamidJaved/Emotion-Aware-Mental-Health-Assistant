"""Entry orchestration business logic for assistant endpoints."""

import logging

import cloudinary.uploader
from django.utils import timezone

from assistant.models import CheckInEntry, EntryTag, EntryTagRelation

logger = logging.getLogger(__name__)


class EntryService:
    @staticmethod
    def list_entries_for_user(user, entry_type=None, emotion=None):
        entries = CheckInEntry.objects.filter(user=user).order_by('-entry_date')

        if entry_type:
            entries = entries.filter(entry_type=entry_type)

        if emotion:
            entries = entries.filter(emotion=emotion)

        return entries

    @staticmethod
    def get_entry_for_user(user, entry_id):
        try:
            return CheckInEntry.objects.get(id=entry_id, user=user)
        except CheckInEntry.DoesNotExist:
            return None

    @staticmethod
    def create_entry(user, validated_data):
        text_content = validated_data.get('text_content', '') or validated_data.get('transcription', '')
        word_count = len(text_content.split()) if text_content else 0

        emotion = validated_data.get('emotion', '')
        if emotion:
            emotion = emotion.lower().strip()

        entry = CheckInEntry.objects.create(
            user=user,
            entry_type=validated_data['entry_type'],
            emotion=emotion,
            emotion_confidence=validated_data.get('emotion_confidence'),
            word_count=word_count,
            duration=validated_data.get('duration', 0),
            is_favorite=validated_data.get('is_favorite', False),
            is_draft=validated_data.get('is_draft', False),
            entry_date=validated_data.get('entry_date', timezone.now())
        )

        entry.set_title(validated_data.get('title', ''))
        entry.set_text_content(validated_data.get('text_content', ''))
        entry.set_transcription(validated_data.get('transcription', ''))

        media_error = EntryService._handle_media_upload(user, entry, validated_data)
        if media_error:
            return None, media_error

        entry.save()
        EntryService._replace_entry_tags(user, entry, validated_data.get('tags', []), remove_existing=False)

        return entry, None

    @staticmethod
    def update_entry(user, entry, validated_data):
        if 'title' in validated_data:
            entry.set_title(validated_data['title'])
        if 'text_content' in validated_data:
            entry.set_text_content(validated_data['text_content'])
            entry.word_count = len(validated_data['text_content'].split())
        if 'transcription' in validated_data:
            entry.set_transcription(validated_data['transcription'])
        if 'emotion' in validated_data:
            entry.emotion = validated_data['emotion']
        if 'emotion_confidence' in validated_data:
            entry.emotion_confidence = validated_data['emotion_confidence']
        if 'is_favorite' in validated_data:
            entry.is_favorite = validated_data['is_favorite']
        if 'is_draft' in validated_data:
            entry.is_draft = validated_data['is_draft']

        entry.save()

        if 'tags' in validated_data:
            EntryService._replace_entry_tags(user, entry, validated_data['tags'], remove_existing=True)

        return entry

    @staticmethod
    def delete_entry(entry):
        entry.delete()

    @staticmethod
    def _handle_media_upload(user, entry, validated_data):
        voice_file = validated_data.get('voice_file')
        video_file = validated_data.get('video_file')

        try:
            if voice_file and entry.entry_type == 'voice':
                upload_result = cloudinary.uploader.upload(
                    voice_file,
                    resource_type='auto',
                    folder=f'assistant/voice/{user.id}',
                    public_id=f'voice_{entry.id}_{timezone.now().timestamp()}'
                )
                entry.voice_file = upload_result['secure_url']
                logger.info(f"Voice file uploaded to Cloudinary: {upload_result['secure_url']}")

            if video_file and entry.entry_type == 'video':
                upload_result = cloudinary.uploader.upload(
                    video_file,
                    resource_type='video',
                    folder=f'assistant/video/{user.id}',
                    public_id=f'video_{entry.id}_{timezone.now().timestamp()}'
                )
                entry.video_file = upload_result['secure_url']
                logger.info(f"Video file uploaded to Cloudinary: {upload_result['secure_url']}")

            return None

        except Exception as exc:
            logger.error(f"Error uploading media to Cloudinary: {str(exc)}")
            entry.delete()
            return f'Failed to upload media file: {str(exc)}'

    @staticmethod
    def _replace_entry_tags(user, entry, tags, remove_existing=False):
        if remove_existing:
            EntryTagRelation.objects.filter(entry=entry).delete()

        for tag_name in tags:
            if tag_name.strip():
                tag, created = EntryTag.objects.get_or_create(
                    user=user,
                    name=tag_name.strip().lower(),
                    defaults={'color': '#3B82F6'}
                )
                if created:
                    tag.usage_count = 1
                else:
                    tag.usage_count += 1
                tag.save()

                EntryTagRelation.objects.get_or_create(
                    entry=entry,
                    tag=tag
                )
