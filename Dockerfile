FROM python:3.9-slim

WORKDIR /app

COPY . /app


RUN pip install -r requirements.txt


EXPOSE 5000


CMD ["python3", "./app.py", "--host=0.0.0.0"]