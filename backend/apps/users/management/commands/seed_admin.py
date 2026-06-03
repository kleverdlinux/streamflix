"""
Management command to create an admin user for testing.
"""
from django.core.management.base import BaseCommand
from apps.users.models import User, UserSubscription


class Command(BaseCommand):
    help = 'Create an admin user: admin@streamflix.com / Admin1234'

    def handle(self, *args, **options):
        email = 'admin@streamflix.com'

        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f'Admin user already exists: {email}'))
            return

        user = User(
            username='admin',
            email=email,
            is_admin=True,
            is_active=True,
            country='Peru',
            language='es',
        )
        user.set_password('Admin1234')
        user.save()

        # Create subscription (Premium plan, id=4)
        UserSubscription.objects.create(
            user=user,
            plan_id=4,
            status='active',
        )

        self.stdout.write(self.style.SUCCESS(
            f'Admin user created: {email} / Admin1234'
        ))
