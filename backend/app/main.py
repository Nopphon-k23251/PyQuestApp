import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.app_logging import logger
from app.core.database import engine, Base
from app.api.auth import router as auth_router
from app.api.courses import router as courses_router
from app.api.problems import router as problems_router
from app.api.submissions import router as submissions_router
from app.api.progress import router as progress_router
from app.api.admin import router as admin_router
from app.api.playground import router as playground_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is created on startup
    Base.metadata.create_all(bind=engine)
    try:
        import sqlalchemy as sa
        with engine.connect() as conn:
            for col in ["passed_test_cases", "total_test_cases"]:
                try:
                    conn.execute(sa.text(f"ALTER TABLE submissions ADD COLUMN {col} INTEGER DEFAULT 0"))
                    conn.commit()
                except Exception:
                    pass
            try:
                conn.execute(sa.text("ALTER TABLE submissions ADD COLUMN stderr TEXT"))
                conn.commit()
            except Exception:
                pass
    except Exception:
        pass
    try:
        from app.core.seed_data import seed_database
        seed_database()
    except Exception as e:
        logger.warning(f"Auto seed on startup skipped or failed: {e}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Python Practice Platform API with User/Admin roles, Courses, Problems, Sandboxed Judge, Points, Stars, and Progress.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware (supports local dev and any Vercel deployment)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    duration_ms = int((time.perf_counter() - start_time) * 1000)
    logger.info(f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms)")
    return response


# Standard Error Handlers (§34 & §35)
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, dict):
        code = detail.get("code", "ERROR")
        message = detail.get("message", "An error occurred")
    else:
        code = "ERROR"
        message = str(detail)

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": code,
                "message": message,
            },
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first_error = errors[0] if errors else {}
    msg = first_error.get("msg", "Invalid request parameters")
    loc = " -> ".join([str(l) for l in first_error.get("loc", [])])
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": f"{loc}: {msg}" if loc else msg,
            },
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "SYSTEM_ERROR",
                "message": "An unexpected internal server error occurred.",
            },
        },
    )


# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(courses_router, prefix=settings.API_V1_PREFIX)
app.include_router(problems_router, prefix=settings.API_V1_PREFIX)
app.include_router(submissions_router, prefix=settings.API_V1_PREFIX)
app.include_router(progress_router, prefix=settings.API_V1_PREFIX)
app.include_router(admin_router, prefix=settings.API_V1_PREFIX)
app.include_router(playground_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME}


@app.get("/")
def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API. Visit /docs for Swagger UI."}
