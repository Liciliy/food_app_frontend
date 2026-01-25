# Meal Revert Feature - Frontend Development Guide

This document is a continuation of the [Frontend Development Guide](frontend_development_guide.md) and describes the meal revert (undo) functionality.

## Overview

The meal revert feature allows users to quickly undo a recently created meal within a short time window. This is useful for correcting mistakes such as accidental recordings or wrong meal descriptions.

**Key Characteristics:**
- Available only within **20 seconds** after meal analysis completes
- Permanently removes the meal from all statistics
- Redacts sensitive user data for privacy
- Cannot be undone (no "unrevert" capability)

---

## API Endpoint

### Revert Meal

- **Endpoint**: `POST /api/food/meals/{id}/revert/`
- **Purpose**: Revert (undo) a recently created meal
- **Headers**: `Authorization: Token <token>`
- **Time Window**: **Only available within 20 seconds** after meal analysis completes

### What Happens on Revert

1. **Food items deleted**: All food items associated with the meal are permanently deleted
2. **Text content redacted**: Sensitive text is cleared from analysis records:
   - Voice transcription text
   - LLM prompts and responses
   - Time extraction input and output
3. **Meal marked as reverted**: Excluded from all meal lists and statistics
4. **Metadata preserved**: Token counts, API costs, and latencies remain for usage tracking

### Success Response (200 OK)

```json
{
  "message": "Meal successfully reverted.",
  "meal_id": 123,
  "voice_input_id": 456,
  "llm_analysis_id": 789,
  "time_extraction_id": 101,
  "food_items_deleted": 3,
  "reverted_at": "2025-08-17T12:35:20.123456Z"
}
```

### Error Responses

#### 400 Bad Request - Revert Window Expired

```json
{
  "error": "Revert window has expired. Meals can only be reverted within 20 seconds of creation."
}
```

#### 400 Bad Request - Already Reverted

```json
{
  "error": "This meal has already been reverted."
}
```

#### 404 Not Found - Meal Not Found

```json
{
  "error": "Meal not found."
}
```

This also occurs when attempting to revert another user's meal.

---

## Frontend Implementation Guide

### Tracking the Revert Window

After a successful meal upload, track the creation timestamp to determine if revert is still available:

```javascript
// Constants
const REVERT_WINDOW_SECONDS = 20;

// After successful meal upload response
const mealId = response.data.meal.id;
const mealCreatedAt = new Date(
  response.data.llm_analysis?.created_at || response.data.created_at
);

// Calculate remaining time
const getRemainingTime = () => {
  const elapsed = (Date.now() - mealCreatedAt.getTime()) / 1000;
  return Math.max(0, REVERT_WINDOW_SECONDS - elapsed);
};

// Check if revert is still available
const canRevert = () => getRemainingTime() > 0;
```

### Revert API Call

```javascript
const revertMeal = async (mealId, token) => {
  try {
    const response = await fetch(`/api/food/meals/${mealId}/revert/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    }

    const error = await response.json();
    return { success: false, error: error.error };
  } catch (err) {
    return { success: false, error: 'Network error' };
  }
};
```

### React Component Example

```jsx
import { useState, useEffect } from 'react';

const REVERT_WINDOW_SECONDS = 20;

function MealRevertToast({ meal, onRevert, onDismiss }) {
  const [remainingTime, setRemainingTime] = useState(REVERT_WINDOW_SECONDS);
  const [isReverting, setIsReverting] = useState(false);

  const createdAt = new Date(
    meal.llm_analysis?.created_at || meal.created_at
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = (Date.now() - createdAt.getTime()) / 1000;
      const remaining = Math.max(0, REVERT_WINDOW_SECONDS - elapsed);
      setRemainingTime(Math.ceil(remaining));

      if (remaining <= 0) {
        clearInterval(timer);
        onDismiss();
      }
    }, 100);

    return () => clearInterval(timer);
  }, [createdAt, onDismiss]);

  const handleRevert = async () => {
    if (remainingTime <= 0) return;

    const confirmed = window.confirm(
      'Are you sure you want to undo this meal? This cannot be undone.'
    );
    if (!confirmed) return;

    setIsReverting(true);
    await onRevert(meal.id);
  };

  if (remainingTime <= 0) return null;

  return (
    <div className="meal-revert-toast">
      <span>Meal logged successfully!</span>
      <button
        onClick={handleRevert}
        disabled={isReverting}
        className="undo-button"
      >
        {isReverting ? 'Undoing...' : `Undo (${remainingTime}s)`}
      </button>
    </div>
  );
}
```

### Vue Component Example

```vue
<template>
  <div v-if="remainingTime > 0" class="meal-revert-toast">
    <span>Meal logged successfully!</span>
    <button
      @click="handleRevert"
      :disabled="isReverting"
      class="undo-button"
    >
      {{ isReverting ? 'Undoing...' : `Undo (${remainingTime}s)` }}
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

