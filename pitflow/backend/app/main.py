from fastapi import FastAPI

app = FastAPI(
    title="PitFlow",
    description="From pit to product, verified.",
    version="0.1.0",
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "pitflow"}
