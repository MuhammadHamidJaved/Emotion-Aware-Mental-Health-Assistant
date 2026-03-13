# Personalized Mood-Based Recommendation API Reference

**Base URL:** `http://127.0.0.1:5001/api`  
**Version:** 2.0.0

---

## Endpoints Overview

| Method   | Endpoint                 | Description                              |
|----------|--------------------------|------------------------------------------|
| `POST`   | `/api/recommend`         | Get personalized mood-based recommendations |
| `POST`   | `/api/feedback`          | Submit feedback to improve future results |
| `GET`    | `/api/history/{user_id}` | Get user's recommendation history         |
| `GET`    | `/api/patterns/{user_id}`| Get learned user patterns                 |
| `DELETE` | `/api/user/{user_id}`    | Delete all user data (GDPR)               |
| `GET`    | `/api/meta/emotions`     | List all supported emotions               |
| `GET`    | `/api/meta/genres`       | List all supported Spotify genres         |
| `GET`    | `/api/meta/markets`      | List all supported Spotify markets        |
| `GET`    | `/api/health`            | Health check                              |

---

## 1. POST `/api/recommend`

The main endpoint. Send the detected emotion along with user preferences and context to receive personalized recommendations for music, exercises, activities, quotes, and meditation.

### Request Body

```json
{
  "user_id": "user_123",
  "emotion": "sad",
  "preferences": {
    "language": "en",
    "music_language": "hindi",
    "music_genres": ["acoustic", "piano", "classical"],
    "favorite_artists": ["Arijit Singh", "Atif Aslam"],
    "market": "PK",
    "fitness_level": "moderate",
    "preferred_activities": [],
    "content_language": "en",
    "age_group": "young_adult"
  },
  "context": {
    "time_of_day": "night",
    "current_activity": "relaxing",
    "location_type": "home",
    "weather": "rainy",
    "energy_level": "low",
    "social_context": "alone",
    "emotion_intensity": 0.7,
    "secondary_emotion": "anxious"
  },
  "include_music": true,
  "include_exercise": true,
  "include_activity": true,
  "include_quote": true,
  "include_meditation": true,
  "music_limit": 10,
  "exercise_limit": 5
}
```

### Field Reference

#### Top-level fields

| Field               | Type    | Required | Default | Description |
|---------------------|---------|----------|---------|-------------|
| `user_id`           | string  | **Yes**  | —       | Unique user identifier from your app |
| `emotion`           | string  | **Yes**  | —       | Detected emotion (see supported list below) |
| `preferences`       | object  | No       | defaults | User preferences object |
| `context`           | object  | No       | defaults | Context/environment object |
| `include_music`     | bool    | No       | `true`  | Include music tracks in response |
| `include_exercise`  | bool    | No       | `true`  | Include exercises in response |
| `include_activity`  | bool    | No       | `true`  | Include activity suggestion |
| `include_quote`     | bool    | No       | `true`  | Include inspirational quote |
| `include_meditation`| bool    | No       | `true`  | Include meditation suggestions |
| `music_limit`       | int     | No       | `10`    | Number of tracks to return (1–50) |
| `exercise_limit`    | int     | No       | `5`     | Number of exercises to return (1–20) |

#### `preferences` object

| Field                | Type       | Default       | Description |
|----------------------|------------|---------------|-------------|
| `language`           | string     | `"en"`        | General language code (`en`, `ur`, `hi`, `ar`) |
| `music_language`     | string     | `""`          | **Music language preference** — see supported languages below |
| `music_genres`       | string[]   | `[]`          | Spotify genres (e.g., `["pop", "rock", "classical"]`) |
| `favorite_artists`   | string[]   | `[]`          | Artist names — tracks BY these artists will dominate results |
| `market`             | string     | `"US"`        | Spotify market code for regional content |
| `fitness_level`      | string     | `"moderate"`  | `"beginner"`, `"moderate"`, or `"advanced"` |
| `preferred_activities`| string[]  | `[]`          | Preferred activity types |
| `content_language`   | string     | `"en"`        | Language for quotes/text content |
| `age_group`          | string?    | `null`        | `"teen"`, `"young_adult"`, `"adult"`, `"senior"` |

#### `context` object

