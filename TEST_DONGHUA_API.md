# Test Donghua API Endpoints

## API Base URL
```
https://api.shiiinime.my.id
```

## Donghua Endpoints to Test

### 1. Donghua Home
```bash
curl https://api.shiiinime.my.id/anime/donghua/home/1
```

### 2. Donghua Ongoing
```bash
curl https://api.shiiinime.my.id/anime/donghua/ongoing/1
```

### 3. Donghua Latest
```bash
curl https://api.shiiinime.my.id/anime/donghua/latest/1
```

### 4. Donghua Completed
```bash
curl https://api.shiiinime.my.id/anime/donghua/completed/1
```

## Expected Response Format
```json
{
  "status": true,
  "data": [
    {
      "title": "Battle Through the Heavens",
      "slug": "battle-through-the-heavens",
      "poster": "https://...",
      "episode": "350",
      "status": "Ongoing"
    }
  ]
}
```

## Current Status
- Anime endpoints: ✅ Working (data shows on /anime page)
- Donghua endpoints: ❓ Returns empty or 403

## Possible Issues
1. **API donghua belum ada data** - Endpoint exists but no data in database
2. **Different endpoint path** - Maybe endpoint is different from docs
3. **Authentication required** - API needs special headers
4. **Rate limiting** - Too many requests

## Debug Steps
1. Test API manually with curl/Postman
2. Check API response status code
3. Verify response structure matches expected format
4. Check if anime API uses different base path

## Alternative: Use Anime API for Donghua
If donghua endpoints don't work, we can use anime API and filter by type:
```
GET /anime/browse?type=donghua
```
