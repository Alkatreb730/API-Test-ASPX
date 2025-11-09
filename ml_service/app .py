# ml_service/app.py
# Simple local ML microservice using FastAPI — returns mock forecasts for now.

from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
import random

app = FastAPI(title="Mini Forecast ML API")

@app.get("/predict")
def predict(asset: str = Query("BTC/USD")):
    # Generate random but reasonable mock forecast
    direction = random.choice(["+", "-", "0"])
    confidence = random.randint(55, 90)
    value = round(random.uniform(-0.005, 0.005), 5)
    note = f"Simulated forecast for {asset}."
    return JSONResponse({
        "asset": asset,
        "prediction": direction,
        "confidence": f"{confidence}%",
        "value": value,
        "note": note
    })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
