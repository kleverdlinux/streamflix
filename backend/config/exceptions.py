from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import traceback


def custom_exception_handler(exc, context):
    """Wrap all DRF exceptions in the standard {success, data, message, errors} format."""
    # Log all exceptions for debugging
    print(f"\n[EXCEPTION HANDLER] {type(exc).__name__}: {exc}")
    traceback.print_exc()

    response = exception_handler(exc, context)

    if response is not None:
        errors = response.data if isinstance(response.data, dict) else {'detail': response.data}
        message = errors.pop('detail', str(exc)) if 'detail' in errors else str(exc)
        if isinstance(message, list):
            message = message[0] if message else str(exc)

        response.data = {
            'success': False,
            'data': None,
            'message': str(message),
            'errors': errors if errors else None,
        }
        return response

    # Unhandled exceptions
    traceback.print_exc()
    return Response({
        'success': False,
        'data': None,
        'message': 'Error interno del servidor.',
        'errors': None,
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

