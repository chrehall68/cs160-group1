from apscheduler.schedulers.background import BackgroundScheduler
from datetime import date, datetime, timedelta
from sqlmodel import select, Session
from dependencies.db import create_db_and_tables
from models import RecurringPayment, Account, Transaction, Transfer



print("Recurring payment scheduler initialized")


def process_recurring_payments():
    print("Scheduler checking recurring payments...")

    engine = create_db_and_tables() 

    with Session(engine) as session:
        payments = session.exec(
            select(RecurringPayment).where(
                RecurringPayment.next_payment_date <= date.today(),
                RecurringPayment.canceled_at == None
            )
        ).all()

        for payment in payments:
            print("Executing recurring payment:", payment.recurring_payment_id)

            account = session.get(Account, payment.from_account_id)

            if not account:
                print("No account found")
                continue

            if account.balance < payment.amount:
                print("Insufficient funds for recurring payment")
                continue

            #subtract balance
            account.balance -= payment.amount

            #create transaction
            transaction = Transaction(
                account_id=payment.from_account_id,
            transaction_type="transfer",
            amount=payment.amount,
            currency="USD",
            status="completed",
            description="Recurring payment",
            created_at=datetime.utcnow()
            )

            session.add(transaction)
            session.flush()  

            #create transfer record
            transfer = Transfer(
                transaction_id=transaction.transaction_id,
                type=payment.transfer_type.value,
                direction="outgoing"
            )

            session.add(transfer)

            #update next payment date
            if payment.frequency.value == "monthly":
                payment.next_payment_date = payment.next_payment_date + timedelta(days=30)
        session.commit()


scheduler = BackgroundScheduler()
scheduler.add_job(process_recurring_payments, "interval", seconds=10)