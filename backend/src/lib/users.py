from sqlmodel import select, Session
from models import User


def get_associated_user(customer_id: int, session: Session) -> User | None:
    user_stmt = select(User).where(User.customer_id == customer_id)
    user = session.exec(user_stmt).first()

    return user
