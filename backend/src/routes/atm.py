import httpx
import os
from fastapi import APIRouter, Query
import math

router = APIRouter()
API_KEY = os.getenv("GOOGLE_API_KEY")


def haversine(lat1: float, lon1: float, lat2: float, lon2: float):
    R = 6371000
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    return (R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))) / 1609.344


@router.get("/atm/geocode")
async def geocode(address: str = Query(...)):
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            params={"address": address, "key": API_KEY},
        )
    return res.json()


async def helper(lat: float, lng: float, radius: int):
    async with httpx.AsyncClient() as client:
        # First try with requested radius
        res = await client.get(
            "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
            params={
                "location": f"{lat},{lng}",
                "radius": radius,
                "keyword": "Chase ATM",
                "type": "atm",
                "key": API_KEY,
            },
        )
        data = res.json()

        # Filter for Chase only to check if real results exist
        chase_results = [
            r
            for r in data.get("results", [])
            if "chase" in r.get("name", "").lower()
            or r.get("international_phone_number") == "+1 800-935-9935"
        ]

        # map to desired form
        chase_results = [
            {
                "address": r["vicinity"],
                "lat": r["geometry"]["location"]["lat"],
                "lng": r["geometry"]["location"]["lng"],
                "open": r.get("opening_hours", {}).get("open_now", None),
                "distance": haversine(
                    lat,
                    lng,
                    r["geometry"]["location"]["lat"],
                    r["geometry"]["location"]["lng"],
                ),
            }
            for r in chase_results
        ]

        # sort by distance
        chase_results = sorted(chase_results, key=lambda r: r["distance"])

        # dedup
        seen_addresses = set()
        chase_results = [
            r
            for r in chase_results
            if r["address"] not in seen_addresses
            and (seen_addresses.add(r["address"]) or True)  # type: ignore[func-returns-value]
        ]

        # round distance and convert to string
        for r in chase_results:
            r["distance"] = f"{r['distance']:,.1f}"

        # If no Chase results, retry with 20km radius
        if not chase_results and radius < 20000:
            return await helper(lat, lng, 20000)
        return chase_results


@router.get("/atm/nearby")
async def nearby_atms(lat: float, lng: float, radius: int = 5000):
    data = {"results": await helper(lat, lng, radius)}

    return data
