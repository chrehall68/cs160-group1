from apscheduler.schedulers.blocking import BlockingScheduler
from datetime import date
from sqlmodel import select, Session
from dependencies.db import create_db_and_tables, get_engine
from models import RecurringPayment
from lib.transfers import process_recurring_payment
import logging

logger = logging.getLogger("uvicorn.error")


def process_recurring_payments():
    logger.info("Scheduler checking recurring payments...")

    with Session(get_engine()) as session:
        payments = session.exec(
            select(RecurringPayment)
            .where(
                RecurringPayment.next_payment_date <= date.today(),
                RecurringPayment.canceled_at == None,
                RecurringPayment.completed_at == None,
            )
            .order_by(RecurringPayment.recurring_payment_id)  # type: ignore
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


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    create_db_and_tables()
    scheduler = BlockingScheduler()
    scheduler.add_job(process_recurring_payments, "interval", seconds=10)
    logger.info("Starting APScheduler (standalone)...")
    scheduler.start()


if __name__ == "__main__":
    main()
