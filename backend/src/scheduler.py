from apscheduler.schedulers.background import BackgroundScheduler
from datetime import date
from sqlmodel import select
from dependencies.db import get_session
from models import RecurringPayment
from lib.transfers import process_recurring_payment
import sys
import traceback

print("Recurring payment scheduler initialized")


def process_recurring_payments():
    print("Scheduler checking recurring payments...", file=sys.stderr)
    for session in get_session():
        payments = session.exec(
            select(RecurringPayment).where(
                RecurringPayment.next_payment_date <= date.today(),
                RecurringPayment.canceled_at == None,
            )
        ).all()

        for payment in payments:
            try:
                print(
                    "Executing recurring payment:",
                    payment.recurring_payment_id,
                    file=sys.stderr,
                )
                process_recurring_payment(payment, session)

            except Exception as e:
                traceback.print_exception(e, file=sys.stderr)
        session.commit()


scheduler = BackgroundScheduler()
scheduler.add_job(process_recurring_payments, "interval", seconds=10)
