from apscheduler.schedulers.background import BackgroundScheduler
from datetime import date
from sqlmodel import select, Session
from dependencies.db import get_engine
from models import RecurringPayment
from lib.transfers import process_recurring_payment
import logging

logger = logging.getLogger("uvicorn.error")


def process_recurring_payments():
    logger.info("Scheduler checking recurring payments...")

    with Session(get_engine()) as session:
        payments = session.exec(
            select(RecurringPayment).where(
                RecurringPayment.next_payment_date <= date.today(),
                RecurringPayment.canceled_at == None,
                RecurringPayment.completed_at == None,
            )
        ).all()

        for payment in payments:
            try:
                logger.info(
                    f"Executing recurring payment: {payment.recurring_payment_id}",
                )
                process_recurring_payment(payment, session)

            except Exception as e:
                logger.exception(e)
        session.commit()


scheduler = BackgroundScheduler()
scheduler.add_job(process_recurring_payments, "interval", seconds=10)
