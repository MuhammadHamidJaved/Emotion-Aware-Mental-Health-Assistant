"""
Quick script to manually set emotions for journal entries
Run this in Django shell: python manage.py shell < set_emotions.py
Or copy-paste into Django shell
"""

from journal.models import JournalEntry
from django.utils import timezone
from datetime import timedelta
import random

# Available emotions
EMOTIONS = ['happy', 'sad', 'anxious', 'calm', 'excited', 'angry', 'grateful', 'confident', 
            'frustrated', 'neutral', 'tired', 'loved', 'energetic', 'peaceful']

# Get all entries without emotions
entries = JournalEntry.objects.filter(emotion__isnull=True) | JournalEntry.objects.filter(emotion='')

print(f"Found {entries.count()} entries without emotions")

# Set random emotions for demo (or you can set specific ones)
for entry in entries[:10]:  # Limit to first 10
    # You can set specific emotion based on entry content or random
    emotion = random.choice(EMOTIONS)
    entry.emotion = emotion
    entry.emotion_confidence = round(random.uniform(0.7, 0.95), 2)  # Random confidence 0.7-0.95
    entry.save()
    print(f"Entry {entry.id}: Set emotion to '{emotion}' with confidence {entry.emotion_confidence}")

print(f"\nUpdated {entries.count()} entries with emotions!")

# Example: Set specific emotions manually
# entry = JournalEntry.objects.get(id=1)
# entry.emotion = 'happy'
# entry.emotion_confidence = 0.92
# entry.save()




