FROM python:3.13-slim

# Sin archivos .pyc y con logs sin buffer (se ven al instante en docker compose logs)
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Las dependencias van primero: Docker reutiliza esta capa mientras requirements.txt no cambie
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# Usuario sin privilegios: si la aplicación se ve comprometida, no es root dentro del contenedor
RUN useradd --create-home --uid 10001 appuser
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health', timeout=3)"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