| Field               | Type    | Default | Description |
|---------------------|---------|---------|-------------|
| `time_of_day`       | string? | `null`  | `"morning"`, `"afternoon"`, `"evening"`, `"night"` |
| `current_activity`  | string? | `null`  | `"working"`, `"studying"`, `"exercising"`, `"relaxing"`, `"sleeping"`, `"commuting"`, `"socializing"`, `"meditating"` |
| `location_type`     | string? | `null`  | `"home"`, `"work"`, `"outdoors"`, `"gym"`, `"commute"` |
| `weather`           | string? | `null`  | Current weather condition |
| `energy_level`      | string? | `null`  | `"low"`, `"medium"`, `"high"` |
| `social_context`    | string? | `null`  | `"alone"`, `"with_friends"`, `"with_family"`, `"public"` |
| `emotion_intensity` | float   | `0.5`   | Intensity from `0.0` (mild) to `1.0` (extreme) |
| `secondary_emotion` | string? | `null`  | Secondary emotion if present |

### Response

```json
{
  "recommendation_id": "abc123",
  "recommendations": {
    "music": {
      "playlist_url": null,
      "tracks": [
        {
          "id": "spotify_track_id",
          "title": "Tum Hi Ho",
          "artist": "Arijit Singh, Mithoon",
          "album": "Aashiqui 2",
          "url": "https://open.spotify.com/track/...",
          "preview_url": "https://p.scdn.co/...",
          "duration_ms": 261000,
          "popularity": 79,
          "image_url": "https://i.scdn.co/image/..."
        }
      ],
      "seed_genres": ["acoustic", "piano"],
      "search_queries_used": ["artist:Arijit Singh sad", "..."]
    },
    "exercise": [
      {
        "name": "Gentle Stretching",
        "category": "Flexibility",
        "description": "Full body gentle stretches to release tension",
        "duration": "15-20 min",
        "difficulty": "moderate"
      }
    ],
    "activity": "Watch a comforting movie or video",
    "quote": "This too shall pass. — Persian Proverb",
    "meditation": [
      {
        "name": "Self-Compassion Meditation",
        "duration": "10 min",
        "type": "compassion",
        "description": "Loving-kindness for yourself"
      }
    ]
  },
  "personalization_applied": {
    "emotion": "sad",
    "intensity": 0.7,
    "search_queries_used": ["artist:Arijit Singh sad", "..."],
    "user_genres": ["acoustic", "piano"],
    "favorite_artists": ["Arijit Singh"],
    "music_language": "hindi",
    "market": "PK"
  }
}
```

---

## 2. POST `/api/feedback`

Submit user feedback on a recommendation to improve future results.

### Request Body

```json
{
  "user_id": "user_123",
  "recommendation_id": "abc123",
  "recommendation_type": "music",
  "item_id": "spotify_track_id",
  "feedback_type": "like",
  "rating": 5
}
```

| Field                | Type    | Required | Description |
|----------------------|---------|----------|-------------|
| `user_id`            | string  | **Yes**  | User identifier |
| `recommendation_id`  | string  | **Yes**  | ID returned by `/recommend` |
| `recommendation_type`| string  | **Yes**  | `"music"`, `"exercise"`, `"activity"`, `"quote"`, `"meditation"` |
| `item_id`            | string  | **Yes**  | ID of the specific item |
| `feedback_type`      | string  | **Yes**  | `"like"`, `"dislike"`, `"skip"`, `"completed"` |
| `rating`             | int?    | No       | Optional 1–5 rating |

---

## 3. GET `/api/history/{user_id}`

Get recommendation history for a user.

| Query Param | Type    | Default | Description |
|-------------|---------|---------|-------------|
| `limit`     | int     | `50`    | Max records (1–200) |
| `emotion`   | string? | `null`  | Filter by specific emotion |

---

## 4. GET `/api/patterns/{user_id}`

Get learned patterns derived from user feedback (preferred genres per emotion, preferred artists, etc.).

| Query Param | Type    | Default | Description |
|-------------|---------|---------|-------------|
| `emotion`   | string? | `null`  | Filter by specific emotion |

---

## 5. DELETE `/api/user/{user_id}`

Delete all stored data for a user (history, feedback, learned patterns). Irreversible.

---

## 6. GET `/api/meta/emotions`

Returns the full list of supported emotions.

---

## 7. GET `/api/meta/genres`

Returns the list of Spotify genres you can pass in `preferences.music_genres`.

---

## 8. GET `/api/meta/markets`

