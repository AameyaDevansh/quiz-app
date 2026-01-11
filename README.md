# quiz-app

1️⃣ Start Redis (Backend Dependency)

Redis runs via Docker.

cd server
docker compose up -d


📌 This uses:

server/docker/redis.yml


To verify Redis:

docker ps

2️⃣ Start Backend Server

Open a new terminal:

cd server
npm install    # first time only
npm run dev


Backend runs on:

http://localhost:4000


You should see logs like:

✅ MongoDB connected

✅ Redis connected

🚀 Server running

3️⃣ Start Frontend (Next.js)

Open another terminal:

cd web
npm install    # first time only
npm run dev


Frontend runs on:

http://localhost:3000

4️⃣ Open the App

Go to:

http://localhost:3000