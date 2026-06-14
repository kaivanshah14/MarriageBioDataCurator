const PIN = "141100";
const DATA_URL = "./data/biodata.json";
const pinDialog = document.querySelector("#pinDialog");
const pinForm = document.querySelector("#pinForm");
const pinInput = document.querySelector("#pinInput");
const pinError = document.querySelector("#pinError");
const app = document.querySelector("#app");
const refreshButton = document.querySelector("#refreshButton");
const loadStatus = document.querySelector("#loadStatus");
const lastRefresh = document.querySelector("#lastRefresh");
const progressBar = document.querySelector("#progressBar");
const resultCount = document.querySelector("#resultCount");
const duplicateCount = document.querySelector("#duplicateCount");
const biodataGrid = document.querySelector("#biodataGrid");
const emptyState = document.querySelector("#emptyState");

const filterEls = {
  birthYear: document.querySelector("#yearFilter"),
  city: document.querySelector("#cityFilter"),
  caste: document.querySelector("#casteFilter"),
  nativePlace: document.querySelector("#nativePlaceFilter"),
  religion: document.querySelector("#religionFilter"),
};

let records = [];
let duplicateTotal = 0;

pinDialog.showModal();

pinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (pinInput.value.trim() !== PIN) {
    pinError.textContent = "Incorrect PIN.";
    pinInput.focus();
    return;
  }

  pinDialog.close();
  app.hidden = false;
  refreshData();
});

refreshButton.addEventListener("click", refreshData);

Object.values(filterEls).forEach((select) => {
  select.addEventListener("change", render);
});

async function refreshData() {
  setProgress(0, "Loading biodata list...");
  try {
    const response = await fetch(`${DATA_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Unable to load ${DATA_URL}`);
    }

    const payload = await response.json();
    const deduped = dedupeRecords(payload.records || []);
    records = deduped.records;
    duplicateTotal = deduped.duplicates + Number(payload.duplicatesSkipped || 0);
    setProgress(35, `Preparing ${records.length} biodatas...`);
    populateFilters(records);
    await preloadImages(records);
    lastRefresh.textContent = `Last refresh: ${new Date().toLocaleString()}`;
    setProgress(100, `Loaded ${records.length} biodatas`);
    render();
  } catch (error) {
    records = [];
    duplicateTotal = 0;
    setProgress(100, "Could not load biodata data");
    biodataGrid.innerHTML = "";
    emptyState.hidden = false;
    emptyState.textContent = "No biodata data file found yet. Add records to data/biodata.json.";
    console.error(error);
  }
}

function dedupeRecords(inputRecords) {
  const seen = new Set();
  const deduped = [];
  let duplicates = 0;

  for (const record of inputRecords) {
    const key = record.imageHash || record.messageId || record.image || record.id;
    if (!key) {
      deduped.push(record);
      continue;
    }

    if (seen.has(key)) {
      duplicates += 1;
      continue;
    }

    seen.add(key);
    deduped.push(record);
  }

  return { records: deduped, duplicates };
}

function populateFilters(sourceRecords) {
  setOptions(filterEls.birthYear, uniqueValues(sourceRecords, "birthYear").sort((a, b) => b - a), "All years");
  setOptions(filterEls.city, uniqueValues(sourceRecords, "city"), "All cities");
  setOptions(filterEls.caste, uniqueValues(sourceRecords, "caste"), "All castes");
  setOptions(filterEls.nativePlace, uniqueValues(sourceRecords, "nativePlace"), "All native places");
  setOptions(filterEls.religion, uniqueValues(sourceRecords, "religion"), "All religions");
}

function uniqueValues(sourceRecords, field) {
  return [...new Set(sourceRecords.map((record) => record[field]).filter(Boolean))].sort();
}

function setOptions(select, values, label) {
  const current = select.value;
  select.innerHTML = `<option value="">${label}</option>`;
  for (const value of values) {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = String(value);
    select.append(option);
  }
  select.value = values.map(String).includes(current) ? current : "";
}

async function preloadImages(sourceRecords) {
  const total = sourceRecords.length;
  if (!total) {
    return;
  }

  let loaded = 0;
  await Promise.allSettled(sourceRecords.map((record) => new Promise((resolve) => {
    const image = new Image();
    image.onload = image.onerror = () => {
      loaded += 1;
      setProgress(35 + Math.round((loaded / total) * 65), `Loaded ${loaded} of ${total} biodata images`);
      resolve();
    };
    image.src = record.image;
  })));
}

function render() {
  const filters = Object.fromEntries(Object.entries(filterEls).map(([key, select]) => [key, select.value]));
  const filtered = records.filter((record) => {
    return Object.entries(filters).every(([key, value]) => !value || String(record[key] || "") === value);
  });

  const grouped = groupByYear(filtered);
  biodataGrid.innerHTML = "";

  for (const [year, yearRecords] of grouped) {
    const group = document.createElement("div");
    group.className = "year-group";

    const heading = document.createElement("h2");
    heading.className = "year-heading";
    heading.textContent = year === "Unknown" ? "Birth year unknown" : `Born in ${year}`;
    group.append(heading);

    for (const record of yearRecords) {
      group.append(createCard(record));
    }

    biodataGrid.append(group);
  }

  resultCount.textContent = `${filtered.length} biodata${filtered.length === 1 ? "" : "s"}`;
  duplicateCount.textContent = `${duplicateTotal} duplicate${duplicateTotal === 1 ? "" : "s"} skipped`;
  emptyState.hidden = filtered.length > 0;
}

function groupByYear(sourceRecords) {
  const map = new Map();
  for (const record of sourceRecords) {
    const year = record.birthYear || "Unknown";
    if (!map.has(year)) {
      map.set(year, []);
    }
    map.get(year).push(record);
  }

  return [...map.entries()].sort(([a], [b]) => {
    if (a === "Unknown") return 1;
    if (b === "Unknown") return -1;
    return Number(b) - Number(a);
  });
}

function createCard(record) {
  const card = document.createElement("article");
  card.className = "biodata-card";

  const image = document.createElement("img");
  image.src = record.image;
  image.alt = record.name ? `${record.name} biodata` : "Biodata image";
  image.loading = "lazy";
  card.append(image);

  const meta = document.createElement("div");
  meta.className = "biodata-meta";
  meta.innerHTML = `
    <strong>${escapeHtml(record.name || "Name not extracted")}</strong>
    <span>DOB: ${escapeHtml(record.birthDate || "Unknown")}</span>
    <span>City: ${escapeHtml(record.city || "Unknown")}</span>
    <span>Caste: ${escapeHtml(record.caste || "Unknown")}</span>
    <span>Native: ${escapeHtml(record.nativePlace || "Unknown")}</span>
    <span>Religion: ${escapeHtml(record.religion || "Unknown")}</span>
  `;
  card.append(meta);
  return card;
}

function setProgress(percent, message) {
  progressBar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  loadStatus.textContent = message;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char]));
}
