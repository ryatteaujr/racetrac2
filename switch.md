# Wallboard Switch to Picker Ticker API

Update the wallboard website to stop using demo picker data and load live JSON from the ColdFusion endpoint.

## Endpoint

Use:

```http
GET /pickerticker.cfm
```

Production endpoint:

```http
GET https://etoolbox1.net/csv/ai/pickerticker.cfm
```

Default behavior:

- `groupId` defaults to `mezz`
- `warehouseDate` defaults to today's warehouse date
- shift window defaults to `03:00` through `22:01`

Optional query parameters:

```http
GET /pickerticker.cfm?groupId=mezz&warehouseDate=2026-04-30
GET /pickerticker.cfm?groupId=repack&warehouseDate=2026-04-30
GET /pickerticker.cfm?groupId=bulk&warehouseDate=2026-04-30
```

Production examples:

```http
GET https://etoolbox1.net/csv/ai/pickerticker.cfm?groupId=mezz&warehouseDate=2026-04-30
GET https://etoolbox1.net/csv/ai/pickerticker.cfm?groupId=repack&warehouseDate=2026-04-30
GET https://etoolbox1.net/csv/ai/pickerticker.cfm?groupId=bulk&warehouseDate=2026-04-30
```

Supported `groupId` values:

- `mezz`
- `repack`
- `bulk`

## Response Shape

The API returns JSON with these top-level keys:

```json
{
  "summary": {},
  "departments": [],
  "pickers": [],
  "races": {}
}
```

Use `summary.refreshCadenceSeconds` for the refresh interval. The current default is `30`.

## Wallboard Mapping

Use these fields in place of demo data:

| Wallboard Need | API Field |
| --- | --- |
| Board title | `summary.boardTitle` |
| Group name | `summary.groupName` |
| Warehouse date | `summary.warehouseDate` |
| Shift start | `summary.shiftStart` |
| Shift end | `summary.shiftEnd` |
| Goal pick rate | `summary.goalPickRate` |
| Picker list | `pickers` |
| Live Race | `races.liveRace` |
| Shift Race | `races.shiftRace` |
| Most Improved | `races.mostImproved` |

Picker objects include:

```json
{
  "employeeId": 104,
  "displayName": "Amarion H.",
  "status": "active",
  "currentHourLinesPicked": 218,
  "previousHourLinesPicked": 206,
  "shiftLinesPicked": 1206,
  "currentHourLPH": 218,
  "previousHourLPH": 206,
  "shiftLPH": 201,
  "improvementLPH": 12,
  "lastPickStartedAt": "2026-04-30T15:48:12-04:00",
  "lastPickEndedAt": "2026-04-30T15:49:02-04:00"
}
```

Race rows include:

```json
{
  "employeeId": 104,
  "displayName": "Amarion H.",
  "rank": 1,
  "value": 218
}
```

## Implementation Notes

- Replace the static/demo data generator with a fetch call to `/pickerticker.cfm`.
- Keep the current demo group buttons only if the site still needs local testing controls.
- For production, configure the display with one `groupId`.
- If the API returns an `error` object, show the message and retry on the next refresh interval.
- Do not calculate group membership in the website. The API already applies the `DPTINFP` group rules.

## Example Fetch

```javascript
async function loadPickerBoard(groupId = "mezz") {
  const params = new URLSearchParams({
    groupId,
    warehouseDate: new Date().toISOString().slice(0, 10)
  });

  const response = await fetch(`https://etoolbox1.net/csv/ai/pickerticker.cfm?${params.toString()}`, {
    headers: { Accept: "application/json" }
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || "Unable to load picker board data.");
  }

  return data;
}
```
