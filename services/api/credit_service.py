"""
Credit Service - Centralized credit operations

This module provides reusable functions for credit management including:
- Credit deduction (reservation at job creation)
- Credit refund (on job failure)
- Credit validation
"""

import json

from sqlalchemy.orm import Session

from database import Credit, Job, JobEvent, JobStatus


def get_or_create_credit(db: Session, user_id: str) -> Credit:
    """Get user's credit record, creating one with 0 balance if none exists"""
    credit = db.query(Credit).filter(Credit.user_id == user_id).first()
    if not credit:
        credit = Credit(user_id=user_id, balance=0)
        db.add(credit)
        db.flush()
    return credit


def validate_credits(db: Session, user_id: str, required: int) -> tuple[bool, Credit]:
    """
    Check if user has sufficient credits.

    Returns:
        (has_sufficient, credit_record)
    """
    credit = get_or_create_credit(db, user_id)
    return credit.balance >= required, credit


def deduct_credits(db: Session, user_id: str, amount: int) -> Credit:
    """
    Deduct credits from user's balance.
    Should be called at job creation as a reservation.

    Raises:
        ValueError if insufficient credits
    """
    credit = get_or_create_credit(db, user_id)
    if credit.balance < amount:
        raise ValueError(
            f"Insufficient credits. Required: {amount}, Available: {credit.balance}"
        )

    credit.balance -= amount
    db.flush()
    return credit


def refund_credits(
    db: Session, user_id: str, amount: int, job_id: str = None
) -> Credit:
    """
    Refund credits to user's balance.
    Should be called when a job fails.

    Args:
        db: Database session
        user_id: User ID to refund
        amount: Number of credits to refund
        job_id: Optional job ID for audit trail

    Returns:
        Updated credit record
    """
    credit = get_or_create_credit(db, user_id)
    credit.balance += amount
    db.flush()

    # Add audit event if job_id provided
    if job_id:
        event = JobEvent(
            job_id=job_id,
            event_type="credits_refunded",
            details=json.dumps(
                {
                    "credits_refunded": amount,
                    "new_balance": credit.balance,
                    "reason": "job_failed",
                }
            ),
        )
        db.add(event)
        db.flush()

    return credit


def refund_job(db: Session, job: Job) -> tuple[bool, str]:
    """
    Refund credits for a failed job if not already refunded.

    Args:
        db: Database session
        job: Job to refund

    Returns:
        (success, message)
    """
    # Check if job is in a refundable state
    if job.status != JobStatus.failed:
        return False, f"Job is not in failed state (current: {job.status.value})"

    # Check if already refunded by looking at job events
    existing_refund = (
        db.query(JobEvent)
        .filter(JobEvent.job_id == job.id, JobEvent.event_type == "credits_refunded")
        .first()
    )
    if existing_refund:
        return False, "Credits already refunded for this job"

    # Check if there are credits to refund
    if not job.credits_used or job.credits_used <= 0:
        return False, "No credits to refund"

    # Perform refund
    credit = refund_credits(db, job.user_id, job.credits_used, job.id)
    db.commit()

    return True, f"Refunded {job.credits_used} credits (new balance: {credit.balance})"
