"""Shared response helpers for recommendations views."""

from rest_framework.response import Response


def api_response(payload, status_code: int):
    return Response(payload, status=status_code)


def ok_response(payload):
    return api_response(payload, 200)


def error_response(message: str, status_code: int, **extra):
    payload = {'error': message}
    payload.update(extra)
    return Response(payload, status=status_code)
