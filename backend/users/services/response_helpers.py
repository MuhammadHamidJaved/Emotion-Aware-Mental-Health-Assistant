"""Shared response helpers for users settings views."""

from rest_framework.response import Response


def api_response(payload, status_code: int):
    return Response(payload, status=status_code)


def ok_response(payload):
    return Response(payload, status=200)


def error_response(message: str, status_code: int = 400, **extra):
    payload = {'error': message}
    payload.update(extra)
    return Response(payload, status=status_code)


def first_error_message(errors) -> str:
    if isinstance(errors, dict):
        first_value = next(iter(errors.values()), 'Invalid request data.')
        if isinstance(first_value, list) and first_value:
            return str(first_value[0])
        return str(first_value)
    if isinstance(errors, list) and errors:
        return str(errors[0])
    return 'Invalid request data.'
