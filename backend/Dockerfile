FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 8000

# $PORT is set automatically by Render; defaults to 8000 for local/Docker use.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
