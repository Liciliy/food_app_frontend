# Frontend Development Guide - Appendix: Meal Time Detection

## Overview

This appendix documents the new **Meal Consumption Time Detection** feature, which allows the backend to automatically extract when a meal was consumed from natural language descriptions like "yesterday at dinner" or "this morning at 9am".

## API Changes

### Voice Input Upload Endpoint

**Endpoint**: `POST /api/food/voice-inputs/upload/`

#### New Optional Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `client_timestamp` | string (ISO 8601) | No | User's current local datetime (e.g., `2026-01-24T14:30:00`) |
| `client_timezone` | string (IANA) | No | User's timezone (e.g., `Europe/Kyiv`, `America/New_York`) |

#### Example Request

```javascript
const formData = new FormData();
formData.append('audio', audioBlob, 'recording.wav');
formData.append('client_timestamp', new Date().toISOString().slice(0, 19)); // "2026-01-24T14:30:00"
formData.append('client_timezone', Intl.DateTimeFormat().resolvedOptions().timeZone); // "Europe/Kyiv"

const response = await fetch('/api/food/voice-inputs/upload/', {
  method: 'POST',
  headers: {
    'Authorization': `Token ${token}`,
  },
  body: formData,
});
```

### Meal Object Changes

The Meal object now includes two additional fields:

| Field | Type | Description |
|-------|------|-------------|
| `user_timezone` | string \| null | User's timezone at the time of meal logging (IANA format) |
| `consumed_at_raw` | string \| null | Raw time reference extracted from user's speech (for debugging) |

#### Updated Meal Object Structure

```json
{
  "id": 123,
  "description": "Pizza for dinner",
  "meal_type": "unknown",
  "total_calories": 500.0,
  "macros": {
    "protein": 20.0,
    "carbs": 50.0,
    "fat": 25.0
  },
  "consumed_at": "2026-01-23T19:00:00Z",
  "user_timezone": "Europe/Kyiv",
  "consumed_at_raw": "dinner yesterday",
  "food_items": [...],
  "created_at": "2026-01-24T14:30:00Z",
  "updated_at": "2026-01-24T14:30:00Z"
}
```

## How Time Extraction Works

### Flow

1. **Frontend sends** audio file + `client_timestamp` + `client_timezone`
2. **Backend transcribes** audio using Whisper → "I had pizza for dinner yesterday"
3. **Backend analyzes** food using GPT-4o-mini → nutritional data
4. **Backend extracts time** using separate LLM call → `consumed_at: "2026-01-23T19:00:00"`
5. **Backend saves** meal with resolved `consumed_at`, `user_timezone`, and `consumed_at_raw`

### Time Reference Examples

The system can understand various time references in multiple languages:

| User Says | Resolved To |
|-----------|-------------|
| "I had pizza for dinner yesterday" | Previous day at 19:00 |
| "Ate breakfast at 9am" | Same day at 09:00 |
| "I just had coffee" | Current time |
| "Last night I had ice cream" | Previous day at 22:00 |
| "Вчора ввечері їв борщ" | Previous day at 19:00 |
| "I ate an apple" | Submission time (no time mentioned) |

### Fallback Behavior

| Scenario | Result |
|----------|--------|
| No `client_timestamp`/`client_timezone` provided | Uses server submission time |
| LLM cannot detect time reference | Uses submission time |
| LLM returns invalid datetime | Uses submission time |
| LLM returns future datetime | Uses submission time (rejected) |

## Frontend Implementation Guide

### 1. Getting User's Timezone

```javascript
// Get user's current timezone (IANA format)
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
// Example: "Europe/Kyiv", "America/New_York", "Asia/Tokyo"
```

### 2. Getting Client Timestamp

```javascript
// Get current local datetime in ISO 8601 format (without timezone suffix)
const clientTimestamp = new Date().toISOString().slice(0, 19);
// Example: "2026-01-24T14:30:00"
```

### 3. Complete Upload Function

```javascript
async function uploadVoiceInput(audioBlob, token) {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.wav');
  
  // Add time context for accurate time extraction
  formData.append(
    'client_timestamp', 
    new Date().toISOString().slice(0, 19)
  );
  formData.append(
    'client_timezone', 
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  const response = await fetch('/api/food/voice-inputs/upload/', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  return response.json();
}
```

### 4. Displaying Meal Time

When displaying meal times, consider using the stored `user_timezone` to show times in the user's local timezone:

```javascript
function formatMealTime(meal) {
  const consumedAt = new Date(meal.consumed_at);
  
  // If we have the user's timezone, format in that timezone
  if (meal.user_timezone) {
    return consumedAt.toLocaleString('en-US', {
      timeZone: meal.user_timezone,
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }
  
  // Fallback to browser's timezone
  return consumedAt.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
```

### 5. Debug Information

The `consumed_at_raw` field contains the original time phrase extracted from the user's speech. This can be useful for:

- Debugging time extraction issues
- Showing users what time reference was detected
- Building features like "Did you mean yesterday at dinner?"

```javascript
function MealCard({ meal }) {
  return (
    <div>
      <h3>{meal.description}</h3>
      <p>Consumed: {formatMealTime(meal)}</p>
      {meal.consumed_at_raw && (
        <p className="text-muted">
          Detected: "{meal.consumed_at_raw}"
        </p>
      )}
    </div>
  );
}
```

## Best Practices

1. **Always send client time parameters** - This ensures accurate time detection for phrases like "yesterday" or "this morning".

2. **Store timezone preferences** - Consider caching the user's timezone in local storage or app state for consistent behavior.

3. **Handle null values gracefully** - `user_timezone` and `consumed_at_raw` may be `null` for meals created before this feature or when time parameters weren't provided.

4. **Display times in user's timezone** - Use the stored `user_timezone` for consistent time display, even if the user has traveled.

5. **Consider timezone changes** - Each meal stores its own timezone, so historical meals will display correctly even if the user changes their location.

## Migration Notes

### Existing Meals

- Meals created before this feature will have `user_timezone: null` and `consumed_at_raw: null`
- Their `consumed_at` values remain unchanged (server submission time)

### Backward Compatibility

- The new parameters are optional
- Omitting `client_timestamp` and `client_timezone` results in the same behavior as before (uses server time)
- API responses remain backward compatible (new fields are simply added)

## Error Handling

The time extraction feature is designed to fail gracefully:

```javascript
// Time extraction errors don't fail the upload
// The meal is still created with submission time as fallback

try {
  const result = await uploadVoiceInput(audioBlob, token);
  // result.meal.consumed_at will be set regardless
  // Check user_timezone to see if time extraction worked
  if (result.meal.user_timezone) {
    console.log('Time extracted successfully');
  } else {
    console.log('Using submission time (no client params provided)');
  }
} catch (error) {
  // Handle upload errors (not time extraction errors)
  console.error('Upload failed:', error);
}
```

## Summary of Changes

| Component | Change |
|-----------|--------|
| Upload endpoint | Accepts `client_timestamp` and `client_timezone` |
| Meal model | Added `user_timezone` and `consumed_at_raw` fields |
| Time detection | Separate LLM call analyzes temporal references |
| Fallback | Uses submission time if extraction fails or no time mentioned |
| API response | Meal objects include new fields |
