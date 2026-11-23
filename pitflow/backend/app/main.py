from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.config import settings

app = FastAPI(
    title="PitFlow",
    description=(
        "Pit Sidecar / PitFlow — idea-stage prototype. "
        "All demo data is SAMPLE DATA only."
    ),
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "pitflow", "sample_data_only": True}
