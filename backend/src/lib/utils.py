from sqlmodel import select, Session
from models import Address
from typing import Optional


def get_or_create_address(
    street: str,
    city: str,
    state: str,
    zipcode: str,
    country: str,
    session: Session,
    unit: Optional[str] = None,
):
    stmt = select(Address).where(
        Address.street == street,
        Address.unit == unit,
        Address.city == city,
        Address.state == state,
        Address.zip_code == zipcode,
        Address.country == country,
    )
    address = session.exec(stmt).first()
    if address:
        return address
    address = Address(
        street=street,
        unit=unit,
        city=city,
        state=state,
        zip_code=zipcode,
        country=country,
    )
    session.add(address)
    session.flush()
    return address