Returns the list of supported Spotify market codes for `preferences.market`.

---

## Supported Personalization Options

### Supported Emotions (28)

**Primary:** `happy`, `sad`, `angry`, `stressed`, `neutral`, `fear`, `surprise`, `disgust`

**Extended:** `anxious`, `calm`, `excited`, `relaxed`, `melancholic`, `nostalgic`, `hopeful`, `lonely`, `energetic`, `tired`, `motivated`, `frustrated`, `peaceful`, `content`, `bored`, `confused`, `depressed`, `grateful`, `love`, `heartbroken`

Aliases also work (e.g., `happiness` → `happy`, `sadness` → `sad`, `anxiety` → `anxious`, `depression` → `depressed`).

---

### Supported Music Languages (22)

Pass one of these values in `preferences.music_language`:

| Value          | What it biases towards                |
|----------------|---------------------------------------|
| `"hindi"`      | Hindi / Bollywood songs               |
| `"urdu"`       | Urdu songs                            |
| `"punjabi"`    | Punjabi songs                         |
| `"english"`    | English songs (default, no extra bias)|
| `"arabic"`     | Arabic music                          |
| `"turkish"`    | Turkish music                         |
| `"korean"`     | K-pop / Korean music                  |
| `"japanese"`   | J-pop / Japanese music                |
| `"spanish"`    | Spanish / Latino music                |
| `"french"`     | French music                          |
| `"german"`     | German music                          |
| `"portuguese"` | Portuguese / Brazilian music          |
| `"bengali"`    | Bengali music                         |
| `"tamil"`      | Tamil music                           |
| `"telugu"`     | Telugu music                          |
| `"chinese"`    | Chinese / Mandarin / C-pop            |
| `"italian"`    | Italian music                         |
| `"russian"`    | Russian music                         |
| `"thai"`       | Thai music                            |
| `"vietnamese"` | Vietnamese music                      |
| `"malay"`      | Malay music                           |
| `"indonesian"` | Indonesian music                      |

Leave empty (`""`) or omit to get results in any language.

---

### Favorite Artists Behaviour

When you pass `preferences.favorite_artists`, the result set is **dominated by those artists' tracks** (~70% of results), filtered by mood. The remaining ~30% are filled with genre/emotion-based tracks.

**Example:**  
`"favorite_artists": ["Arijit Singh"]` with `"emotion": "sad"` and `"music_language": "hindi"` returns mostly sad/emotional songs by Arijit Singh in Hindi.

You can pass up to **3 artists**. The search uses:
1. Spotify's strict `artist:Name` filter + mood word (guarantees tracks by that artist)
2. Free-text `"ArtistName mood_word language"` (picks up collaborations too)

---

### Supported Markets

Pass the two-letter country code in `preferences.market`:

`US`, `GB`, `PK`, `IN`, `AE`, `SA`, `DE`, `FR`, `JP`, `KR`, `AU`, `CA`, `TR`, `BR` and more.

This affects which tracks are available in the Spotify catalog for that region.

---

### Context Adjustments

These fields in `context` automatically adjust the music selection:

| Field              | Effect |
|--------------------|--------|
| `time_of_day`      | Night → calmer; morning → more energy |
| `current_activity` | Studying → instrumental; exercising → high energy; sleeping → very calm |
| `emotion_intensity`| Higher intensity → more extreme mood matching |
| `social_context`   | Alone + lonely → no "social" activities suggested |

---

## Minimal Integration Example

The simplest call from your other app — only `user_id` and `emotion` are required:

```json
POST /api/recommend
{
  "user_id": "user_123",
  "emotion": "happy"
}
```

Everything else uses sensible defaults.

### Full Personalized Example

```json
POST /api/recommend
{
  "user_id": "user_456",
  "emotion": "sad",
  "preferences": {
    "music_language": "hindi",
    "music_genres": ["acoustic", "piano"],
    "favorite_artists": ["Arijit Singh"],
    "market": "PK",
    "fitness_level": "beginner"
  },
  "context": {
    "time_of_day": "night",
    "current_activity": "relaxing",
    "emotion_intensity": 0.8,
    "social_context": "alone"
  },
  "music_limit": 15
}
```

This returns ~10-11 sad Arijit Singh Hindi tracks + ~4-5 mood-matching Hindi tracks, along with exercises, an activity, a quote, and meditation suggestions — all tuned for the "sad" emotion.
