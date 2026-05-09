from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from datetime import date

from dtos.shared import AddressRequest


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class RegisterRequest(BaseModel):
    username: str
    password: str
    first_name: str
    last_name: str
    date_of_birth: date
    email: EmailStr
    phone: str
    address: AddressRequest
    ssn: str

    @field_validator("date_of_birth")
    @classmethod
    def validate_dob_18_years_ago(cls, v: date) -> date:
        """Validate that date of birth is at least 18 years in the past and no more than 150 years."""
        from datetime import datetime, timezone

        today = date.today()
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        if age < 18:
            raise ValueError("User must be at least 18 years old")
        if age > 150:
            # not enforcing this in db since what if a user
            # was 149 years old on signup and then is now 150 and still living?
            # that would make the row invalid despite still representing a valid user
            # so we just check on signup
            raise ValueError("User must be no more than 150 years old at signup")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        """Validate that phone contains only digits and is correct length (10 for US)."""
        if not v.isdigit():
            raise ValueError("Phone number must contain only digits")
        if len(v) != 10:
            raise ValueError("Phone number must be 10 digits")
        return v

    @field_validator("ssn")
    @classmethod
    def validate_ssn(cls, v: str) -> str:
        """Validate that SSN contains only digits and is correct length (9)."""
        if not v.isdigit():
            raise ValueError("SSN must contain only digits")
        if len(v) != 9:
            raise ValueError("SSN must be 9 digits")
        return v


class ErrorResponse(BaseModel):
    reason: str
