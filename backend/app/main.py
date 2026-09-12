from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session
from app.config import settings
from app.database import init_db, engine, get_session
from app.seed import seed_demo_data
from app.routes.queue import router as queue_router
from app.routes.tables import router as tables_router
from app.routes.ai import router as ai_router
from app.routes.notifications import router as notifications_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables and demo seed
    init_db()
    with Session(engine) as session:
        seed_demo_data(session, force=False)
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="QueueBite — Restaurant Waitlist Management Backend API",
    lifespan=lifespan
)

# CORS configuration for Frontend connectivity
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(queue_router)
app.include_router(tables_router)
app.include_router(ai_router)
app.include_router(notifications_router)

@app.get("/api/health", tags=["System"])
def healthcheck():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.VERSION}

@app.post("/api/demo/reset", tags=["System"])
def reset_demo(session: Session = Depends(get_session)):
    seed_demo_data(session, force=True)
    return {"status": "success", "message": "Demo data successfully reset to initial state"}
