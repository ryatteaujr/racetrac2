import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

async function readProjectFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

async function loadDashboard(overrides = {}) {
  const source = await readProjectFile("app.js");
  const context = {
    window: {},
    document: {
      addEventListener() {},
      getElementById() {
        return null;
      },
    },
    setInterval() {},
    clearInterval() {},
    fetch: overrides.fetch,
    URLSearchParams,
  };
  Object.assign(context, overrides);
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.window.PickerDashboard;
}

function pickerBoardPayload() {
  return {
    summary: {
      boardTitle: "Picker Performance",
      groupName: "Repack",
      warehouseDate: "2026-04-30",
      shiftStart: "03:00",
      shiftEnd: "22:01",
      goalPickRate: 180,
      refreshCadenceSeconds: 45,
    },
    departments: [],
    pickers: [
      {
        employeeId: 104,
        displayName: "Amarion H.",
        status: "active",
        currentHourLinesPicked: 218,
        previousHourLinesPicked: 206,
        shiftLinesPicked: 1206,
        currentHourLPH: 218,
        previousHourLPH: 206,
        shiftLPH: 201,
        improvementLPH: 12,
        lastPickStartedAt: "2026-04-30T15:48:12-04:00",
        lastPickEndedAt: "2026-04-30T15:49:02-04:00",
      },
      {
        employeeId: 105,
        displayName: "Austin T.",
        status: "active",
        currentHourLinesPicked: 199,
        previousHourLinesPicked: 210,
        shiftLinesPicked: 1120,
        currentHourLPH: 199,
        previousHourLPH: 210,
        shiftLPH: 196,
        improvementLPH: -11,
      },
    ],
    races: {
      liveRace: [
        { employeeId: 104, displayName: "Amarion H.", rank: 1, value: 218 },
        { employeeId: 105, displayName: "Austin T.", rank: 2, value: 199 },
      ],
      shiftRace: [
        { employeeId: 104, displayName: "Amarion H.", rank: 1, value: 201 },
        { employeeId: 105, displayName: "Austin T.", rank: 2, value: 196 },
      ],
      mostImproved: [
        { employeeId: 104, displayName: "Amarion H.", rank: 1, value: 12 },
        { employeeId: 105, displayName: "Austin T.", rank: 2, value: -11 },
      ],
    },
  };
}

