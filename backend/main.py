from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import router as api_router
from app.api import start_serial_worker
from app.database import dispose_db, init_db
from app.ml_service import load_all_models


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("--- APP STARTUP ---")
    print("Loading ML models...")
    load_all_models()
    import asyncio
    asyncio.create_task(init_db())
    start_serial_worker()
    yield
    print("--- APP SHUTDOWN ---")
    await dispose_db()

app = FastAPI(title="Sulfur Monitoring API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import RedirectResponse

app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return RedirectResponse(url="/docs")

if __name__ == "__main__":
    # Use the string "main:app" to allow the reloader to work properly
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)