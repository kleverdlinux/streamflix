"""
Decorator for automatic admin action logging.
"""
import functools
from apps.admin_panel.models import AdminLog


def log_admin_action(action_name):
    """
    Decorator that logs admin actions to admin_logs table.
    Usage: @log_admin_action('movie.create')
    """
    def decorator(view_func):
        @functools.wraps(view_func)
        def wrapper(request, *args, **kwargs):
            response = view_func(request, *args, **kwargs)

            # Only log on successful operations
            if response.status_code < 400:
                ip = _get_client_ip(request)
                detail = {}

                if hasattr(response, 'data') and isinstance(response.data, dict):
                    resp_data = response.data.get('data')
                    if isinstance(resp_data, dict):
                        detail = {
                            'target_id': resp_data.get('id'),
                        }

                target_id = kwargs.get('pk') or kwargs.get('user_id')

                AdminLog.objects.create(
                    admin=request.user,
                    action=action_name,
                    target_type=action_name.split('.')[0] if '.' in action_name else None,
                    target_id=target_id,
                    detail=detail,
                    ip_address=ip,
                )

            return response
        return wrapper
    return decorator


def _get_client_ip(request):
    """Extract client IP from request."""
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')
