"""Shared response helpers for assistant views."""

from rest_framework.response import Response


def api_response(payload, status_code: int):
    return Response(payload, status=status_code)


def ok_response(payload):
    return api_response(payload, 200)


def created_response(payload):
    return api_response(payload, 201)


def no_content_response():
    return Response(status=204)


def error_response(message: str, status_code: int, **extra):
    payload = {'error': message}
    payload.update(extra)
    return Response(payload, status=status_code)