const props = defineProps({
  meal: Object,
});

const emit = defineEmits(['revert', 'dismiss']);

const REVERT_WINDOW_SECONDS = 20;
const remainingTime = ref(REVERT_WINDOW_SECONDS);
const isReverting = ref(false);
let timer = null;

const createdAt = computed(() => 
  new Date(props.meal.llm_analysis?.created_at || props.meal.created_at)
);

onMounted(() => {
  timer = setInterval(() => {
    const elapsed = (Date.now() - createdAt.value.getTime()) / 1000;
    remainingTime.value = Math.max(0, Math.ceil(REVERT_WINDOW_SECONDS - elapsed));
    
    if (remainingTime.value <= 0) {
      clearInterval(timer);
      emit('dismiss');
    }
  }, 100);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const handleRevert = async () => {
  if (remainingTime.value <= 0) return;
  
  const confirmed = confirm(
    'Are you sure you want to undo this meal? This cannot be undone.'
  );
  if (!confirmed) return;
  
  isReverting.value = true;
  emit('revert', props.meal.id);
};
</script>
```

---

## User Flow

### Meal Revert Flow (Quick Undo)

1. User records a meal → Analysis completes successfully
2. Toast notification appears: "Meal logged! [Undo (20s)]"
3. Countdown timer decrements every second
4. **If user taps "Undo" within 20 seconds:**
   - Confirmation dialog: "Are you sure? This cannot be undone."
   - User confirms → API call to revert
   - Success → Toast shows "Meal removed", dashboard/stats refresh
5. **If 20 seconds pass without action:**
   - Toast auto-dismisses
   - Revert is no longer available

---

## State Management

### Recommended App State Addition

```javascript
{
  // ... existing state
  ui: {
    isRecording: boolean,
    isUploading: boolean,
    // Add revert tracking
    recentMeal: {
      id: number | null,
      createdAt: Date | null,
      canRevert: boolean
    }
  }
}
```

### State Actions

```javascript
// After successful meal creation
setRecentMeal({
  id: response.data.meal.id,
  createdAt: new Date(response.data.llm_analysis?.created_at),
  canRevert: true
});

// After successful revert or timeout
clearRecentMeal();
```

---

## UI/UX Recommendations

### Toast Notification Design

- **Position**: Bottom of screen or top-right corner
- **Style**: Subtle but noticeable, not blocking main content
- **Animation**: Slide in on appear, fade out on dismiss

### Countdown Display

- Show remaining seconds: "Undo (15s)"
- Consider color change as time runs low (e.g., yellow at 10s, red at 5s)
- Optional: progress bar showing time remaining

### Confirmation Dialog

Always confirm before reverting:
- Title: "Undo Meal?"
- Message: "This will permanently remove the meal and cannot be undone."
- Buttons: "Cancel" / "Undo Meal"

### After Revert

- Show brief success message: "Meal has been removed"
- Automatically refresh dashboard/statistics
- Clear the revert toast

---

## Error Handling

### Window Expired Error

If user clicks "Undo" but the window has just expired:

```javascript
if (error === 'Revert window has expired...') {
  showNotification('Sorry, the undo window has expired.', 'warning');
  clearRecentMeal();
}
```

### Network Errors

```javascript
if (networkError) {
  showNotification('Failed to undo meal. Please try again.', 'error');
  // Keep the toast visible if time remains
}
```

---

## Important Notes

1. **Reverted meals are permanently excluded** from all meal lists and statistics
2. **Users cannot unrevert** a meal - this action is final
3. **Privacy protection**: User's voice transcription and AI analysis text are cleared on revert
4. **Usage tracking preserved**: Token counts and API costs remain for billing/analytics
5. **Time reference**: The 20-second window starts from the LLM analysis completion time, not the upload time

---

## Related Documentation

- [Frontend Development Guide](frontend_development_guide.md) - Main API reference
- [API Documentation](api/openapi.yaml) - Full OpenAPI specification
