from fastapi import APIRouter

from app.api import auth, batches, demo, messaging, payments, reads, trips

api_router = APIRouter()
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(reads.router, tags=["reads"])
api_router.include_router(messaging.router, tags=["messaging"])
api_router.include_router(trips.router, tags=["trips"])
api_router.include_router(batches.router, tags=["batches"])
api_router.include_router(payments.router, tags=["payments"])
api_router.include_router(demo.router, tags=["demo"])
