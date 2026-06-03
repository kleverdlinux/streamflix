from django.db import models


class ModelMetrics(models.Model):
    """Maps to model_metrics table."""
    version = models.CharField(max_length=20)
    rmse = models.DecimalField(max_digits=8, decimal_places=6, blank=True, null=True)
    mae = models.DecimalField(max_digits=8, decimal_places=6, blank=True, null=True)
    rmse_cv = models.DecimalField(max_digits=8, decimal_places=6, blank=True, null=True)
    # ← NO mae_cv (no existe en el schema real)
    precision_at_5 = models.DecimalField(max_digits=8, decimal_places=6, blank=True, null=True)
    precision_at_10 = models.DecimalField(max_digits=8, decimal_places=6, blank=True, null=True)
    recall_at_5 = models.DecimalField(max_digits=8, decimal_places=6, blank=True, null=True)
    # ← NO recall_at_10 (no existe en el schema real)
    ndcg_at_5 = models.DecimalField(max_digits=8, decimal_places=6, blank=True, null=True)
    ndcg_at_10 = models.DecimalField(max_digits=8, decimal_places=6, blank=True, null=True)
    f1_dt = models.DecimalField(max_digits=8, decimal_places=6, blank=True, null=True)
    improvement_pct = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    n_users = models.IntegerField(blank=True, null=True)
    n_movies = models.IntegerField(blank=True, null=True)
    n_ratings = models.IntegerField(blank=True, null=True)
    trained_at = models.DateTimeField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    # ← NO backend, NO numpy_version, NO created_at (no existen en el schema)

    class Meta:
        managed = False
        db_table = 'model_metrics'


class AdminLog(models.Model):
    """Maps to admin_logs table."""
    admin = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='admin_id')
    action = models.CharField(max_length=100)
    target_type = models.CharField(max_length=50, blank=True, null=True)
    target_id = models.IntegerField(blank=True, null=True)
    detail = models.JSONField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'admin_logs'
        ordering = ['-created_at']
