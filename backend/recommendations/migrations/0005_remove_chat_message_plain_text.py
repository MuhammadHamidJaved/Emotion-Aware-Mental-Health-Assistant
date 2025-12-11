# Generated manually to remove plain text message field

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('recommendations', '0004_add_encrypted_fields_to_recommendations'),
    ]

    operations = [
        # Make message nullable first (to avoid constraint issues)
        migrations.RunSQL(
            sql='ALTER TABLE ai_chat_messages ALTER COLUMN message DROP NOT NULL;',
            reverse_sql='ALTER TABLE ai_chat_messages ALTER COLUMN message SET NOT NULL;',
        ),
        # Make emotion_context nullable
        migrations.RunSQL(
            sql='ALTER TABLE ai_chat_messages ALTER COLUMN emotion_context DROP NOT NULL;',
            reverse_sql='ALTER TABLE ai_chat_messages ALTER COLUMN emotion_context SET NOT NULL;',
        ),
        # Drop the plain text columns
        migrations.RunSQL(
            sql='ALTER TABLE ai_chat_messages DROP COLUMN IF EXISTS message;',
            reverse_sql='ALTER TABLE ai_chat_messages ADD COLUMN message TEXT;',
        ),
        migrations.RunSQL(
            sql='ALTER TABLE ai_chat_messages DROP COLUMN IF EXISTS emotion_context;',
            reverse_sql='ALTER TABLE ai_chat_messages ADD COLUMN emotion_context TEXT;',
        ),
    ]
