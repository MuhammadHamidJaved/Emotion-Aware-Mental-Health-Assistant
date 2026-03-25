"""Shared helpers for external service error mapping and structured logging."""

import logging
from dataclasses import dataclass

import requests


@dataclass
class ExternalServiceErrorInfo:
    service_name: str
    operation: str
    error_type: str
    status_code: int
    user_message: str
    detail: str


DEFAULT_TIMEOUT_MESSAGE = "Service request timed out. Please try again."
DEFAULT_CONNECTION_MESSAGE = "Service is not available right now."
DEFAULT_REQUEST_MESSAGE = "Service request failed."
DEFAULT_UNEXPECTED_MESSAGE = "Unexpected service error occurred."


def map_external_exception(
    exc: Exception,
    service_name: str,
    operation: str,
    timeout_message: str = DEFAULT_TIMEOUT_MESSAGE,
    connection_message: str = DEFAULT_CONNECTION_MESSAGE,
    request_message: str = DEFAULT_REQUEST_MESSAGE,
    unexpected_message: str = DEFAULT_UNEXPECTED_MESSAGE,
) -> ExternalServiceErrorInfo:
    """Map exceptions from external calls into a uniform error contract."""
    if isinstance(exc, requests.exceptions.Timeout):
        return ExternalServiceErrorInfo(
            service_name=service_name,
            operation=operation,
            error_type='timeout',
            status_code=504,
            user_message=timeout_message,
            detail=str(exc),
        )

    if isinstance(exc, requests.exceptions.ConnectionError):
        return ExternalServiceErrorInfo(
            service_name=service_name,
            operation=operation,
            error_type='connection_error',
            status_code=503,
            user_message=connection_message,
            detail=str(exc),
        )

    if isinstance(exc, requests.exceptions.RequestException):
        return ExternalServiceErrorInfo(
            service_name=service_name,
            operation=operation,
            error_type='request_error',
            status_code=502,
            user_message=request_message,
            detail=str(exc),
        )

    return ExternalServiceErrorInfo(
        service_name=service_name,
        operation=operation,
        error_type='unexpected_error',
        status_code=500,
        user_message=unexpected_message,
        detail=str(exc),
    )


def log_external_failure(logger: logging.Logger, error_info: ExternalServiceErrorInfo, level: str = 'error'):
    """Emit a structured failure log with consistent fields."""
    log_method = getattr(logger, level, logger.error)
    log_method(
        "external_service_call_failed service=%s operation=%s error_type=%s detail=%s",
        error_info.service_name,
        error_info.operation,
        error_info.error_type,
        error_info.detail,
    )
