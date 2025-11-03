FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc g++ make libssl-dev curl \
    default-libmysqlclient-dev pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p logs uploads static/uploads

ENV PORT=8080
EXPOSE 8080

CMD exec gunicorn --bind :8080 --workers 1 --worker-class eventlet --timeout 300 app:app
