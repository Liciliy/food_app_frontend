# Meal Delete Feature - Frontend Development Guide

This document is a continuation of the [Frontend Development Guide](frontend_development_guide.md) and describes the meal delete functionality.

## Overview

The meal delete feature allows users to delete a meal within a limited time window after creation. Unlike the revert feature (20 seconds), the delete window is extended to **3 hours**, giving users more time to correct mistakes or remove incorrectly logged meals.

**Key Characteristics:**
- Available within **3 hours** (10,800 seconds) after meal creation
- Permanently removes the meal from all statistics
- Redacts sensitive user data for privacy
- Cannot be undone (no "undelete" capability)
- Cannot delete meals that have already been reverted

---

## API Endpoint

### Delete Meal

- **Endpoint**: `DELETE /api/food/meals/{id}/delete/`
- **Purpose**: Delete a meal within the allowed time window
- **Headers**: `Authorization: Token <token>`
- **Time Window**: **3 hours** (10,800 seconds) after meal creation

### What Happens on Delete

1. **Food items deleted**: All food items associated with the meal are permanently deleted
2. **Meal content redacted**: Description, cuisine, portion size, calories, macros, and notes are cleared
3. **Analysis records redacted**: Sensitive text is cleared from analysis records:
   - Voice transcription text
   - LLM prompts and responses
   - Time extraction input and output
4. **Meal marked as deleted**: Excluded from all meal lists and statistics
5. **Metadata preserved**: Token counts, API costs, latencies, meal type, and timestamps remain for usage tracking

### Success Response (200 OK)

```json
{
  "message": "Meal successfully deleted.",
  "meal_id": 123,
  "voice_input_id": 456,
  "llm_analysis_id": 789,
  "time_extraction_id": 101,
  "food_items_deleted": 3,
  "deleted_at": "2026-01-25T15:30:45.123456Z"
}
```

### Error Responses

#### 400 Bad Request - Delete Window Expired

```json
{
  "error": "Delete window has expired. Meals can only be deleted within 3 hours of creation."
}
```

#### 400 Bad Request - Already Deleted

```json
{
  "error": "This meal has already been deleted."
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

This also occurs when attempting to delete another user's meal.

---

## Frontend Implementation Guide

### Tracking the Delete Window

After a meal is created, track the creation timestamp to determine if delete is still available:

```javascript
// Constants
const DELETE_WINDOW_SECONDS = 10800; // 3 hours

// After successful meal upload response
const mealId = response.data.meal.id;
const mealCreatedAt = new Date(response.data.meal.created_at);

// Calculate remaining time
const getRemainingDeleteTime = () => {
  const elapsed = (Date.now() - mealCreatedAt.getTime()) / 1000;
  return Math.max(0, DELETE_WINDOW_SECONDS - elapsed);
};

// Check if delete is still available
const canDelete = () => getRemainingDeleteTime() > 0;

// Format remaining time for display
const formatRemainingTime = () => {
  const remaining = getRemainingDeleteTime();
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};
```

### Delete API Call

```javascript
const deleteMeal = async (mealId, token) => {
  try {
    const response = await fetch(`/api/food/meals/${mealId}/delete/`, {
      method: 'DELETE',
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

const DELETE_WINDOW_SECONDS = 10800; // 3 hours

function MealDeleteButton({ meal, onDelete, token }) {
  const [remainingTime, setRemainingTime] = useState(DELETE_WINDOW_SECONDS);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const createdAt = new Date(meal.created_at);

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = (Date.now() - createdAt.getTime()) / 1000;
      const remaining = Math.max(0, DELETE_WINDOW_SECONDS - elapsed);
      setRemainingTime(remaining);
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [createdAt]);

  const canDelete = remainingTime > 0;

  const formatTime = () => {
    const hours = Math.floor(remainingTime / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteMeal(meal.id, token);
    setIsDeleting(false);
    setShowConfirm(false);

    if (result.success) {
      onDelete(meal.id);
    } else {
      alert(result.error);
    }
  };

  if (!canDelete) {
    return null; // Don't show delete button after window expires
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="delete-button"
        disabled={isDeleting}
      >
        Delete ({formatTime()} remaining)
      </button>

      {showConfirm && (
        <div className="confirm-dialog">
          <p>Are you sure you want to delete this meal?</p>
          <p className="warning">This action cannot be undone.</p>
          <button onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Yes, Delete'}
          </button>
          <button onClick={() => setShowConfirm(false)}>Cancel</button>
        </div>
      )}
    </>
  );
}

export default MealDeleteButton;
```

### Meal List with Delete Support

```jsx
function MealList({ meals, token, onMealDeleted }) {
  return (
    <div className="meal-list">
      {meals.map((meal) => (
        <div key={meal.id} className="meal-card">
          <h3>{meal.description}</h3>
          <p>Calories: {meal.total_calories}</p>
          <p>Created: {new Date(meal.created_at).toLocaleString()}</p>
          
          <MealDeleteButton
            meal={meal}
            token={token}
            onDelete={onMealDeleted}
          />
        </div>
      ))}
    </div>
  );
}
```

---

## UX Recommendations

### Delete vs Revert

| Feature | Revert | Delete |
|---------|--------|--------|
| Time Window | 20 seconds | 3 hours |
| Use Case | Immediate undo | Later correction |
| UI Location | Toast notification | Meal detail/list |
| Confirmation | Optional | Recommended |

### Best Practices

1. **Show remaining time**: Display how much time is left to delete the meal
2. **Require confirmation**: Use a confirmation dialog before deleting
3. **Provide feedback**: Show success/error messages clearly
4. **Update UI immediately**: Remove deleted meal from list without refresh
5. **Handle edge cases**: Gracefully handle expired windows

### Error Handling

```javascript
const handleDeleteError = (error) => {
  switch (error) {
    case 'Delete window has expired. Meals can only be deleted within 3 hours of creation.':
      // Refresh meal list, hide delete button
      refreshMeals();
      showToast('Delete window has expired');
      break;
    case 'This meal has already been deleted.':
      // Remove from UI
      removeMealFromList(mealId);
      break;
    case 'This meal has already been reverted.':
      // Remove from UI
      removeMealFromList(mealId);
      break;
    case 'Meal not found.':
      // Refresh meal list
      refreshMeals();
      break;
    default:
      showToast('Failed to delete meal. Please try again.');
  }
};
```

---

## Related Documentation

- [Frontend Development Guide](frontend_development_guide.md) - Main API reference
- [Meal Revert Guide](frontend_meal_revert_guide.md) - Quick undo feature (20 seconds)
