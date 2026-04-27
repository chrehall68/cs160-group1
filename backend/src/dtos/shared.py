from pydantic import BaseModel, field_validator
from typing import Optional


class AddressRequest(BaseModel):
    street: str
    unit: Optional[str] = None
    city: str
    state: str
    zipcode: str
    country: str = "USA"

    @field_validator("zipcode")
    @classmethod
    def validate_zipcode(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("Zip code must contain only digits")
        return v
