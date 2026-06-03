from django.db import models
from django.contrib.auth.hashers import make_password, check_password


class SubscriptionPlan(models.Model):
    """Maps to subscription_plans table."""
    name = models.CharField(max_length=30)
    price_monthly = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)  # ← price_monthly
    max_devices = models.SmallIntegerField(default=1)                                  # ← max_devices (no max_screens)
    max_quality = models.CharField(max_length=10, default='SD')
    has_downloads = models.BooleanField(default=False)                                 # ← has_downloads (no offline_downloads)
    has_ads = models.BooleanField(default=True)
    ai_priority = models.SmallIntegerField(default=1)                                  # ← columna nueva
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'subscription_plans'

    def __str__(self):
        return self.name

    @property
    def price(self):
        """Alias para compatibilidad con serializers que usan 'price'."""
        return self.price_monthly


class User(models.Model):
    """
    Maps to users table.
    NOT extending AbstractBaseUser — auth is 100% manual JWT.
    Password hashing via make_password / check_password.
    """
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(max_length=255, unique=True)
    password_hash = models.CharField(max_length=255)
    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    country = models.CharField(max_length=60, blank=True, null=True)
    language = models.CharField(max_length=10, default='es')
    birth_date = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=1, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'users'

    def __str__(self):
        return self.username

    def set_password(self, raw_password):
        self.password_hash = make_password(raw_password)

    def verify_password(self, raw_password):
        return check_password(raw_password, self.password_hash)

    @property
    def is_authenticated(self):
        return True


class UserSubscription(models.Model):
    """Maps to user_subscriptions table."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE, db_column='plan_id')
    status = models.CharField(max_length=20, default='active')
    started_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    cancelled_at = models.DateTimeField(blank=True, null=True)
    auto_renew = models.BooleanField(default=True)
    payment_ref = models.CharField(max_length=200, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'user_subscriptions'

    def __str__(self):
        return f"{self.user.username} - {self.plan.name} ({self.status})"


class PasswordResetToken(models.Model):
    """Maps to password_reset_tokens table."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    token = models.CharField(max_length=255, unique=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'password_reset_tokens'
