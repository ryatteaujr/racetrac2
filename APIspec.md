# Picker Ticker API Contract

The picker wallboard loads live JSON from the ColdFusion picker ticker endpoint.

## Endpoint

```http
GET /pickerticker.cfm
```

Production endpoint:

```http
GET https://etoolbox1.net/csv/ai/pickerticker.cfm
```

Default behavior:

- `groupId` defaults to `mezz`.
- `warehouseDate` defaults to today's warehouse date.
- The shift window defaults to `03:00` through `22:01`.

Supported `groupId` values:

- `mezz`
- `repack`
- `bulk`

Example requests:

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

## Response Shape

```json
{
  "summary": {
    "boardTitle": "Picker Performance",
    "groupName": "Mezz",
    "warehouseDate": "2026-04-30",
    "shiftStart": "03:00",
    "shiftEnd": "22:01",
    "goalPickRate": 175,
    "refreshCadenceSeconds": 30
  },
  "departments": [],
  "pickers": [
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
  ],
  "races": {
    "liveRace": [
      { "employeeId": 104, "displayName": "Amarion H.", "rank": 1, "value": 218 }
    ],
    "shiftRace": [
      { "employeeId": 104, "displayName": "Amarion H.", "rank": 1, "value": 201 }
    ],
    "mostImproved": [
      { "employeeId": 104, "displayName": "Amarion H.", "rank": 1, "value": 12 }
    ]
  }
}
```

## Wallboard Mapping

| Wallboard Need | API Field |
| --- | --- |
| Board title | `summary.boardTitle` |
| Group name | `summary.groupName` |
| Warehouse date | `summary.warehouseDate` |
| Shift start | `summary.shiftStart` |
| Shift end | `summary.shiftEnd` |
| Goal pick rate | `summary.goalPickRate` |
| Refresh interval | `summary.refreshCadenceSeconds` |
| Picker list | `pickers` |
| Live Race | `races.liveRace` |
| Shift Race | `races.shiftRace` |
| Most Improved | `races.mostImproved` |

## Client Rules

- Fetch JSON from `/pickerticker.cfm` with `Accept: application/json`.
- Use `summary.refreshCadenceSeconds` for the next refresh; fall back to 30 seconds.
- If the API returns an `error` object, show its message and retry on the next refresh interval.
- Do not calculate group membership in the website. The API applies the `DPTINFP` group rules.
- The production display should be configured with one `groupId`; the local group buttons are only useful for testing.
