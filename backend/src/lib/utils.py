from fastapi import HTTPException, status
from sqlmodel import select, Session
from models import Address
from typing import Optional


def validate_pagination(page: int, limit: int) -> None:
    """Raise HTTP 400 if page or limit aren't positive integers."""
    if limit <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="limit must be positive",
        )
    if page <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="page must be positive",
        )


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
