(function () {
  const DEFAULT_GROUP_ID = "mezz";
  const DEFAULT_REFRESH_SECONDS = 30;
  const PICKER_TICKER_ENDPOINT = window.PICKER_TICKER_ENDPOINT || "/pickerticker.cfm";
  const groups = [
    { id: "mezz", name: "Mezz" },
    { id: "repack", name: "Repack" },
    { id: "bulk", name: "Bulk" },
  ];

  let activeGroupId = window.PICKER_TICKER_GROUP_ID || DEFAULT_GROUP_ID;
  let refreshTimer = null;

  function warehouseDateToday() {
    return new Date().toISOString().slice(0, 10);
  }

  function pickerName(picker) {
    return picker.displayName || picker.name || "Unknown";
  }

  function raceName(row) {
    return row.displayName || row.name || "Unknown";
  }

  function normalizeRaceRow(row, index) {
    return {
      ...row,
      rank: row.rank || index + 1,
      name: raceName(row),
      value: Number(row.value || 0),
    };
  }

  function normalizeRace(rows) {
    return Array.isArray(rows) ? rows.map(normalizeRaceRow) : [];
  }

  function raceFromPickers(pickers, field) {
    return [...pickers]
      .sort((a, b) => Number(b[field] || 0) - Number(a[field] || 0))
      .map((picker, index) => ({
        employeeId: picker.employeeId,
        displayName: pickerName(picker),
        name: pickerName(picker),
        rank: index + 1,
        value: Number(picker[field] || 0),
      }));
  }

  function improvedFromPickers(pickers) {
    return [...pickers]
      .map((picker) => ({
        employeeId: picker.employeeId,
        displayName: pickerName(picker),
        name: pickerName(picker),
        value: Number(picker.improvementLPH ?? Number(picker.currentHourLPH || 0) - Number(picker.previousHourLPH || 0)),
      }))
      .sort((a, b) => b.value - a.value)
      .map((row, index) => ({ ...row, rank: index + 1 }));
  }

  async function loadPickerBoard(groupId = DEFAULT_GROUP_ID, warehouseDate = warehouseDateToday()) {
    const params = new URLSearchParams({ groupId, warehouseDate });
    const separator = PICKER_TICKER_ENDPOINT.includes("?") ? "&" : "?";
    const response = await fetch(`${PICKER_TICKER_ENDPOINT}${separator}${params.toString()}`, {
      headers: { Accept: "application/json" },
    });
    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error?.message || "Unable to load picker board data.");
    }

    return data;
  }

  function calculateMetrics(board) {
    const summary = board.summary || {};
    const activePickers = (board.pickers || []).filter((picker) => picker.status === "active");
    const averagePickRate = activePickers.length
      ? Math.round(activePickers.reduce((sum, picker) => sum + Number(picker.shiftLPH || 0), 0) / activePickers.length)
      : 0;
    const liveRace = normalizeRace(board.races?.liveRace).length
      ? normalizeRace(board.races.liveRace)
      : raceFromPickers(activePickers, "currentHourLPH");
    const shiftRace = normalizeRace(board.races?.shiftRace).length
      ? normalizeRace(board.races.shiftRace)
      : raceFromPickers(activePickers, "shiftLPH");
    const improved = normalizeRace(board.races?.mostImproved).length
      ? normalizeRace(board.races.mostImproved)
      : improvedFromPickers(activePickers);
    const topPicker = liveRace[0] || null;
    const onFirePicker = activePickers.find((picker) => Number(picker.currentHourLPH || 0) >= Number(summary.goalPickRate || 175));

    return {
      averagePickRate,
      goalPickRate: Number(summary.goalPickRate || 175),
      topPickRate: topPicker ? topPicker.value : 0,
      activePickerCount: activePickers.length,
      remainingShiftTime: formatRemaining(summary.shiftEnd),
      liveRace,
      shiftRace,
      topCards: shiftRace.slice(0, 3),
      improved: improved.slice(0, 3),
      onFirePicker,
      refreshDelayMs: Number(summary.refreshCadenceSeconds || DEFAULT_REFRESH_SECONDS) * 1000,
    };
  }

  function formatWarehouseDate(dateText) {
    if (!dateText) return "";
    const date = new Date(`${dateText}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateText;
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
  }

  function formatRemaining(shiftEnd) {
    if (!shiftEnd) return "00:00";
    const end = shiftEnd.includes("T") ? new Date(shiftEnd) : new Date(`${warehouseDateToday()}T${shiftEnd}:00`);
    const minutes = Math.max(0, Math.round((end.getTime() - Date.now()) / 60000));
    const hours = Math.floor(minutes / 60);
    return `${String(hours).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  }

  function formatClockTime() {
    return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function initials(name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .replace(".", "")
      .slice(0, 2)
      .toUpperCase();
  }

  function barWidth(value) {
    return Math.min(100, Math.round((Number(value || 0) / 225) * 100));
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function renderRace(id, pickers) {
    const container = document.getElementById(id);
    if (!container) return;

    container.innerHTML = pickers.slice(0, 8)
      .map((picker, index) => `
        <div class="race-row">
          <span class="rank">${picker.rank || index + 1}</span>
          <span class="picker"><span class="badge">${initials(picker.name)}</span><span class="name">${picker.name}</span></span>
          <span class="bar"><span style="width:${barWidth(picker.value)}%"></span></span>
          <strong>${picker.value}</strong>
        </div>
      `)
      .join("");
  }

  function renderTopCards(pickers) {
    const container = document.getElementById("topCards");
    if (!container) return;

    container.innerHTML = pickers
      .map((picker, index) => `
        <article class="top-card">
          <span>${picker.rank || index + 1}</span>
          <strong>${picker.name}</strong>
          <b>${picker.value}</b>
          <small>LPH Avg</small>
        </article>
      `)
      .join("");
  }

  function renderImproved(pickers) {
    const list = document.getElementById("improvedList");
    if (!list) return;

    list.innerHTML = pickers
      .map((picker, index) => `<li><span>${picker.rank || index + 1}</span><span>${picker.name}</span><strong>${picker.value >= 0 ? "+" : ""}${picker.value}</strong></li>`)
      .join("");
  }

  function renderError(message) {
    document.title = `API Error - ${message}`;
  }

  function renderBoard(board) {
    const metrics = calculateMetrics(board);
    const summary = board.summary || {};
    const titleArt = document.getElementById("boardTitleArt");
    const boardTitle = summary.boardTitle || "Picker Performance";

    document.title = `${summary.groupName} ${boardTitle}`;
    if (titleArt) titleArt.setAttribute("alt", summary.groupName);
    setText("snapshotTime", formatClockTime());
    setText("warehouseDay", formatWarehouseDate(summary.warehouseDate));
    setText("averagePickRate", metrics.averagePickRate);
    setText("goalPickRate", metrics.goalPickRate);
    setText("topPickRate", metrics.topPickRate);
    setText("topPickerCaption", `${(metrics.liveRace[0]?.name || "No picker").toUpperCase()} - LINES / HOUR`);
    setText("activePickerCount", metrics.activePickerCount);
    setText("remainingShiftTime", metrics.remainingShiftTime);
    setText("onFireName", metrics.onFirePicker ? pickerName(metrics.onFirePicker) : "No eligible picker");
    setText("onFireDetail", metrics.onFirePicker ? `${metrics.onFirePicker.currentHourLPH} LPH` : "NO DATA");
    renderRace("liveRace", metrics.liveRace);
    renderRace("shiftRace", metrics.shiftRace);
    renderTopCards(metrics.topCards);
    renderImproved(metrics.improved);

    return metrics.refreshDelayMs;
  }

  async function refreshBoard() {
    let refreshDelayMs = DEFAULT_REFRESH_SECONDS * 1000;
    try {
      const board = await loadPickerBoard(activeGroupId);
      refreshDelayMs = renderBoard(board);
    } catch (error) {
      renderError(error.message);
    } finally {
      refreshTimer = setTimeout(refreshBoard, refreshDelayMs);
    }
  }

  function init() {
    refreshBoard();
  }

  window.PickerDashboard = {
    DEFAULT_GROUP_ID,
    DEFAULT_REFRESH_SECONDS,
    PICKER_TICKER_ENDPOINT,
    groups,
    loadPickerBoard,
    calculateMetrics,
    formatRemaining,
  };
  document.addEventListener("DOMContentLoaded", init);
})();