test("ships the picker wallboard as static files", async () => {
  const html = await readProjectFile("index.html");
  const css = await readProjectFile("styles.css");
  const script = await readProjectFile("app.js");

  assert.match(html, /Picker Performance Wallboard/);
  assert.match(html, /class="brand-logo"/);
  assert.match(html, /Thunderdome-mez\.png/);
  assert.match(html, /id="boardTitleArt"/);
  assert.doesNotMatch(html, /class="timeline"/);
  assert.doesNotMatch(html, /id="groupSwitcher"/);
  assert.doesNotMatch(html, /id="timelineLabel"/);
  assert.doesNotMatch(html, /id="playBtn"/);
  assert.doesNotMatch(html, /id="timelineSlider"/);
  assert.doesNotMatch(html, /proposal-reference/);
  assert.doesNotMatch(html, /data-group-id=/);
  assert.doesNotMatch(html, /https:\/\/etoolbox1\.net\/csv\/ai\/pickerticker\.cfm/);
  assert.match(html, /alt="Group performance board"/);
  assert.doesNotMatch(html, /<h1>Thunderdome-Mez<\/h1>/);
  assert.doesNotMatch(html, /Thunder-mez Picker Performance/);
  assert.match(css, /\.title-art/);
  assert.doesNotMatch(css, /\.board-header img/);
  assert.match(css, /\.brand-logo/);
  assert.match(html, /LIVE RACE - CURRENT HOUR/);
  assert.match(html, /SHIFT RACE - TOTAL TODAY/);
  assert.doesNotMatch(html, /assets\/picker-board-proposal\.png/);
  assert.match(css, /grid-template-areas/);
  assert.match(css, /1920px/);
  assert.match(css, /"live live shift shift"/);
  assert.match(css, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.doesNotMatch(css, /"reference reference reference"/);
  assert.match(css, /grid-template-rows: 38px 36px minmax\(0, 1fr\)/);
  assert.match(css, /min-height: 18px/);
  assert.match(css, /gap: 2px/);
  assert.match(css, /\.race-head[\s\S]*gap: 12px/);
  assert.match(css, /max-width: 70px/);
  assert.match(script, /\/pickerticker\.cfm/);
  assert.match(script, /fetch\(/);
  assert.doesNotMatch(script, /pickerSeed/);
  assert.doesNotMatch(script, /makeSnapshot/);
  assert.doesNotMatch(script, /function setActiveGroup/);
  assert.doesNotMatch(script, /renderGroupSwitcher/);
  assert.doesNotMatch(script, /timelineLabel/);
  assert.match(script, /setAttribute\("alt", summary\.groupName\)/);
  assert.match(script, /document\.title = `\$\{summary\.groupName\} \$\{boardTitle\}`/);
  assert.match(script, /refreshCadenceSeconds/);
  assert.match(script, /pickers\.slice\(0, 8\)/);
  assert.match(css, /grid-template-columns: 72px 200px minmax\(160px, 1fr\) 70px/);
  assert.match(css, /\.race-head span:nth-child\(3\)/);
  assert.match(css, /left: 50%/);
});

test("calculates dashboard metrics from active pickers", async () => {
  const dashboard = await loadDashboard();
  const board = pickerBoardPayload();
  const metrics = dashboard.calculateMetrics(board);
  const active = board.pickers.filter((picker) => picker.status === "active");

  assert.equal(metrics.goalPickRate, 180);
  assert.equal(metrics.activePickerCount, active.length);
  assert.equal(metrics.topPickRate, Math.max(...active.map((picker) => picker.currentHourLPH)));
  assert.equal(metrics.liveRace[0].value, 218);
  assert.equal(metrics.shiftRace[0].value, 201);
  assert.equal(metrics.improved[0].value, 12);
  assert.equal(metrics.refreshDelayMs, 45000);
});

test("race panels have enough active pickers for top 8 leaderboards", async () => {
  const dashboard = await loadDashboard();
  const board = pickerBoardPayload();
  board.pickers.push(...Array.from({ length: 8 }, (_, index) => ({
    employeeId: 200 + index,
    displayName: `Picker ${index}`,
    status: "active",
    currentHourLPH: 120 + index,
    previousHourLPH: 110 + index,
    shiftLPH: 130 + index,
    improvementLPH: 10,
  })));
  board.races.liveRace.push(...board.pickers.slice(2).map((picker, index) => ({
    employeeId: picker.employeeId,
    displayName: picker.displayName,
    rank: index + 3,
    value: picker.currentHourLPH,
  })));
  board.races.shiftRace.push(...board.pickers.slice(2).map((picker, index) => ({
    employeeId: picker.employeeId,
    displayName: picker.displayName,
    rank: index + 3,
    value: picker.shiftLPH,
  })));
  const metrics = dashboard.calculateMetrics(board);

  assert.equal(metrics.activePickerCount, 10);
  assert.equal(metrics.liveRace.slice(0, 8).length, 8);
  assert.equal(metrics.shiftRace.slice(0, 8).length, 8);
});

test("loads picker ticker JSON for the selected group and warehouse date", async () => {
  const calls = [];
  const dashboard = await loadDashboard({
    fetch: async (url, options) => {
      calls.push({ url: String(url), options });
      return {
        ok: true,
        json: async () => pickerBoardPayload(),
      };
    },
  });

  const board = await dashboard.loadPickerBoard("repack", "2026-04-30");

  assert.equal(board.summary.groupName, "Repack");
  assert.match(calls[0].url, /^\/pickerticker\.cfm\?/);
  assert.match(calls[0].url, /groupId=repack/);
  assert.match(calls[0].url, /warehouseDate=2026-04-30/);
  assert.equal(calls[0].options.headers.Accept, "application/json");
});

test("loads demo data from raw GitHub when rendered through htmlpreview", async () => {
  const calls = [];
  const dashboard = await loadDashboard({
    window: {
      location: {
        hostname: "htmlpreview.github.io",
      },
    },
    fetch: async (url) => {
      calls.push(String(url));
      return {
        ok: true,
        json: async () => pickerBoardPayload(),
      };
    },
  });

  await dashboard.loadPickerBoard("mezz", "2026-04-30");

  assert.match(calls[0], /^https:\/\/raw\.githubusercontent\.com\/ryatteaujr\/racetrac2\/main\/pickerticker\.cfm\?/);
  assert.match(calls[0], /groupId=mezz/);
});

test("throws API error messages so the wallboard can retry on the next refresh", async () => {
  const dashboard = await loadDashboard({
    fetch: async () => ({
      ok: false,
      json: async () => ({ error: { message: "Warehouse date is invalid." } }),
    }),
  });

  await assert.rejects(
    () => dashboard.loadPickerBoard("bulk", "2026-04-30"),
    /Warehouse date is invalid\./,
  );
});

test("includes a local picker ticker fixture for browser testing", async () => {
  const fixture = JSON.parse(await readProjectFile("pickerticker.cfm"));

  assert.equal(fixture.summary.groupName, "Mezz");
  assert.equal(fixture.summary.refreshCadenceSeconds, 30);
  assert.ok(Array.isArray(fixture.pickers));
  assert.ok(fixture.pickers.length >= 8);
  assert.ok(Array.isArray(fixture.races.liveRace));
  assert.ok(Array.isArray(fixture.races.shiftRace));
  assert.ok(Array.isArray(fixture.races.mostImproved));
  assert.equal(fixture.races.liveRace[0].rank, 1);
  assert.equal(typeof fixture.races.liveRace[0].value, "number");
});

test("documents the data provider API contract", async () => {
  const contract = await readProjectFile("APIspec.md");

  assert.match(contract, /GET \/pickerticker\.cfm/);
  assert.match(contract, /https:\/\/etoolbox1\.net\/csv\/ai\/pickerticker\.cfm/);
  assert.match(contract, /groupId=mezz/);
  assert.match(contract, /Supported `groupId` values/);
  assert.match(contract, /`mezz`/);
  assert.match(contract, /`repack`/);
  assert.match(contract, /`bulk`/);
  assert.match(contract, /refreshCadenceSeconds/);
  assert.match(contract, /races\.liveRace/);
  assert.match(contract, /currentHourLPH/);
  assert.match(contract, /previousHourLPH/);
  assert.doesNotMatch(contract, /GET \/api\/picker-board\/groups/);
  assert.doesNotMatch(contract, /shipping-dock/i);
  assert.doesNotMatch(contract, /Shipping Dock/i);
});
