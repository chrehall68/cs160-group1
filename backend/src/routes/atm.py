import httpx
import os
from fastapi import APIRouter, Query

router = APIRouter()
API_KEY = os.getenv("GOOGLE_API_KEY")

@router.get("/atm/geocode")
async def geocode(address: str = Query(...)):
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            params={"address": address, "key": API_KEY}
        )
    return res.json()

@router.get("/atm/nearby")
async def nearby_atms(lat: float, lng: float, radius: int = 5000):
    async with httpx.AsyncClient() as client:
        # First try with requested radius
        res = await client.get(
            "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
            params={
                "location": f"{lat},{lng}",
                "radius": radius,
                "keyword": "Chase ATM",
                "type": "atm",
                "key": API_KEY
            }
        )
        data = res.json()

        # Filter for Chase only to check if real results exist
        chase_results = [
            r for r in data.get("results", [])
            if "chase" in r.get("name", "").lower()
            or r.get("international_phone_number") == "+1 800-935-9935"
        ]

        # If no Chase results, retry with 20km radius
        if not chase_results and radius < 20000:
            res = await client.get(
                "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
                params={
                    "location": f"{lat},{lng}",
                    "radius": 20000,
                    "keyword": "Chase ATM",
                    "type": "atm",
                    "key": API_KEY
                }
            )
            data = res.json()

    return data