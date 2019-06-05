# Local Dev:
docker run --name redis -p 6379:6379 -d redis:3.2.10
docker build --no-cache  -t chatroom .
docker run -ti --link redis:redis -e REDIS_URL=redis://redis:6379 -e APP_PORT=3000 -p 3000:3000 chatroom

# yeah...it works on my laptop..now let's go to the cloud..