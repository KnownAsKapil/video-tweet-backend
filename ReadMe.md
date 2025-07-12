# Video-Tweet Backend API

A fully featured backend API that combines video-sharing (YouTube-style) and microblogging (Twitter-style) with:

* ✅ User authentication (JWT & refresh tokens)
* ✅ Video upload + Cloudinary integration
* ✅ Tweets, comments, likes (videos, comments, tweets)
* ✅ Playlists, subscriptions, channel stats
* ✅ MongoDB aggregation, pagination, and search

---

## Tech Stack

* Node.js & Express for server
* MongoDB + Mongoose for data storage & schemas
* JWT for auth (access & refresh tokens)
* Multer for file uploads (videos, thumbnails, avatars, cover images)
* Cloudinary for media storage
* mongoose-aggregate-paginate-v2 for paginated feeds

---

## Installation

```bash
git clone https://github.com/yourusername/video-tweet-backend.git
cd video-tweet-backend
npm install
```

Copy `.env.example` → `.env` and fill in:

```ini
PORT=8000
MONGODB_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your_refresh_token_secret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

```bash
npm run dev
```

Your API will be listening on [http://localhost:8000](http://localhost:8000)

---

## Project Structure

```
src/
├─ controllers/
│   ├ comment.controller.js
│   ├ dashboard.controller.js
│   ├ healthcheck.controller.js
│   ├ like.controller.js
│   ├ playlist.controller.js
│   ├ subscription.controller.js
│   ├ tweet.controller.js
│   ├ user.controller.js
│   └ video.controller.js
├─ models/
│   ├ comment.model.js
│   ├ like.model.js
│   ├ playlist.model.js
│   ├ subscription.model.js
│   ├ tweet.model.js
│   ├ user.model.js
│   └ video.model.js
├─ routes/
│   ├ comment.routes.js
│   ├ dashboard.routes.js
│   ├ healthcheck.routes.js
│   ├ like.routes.js
│   ├ playlist.routes.js
│   ├ subscription.routes.js
│   ├ tweet.routes.js
│   ├ user.routes.js
│   └ video.routes.js
├─ utils/
│   ├ apiError.js
│   ├ apiResponse.js
│   ├ asyncHandler.js
│   ├ cloudinary.js
│   ├ constants.js
│   └ app.js
└─ db/index.js
.env  
.gitignore  
README.md  
package.json
```

---

## Authentication

* POST   /api/users/register
* POST   /api/users/login
* POST   /api/users/logout
* POST   /api/users/refresh
* GET    /api/users/me
* PATCH  /api/users/me
* PATCH  /api/users/me/password
* PATCH  /api/users/me/avatar
* PATCH  /api/users/me/cover-image
* GET    /api/users/\:userId/profile
* GET    /api/users/me/history

---

## Endpoints

### Health Check

* GET /api/healthcheck

### Videos

* GET    /api/videos
* POST   /api/videos
* GET    /api/videos/\:videoId
* PATCH  /api/videos/\:videoId
* DELETE /api/videos/\:videoId
* PATCH  /api/videos/\:videoId/toggle-publish

### Comments

* GET    /api/videos/\:videoId/comments
* POST   /api/videos/\:videoId/comments
* PATCH  /api/comments/\:commentId
* DELETE /api/comments/\:commentId

### Tweets

* POST   /api/tweets
* GET    /api/tweets/user/\:userId
* PATCH  /api/tweets/\:tweetId
* DELETE /api/tweets/\:tweetId

### Likes

* POST   /api/likes/video/\:videoId/toggle
* POST   /api/likes/comment/\:commentId/toggle
* POST   /api/likes/tweet/\:tweetId/toggle
* GET    /api/likes/videos

### Playlists

* POST   /api/playlists
* GET    /api/playlists
* GET    /api/playlists/\:playlistId
* PATCH  /api/playlists/\:playlistId
* DELETE /api/playlists/\:playlistId
* POST   /api/playlists/\:playlistId/videos
* DELETE /api/playlists/\:playlistId/videos/\:videoId

### Subscriptions

* POST   /api/subscriptions/c/\:channelId
* GET    /api/subscriptions/c/\:channelId
* GET    /api/subscriptions/u/\:subscriberId

### Dashboard

* GET    /api/dashboard/channel-stats
* GET    /api/dashboard/channel-videos

---

## Features

* JWT Auth with Access & Refresh tokens
* Multer + Cloudinary for file uploads
* Mongoose schemas and relations
* Full-text search on videos
* Pagination via mongoose-aggregate-paginate-v2
* Aggregation pipelines for stats
* Subscription-ready structure

---

## Postman Collection

Use the included collection file:

**Backend Test.postman\_collection.json**

Steps:

1. Open Postman
2. Click "Import" → choose the JSON file
3. Create an environment variable:

```env
Server 8k = http://localhost:8000/api/v1
```

---

## License

MIT © M. Surya Kapil
