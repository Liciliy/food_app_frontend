# Frontend Nutrition Reports Guide

This guide covers the backend contract added for staged meal analysis,
micronutrient storage, user health context, and nutrition reports.

## Summary

The backend now:
- uses a two-stage meal analysis pipeline
- stores meal and item consumed amounts in grams
- stores meal-level and item-level micronutrients as normalized rows
- exposes those micronutrients through existing meal GET responses
- exposes user health context fields through the existing profile endpoints
- provides daily, weekly, and monthly report endpoints with rule-based flags and an LLM summary

Existing frontend flows remain backward compatible because the previous fields are unchanged. The new fields are additive.

## Meal Response Additions

Existing meal endpoints:
- `GET /api/food/meals/`
- `GET /api/food/meals/{id}/`
- upload response from `POST /api/food/voice-inputs/upload/`

New additive fields on a meal:
- `meal_type` now may be `water` or `drinks`
- `consumed_weight_grams`: estimated consumed amount in grams for the whole meal
- `micronutrients`: array of meal-level nutrients

Example meal-level nutrient entry:
```json
{
  "nutrient_code": "iron",
  "nutrient_name": "Iron",
  "amount": "4.500",
  "unit": "mg",
  "food_item": null
}
```

New additive fields on each item:
- `consumed_weight_grams`: estimated consumed amount in grams for the item
- `micronutrients`: array of item-level nutrient rows

## Profile API Additions

Existing endpoints:
- `GET /api/auth/profile/`
- `PUT /api/auth/profile/update/`
- `PATCH /api/auth/profile/update/`
- `POST /api/auth/profile/health-context/voice/`

New fields:
- `health_context`: free text, written by the user
- `health_context_applied_at`: date string in `YYYY-MM-DD`
- `health_context_structured`: backend-generated structured JSON from the free text

The user can update health context in two ways:
- text via `PUT/PATCH /api/auth/profile/update/`
- voice via `POST /api/auth/profile/health-context/voice/`

Voice upload request:
- multipart form field `audio` is required
- multipart form field `health_context_applied_at` is optional

Voice upload response includes:
- `transcription`: transcript text and metadata
- `profile`: updated profile payload

Example update payload:
```json
{
  "health_context": "I am pregnant and vegetarian.",
  "health_context_applied_at": "2026-06-01"
}
```

Example structured response fragment:
```json
{
  "health_context": "I am pregnant and vegetarian.",
  "health_context_applied_at": "2026-06-01",
  "health_context_structured": {
    "profile_summary": "Pregnant vegetarian",
    "life_stage": ["pregnant"],
    "dietary_patterns": ["vegetarian"],
    "health_focus": ["iron_support"],
    "avoidances": [],
    "notes": ["monitor iron intake"]
  }
}
```

## Stats Endpoint Additions

Existing stats endpoints now also return `nutrient_totals`:
- `GET /api/food/meals/stats/daily/`
- `GET /api/food/meals/stats/weekly/`
- `GET /api/food/meals/stats/monthly/`

Example:
```json
{
  "nutrient_totals": {
    "iron": {
      "name": "Iron",
      "unit": "mg",
      "amount": 12.5
    },
    "vitamin_c": {
      "name": "Vitamin C",
      "unit": "mg",
      "amount": 88.0
    }
  }
}
```

## New Report Endpoints

New endpoints:
- `GET /api/food/meals/reports/daily/`
- `GET /api/food/meals/reports/weekly/`
- `GET /api/food/meals/reports/monthly/`
- `GET /api/food/meals/reports/generated/`
- `GET /api/food/meals/reports/generated/{id}/`
- `POST /api/food/meals/reports/generated/{id}/mark-read/`

Generated reports collection behavior:
- `GET /api/food/meals/reports/generated/` returns paginated report summaries only
- supports `unread_only=true`
- supports `page` and `page_size`
- list items do not include the full `report_payload`
- list items include `report_preview` when the backend can extract one

Generated report detail behavior:
- `GET /api/food/meals/reports/generated/{id}/` returns the full report payload
- users can only access their own reports

Read-state behavior:
- `POST /api/food/meals/reports/generated/{id}/mark-read/` marks one owned report as read
- frontend should call this after the user successfully opens an unread report
- frontend should not mark reports as read merely because the list was fetched

Period filters:
- daily: optional `date=YYYY-MM-DD`
- weekly: optional `week=YYYY-WNN`
- monthly: optional `month=YYYY-MM`

Shared response shape:
- `period` metadata such as `date`, `week_start`, `week_end`, `month`, `days_in_month`
- `meal_count`
- `total_calories`
- `macros`
- `meal_type_breakdown`
- `nutrient_totals`
- `health_context`
- `health_context_applied_at`
- `health_context_structured`
- `report`

`report` contains:
- `flags`: rule-based findings from nutrient totals and profile context
- `llm_summary`: short narrative summary
- `disclaimer`: non-diagnostic disclaimer

Example `report` fragment:
```json
{
  "report": {
    "flags": [
      {
        "severity": "high",
        "type": "low_intake",
        "nutrient_code": "iron",
        "nutrient_name": "Iron",
        "average_daily_amount": 4.2,
        "unit": "mg",
        "target_daily_amount": 18.0,
        "message": "Average intake appears low for Iron.",
        "recommendation": "Consider increasing food sources rich in Iron."
      }
    ],
    "llm_summary": {
      "summary": "Iron intake may be low this week.",
      "risks": ["low iron"],
      "recommendations": ["Add iron-rich foods"],
      "follow_up": []
    },
    "disclaimer": "This report is informational only and does not diagnose medical conditions."
  }
}
```

## Frontend Update Checklist

1. Accept `water` and `drinks` as valid `meal_type` values.
2. Render `consumed_weight_grams` when available for meals and items.
3. Keep current meal screens working even if `micronutrients` is ignored initially.
4. Add profile form inputs for `health_context` and `health_context_applied_at`.
5. Add a voice option for health context updates using `POST /api/auth/profile/health-context/voice/`.
6. Decide whether `health_context_structured` is visible, hidden, or used only for debug/admin UI.
7. Add a reports list UI backed by `GET /api/food/meals/reports/generated/` and a detail view backed by `GET /api/food/meals/reports/generated/{id}/`.
8. Render `report.flags` as structured UI and `report.llm_summary` as narrative text.
9. Treat all new fields as optional and nullable.

## Suggested Frontend Phasing

Phase 1:
- Support new profile fields
- Support voice health context upload
- Accept new meal types
- Ignore micronutrients visually if needed

Phase 2:
- Add micronutrient display on meal details
- Add period report screens

Phase 3:
- Add profile editing UX for ongoing health-context updates and reminders
