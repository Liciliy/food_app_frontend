# Frontend Latest Updates Handoff

This document is the short frontend handoff for the latest backend changes.

Use this file when implementing UI updates. For deeper payload details, also
see `docs/frontend_nutrition_reports_guide.md`.

## Main Changes

The frontend now needs to support:

1. New meal types: `water` and `drinks`
2. Extra meal and item nutrition fields
3. Health context update by both text and voice
4. Persisted periodic reports with unread/read state
5. Placeholder report states when no persisted report exists yet
6. Incomplete logging warnings for weekly and monthly reports

## Meals

Existing meal APIs still work, but responses may now contain:

- `meal_type` values `water` and `drinks`
- `consumed_weight_grams` on the meal
- `micronutrients` on the meal
- `consumed_weight_grams` on items
- `micronutrients` on items

Frontend expectations:

1. Accept `water` and `drinks` anywhere meal type is rendered or filtered.
2. Keep micronutrients hidden by default if desired.
3. Show extra nutrient details on expansion or detail view.

## Profile / Settings

The user can now update health context in two ways.

Text:

- `GET /api/auth/profile/`
- `PUT /api/auth/profile/update/`
- `PATCH /api/auth/profile/update/`

Voice:

- `POST /api/auth/profile/health-context/voice/`

Voice upload request:

- multipart field `audio` is required
- multipart field `health_context_applied_at` is optional

Frontend expectations:

1. Add text inputs for `health_context` and `health_context_applied_at`.
2. Add a voice upload option for health context.
3. Treat `health_context_structured` as backend-generated output.

## Reports

This is the most important behavior change.

Reports are now persisted periodic artifacts.
They are not generated when the user opens the page.

### What The Frontend Must Not Do

Do not treat these as generation endpoints:

- `GET /api/food/meals/reports/daily/`
- `GET /api/food/meals/reports/weekly/`
- `GET /api/food/meals/reports/monthly/`

Those endpoints now only read already-generated reports for a requested
period.

### Reports List And Detail Flow

Use these endpoints:

1. `GET /api/food/meals/reports/generated/`
2. `GET /api/food/meals/reports/generated/{id}/`
3. `POST /api/food/meals/reports/generated/{id}/mark-read/`

Recommended frontend flow:

1. Poll `GET /api/food/meals/reports/generated/?unread_only=true&page_size=10`
   every 10 minutes for unread badge state.
2. Load the reports page with `GET /api/food/meals/reports/generated/`.
3. Open one report with `GET /api/food/meals/reports/generated/{id}/`.
4. After the user actually opens the report, call
   `POST /api/food/meals/reports/generated/{id}/mark-read/`.

Do not mark a report as read just because the list was fetched.

### Period Lookup Endpoints

The period endpoints are still useful, but only as persisted lookups:

- `GET /api/food/meals/reports/daily/?date=YYYY-MM-DD`
- `GET /api/food/meals/reports/weekly/?week=YYYY-WNN`
- `GET /api/food/meals/reports/monthly/?month=YYYY-MM`

If a persisted report exists, the response contains the saved report payload
plus:

- `report_available: true`
- `report_id`
- `is_read`
- `read_at`
- `generated_at`

If a persisted report does not exist, the response contains:

- `report_available: false`
- `report_type`
- `period_key`
- `period_start`
- `period_end`
- `placeholder.reason`
- `placeholder.message`

Current placeholder reasons:

1. `not_generated_yet`
2. `no_logged_meals`

Frontend expectations:

1. Show a placeholder UI when `report_available` is `false`.
2. Do not assume a report should be generated immediately.
3. If `placeholder.reason` is `no_logged_meals`, show a no-data state.
4. If `placeholder.reason` is `not_generated_yet`, show a waiting state.

## Incomplete Logging Coverage

Persisted report payloads may now include `logging_coverage`.

Possible fields:

- `logged_days_count`
- `missing_days_count`
- `logged_dates`
- `missing_dates`
- `coverage_ratio`
- `logged_week_keys`
- `missing_week_keys`

Weekly and monthly summaries may mention that the report is less accurate if
some days or weeks were not logged.

Frontend expectations:

1. If `missing_days_count > 0`, show a small warning that not all days were
   logged.
2. If `missing_week_keys` is non-empty, show a small warning that some weeks
   were not logged.
3. Keep this warning informational, not blocking.

## Minimal Implementation Checklist

1. Support `water` and `drinks` meal types.
2. Support meal and item micronutrient fields.
3. Add text health-context editing.
4. Add voice health-context upload.
5. Build reports list from `generated/`.
6. Build report detail from `generated/{id}/`.
7. Mark reports as read only after open.
8. Handle `report_available: false` placeholders.
9. Show incomplete logging warnings when present.