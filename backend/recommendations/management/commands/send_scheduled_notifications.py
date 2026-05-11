"""Run scheduled notification jobs. Intended for cron or CI."""

from django.core.management.base import BaseCommand

from recommendations.scheduled_notifications import (
    run_all_scheduled,
    run_mood_insights,
    run_session_reminders,
    run_weekly_reports,
)


class Command(BaseCommand):
    help = (
        'Send scheduled notifications (session reminders, mood insights, weekly reports). '
        'Example cron (daily): 0 9 * * * cd backend && python manage.py send_scheduled_notifications'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--only',
            choices=('all', 'reminders', 'insights', 'weekly'),
            default='all',
            help='Which job to run (default: all).',
        )

    def handle(self, *args, **options):
        only = options['only']
        if only == 'reminders':
            n = run_session_reminders()
            self.stdout.write(self.style.SUCCESS(f'session_reminders: {n}'))
        elif only == 'insights':
            n = run_mood_insights()
            self.stdout.write(self.style.SUCCESS(f'mood_insights: {n}'))
        elif only == 'weekly':
            n = run_weekly_reports()
            self.stdout.write(self.style.SUCCESS(f'weekly_reports: {n}'))
        else:
            stats = run_all_scheduled()
            self.stdout.write(self.style.SUCCESS(str(stats)))
