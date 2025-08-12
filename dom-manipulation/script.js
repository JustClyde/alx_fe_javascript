/* script.js - Dynamic Quote Generator with simulated server sync + conflict resolution */

/* -------------------------
   Helper / Defaults
   ------------------------- */
const DEFAULT_QUOTES = [
  { id: 1, text: "The best way to predict the future is to create it.", category: "Motivation", updatedAt: new Date().toISOString() },
  { id: 2, text: "Life is 10% what happens to us and 90% how we react to it.", category: "Life", updatedAt: new Date().toISOString() },
  { id: 3, text: "The purpose of our lives is to be happy.", category: "Happiness", updatedAt: new Date().toISOString() }
];

const LOCAL_KEY = 'dq_quotes_v1';
const SYNC_INTERVAL_MS = 15000; // 15s (periodic sync)
let quotes = [];                 // local runtime copy
let conflicts = [];              // runtime conflict list

/* -------------------------
   Mock Server (in-browser simulation)
   - Allows full demo w/o external API
   - Has basic create / fetch / update endpoints (promise-based)
   ------------------------- */
const mockServer = (function () {
  // server-side state
  let serverData = DEFAULT_QUOTES.map(q => ({ ...q }));
  let nextId = Math.max(...serverData.map(q => q.id)) + 1;

  // simulate occasional external edits (other clients) to demonstrate conflicts
  function simulateExternalChange() {
    if (Math.random() < 0.25 && serverData.length > 0) { // 25% chance
      const idx = Math.floor(Math.random() * serverData.length);
      serverData[idx] = {
        ...serverData[idx],
        text: serverData[idx].text + " (server edit)",
        updatedAt: new Date().toISOString()
      };
      // console.log('mockServer: made an external change on id', serverData[idx].id);
    }
  }

  return {
    fetchQuotes: function () {
      // simulate network delay
      return new Promise((resolve) => {
        setTimeout(() => {
          simulateExternalChange();
          // return deep copy
          resolve(serverData.map(q => ({ ...q })));
        }, 400 + Math.random() * 400);
      });
    },
    createQuote: function (quote) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const serverObj = {
            id: nextId++,
            text: quote.text,
            category: quote.category,
            updatedAt: new Date().toISOString()
          };
          serverData.push(serverObj);
          resolve({ ...serverObj });
        }, 300 + Math.random() * 300);
      });
    },
    updateQuote: function (quote) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const idx = serverData.findIndex(q => q.id === quote.id);
          if (idx === -1) {
            // create on update if not found
            const created = {
              id: nextId++,
              text: quote.text,
              category: quote.category,
              updatedAt: new Date().toISOString()
            };
            serverData.push(created);
            resolve({ ...created });
            return;
          }
          serverData[idx] = {
            ...serverData[idx],
            text: quote.text,
            category: quote.category,
            updatedAt: new Date().toISOString()
          };
          resolve({ ...serverData[idx] });
        }, 300 + Math.random() * 300);
      });
    }
  };
})();

/* -------------------------
   Storage helpers
   ------------------------- */
function saveLocal() {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(quotes));
}
function loadLocal() {
  const raw = localStorage.getItem(LOCAL_KEY);
  if (!raw) {
    quotes = DEFAULT_QUOTES.map(q => ({ ...q }));
    saveLocal();
  } else {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        quotes = parsed.map(q => ({ ...q })); // shallow copy
      } else {
        quotes = DEFAULT_QUOTES.map(q => ({ ...q }));
        saveLocal();
      }
    } catch (e) {
      quotes = DEFAULT_QUOTES.map(q => ({ ...q }));
      saveLocal();
    }
  }
}

/* -------------------------
   UI refs (assumes these exist in index.html)
   ------------------------- */
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const formRoot = document.getElementById('form-root');
const categoryFilter = document.getElementById('categoryFilter');
const syncNowBtn = document.getElementById('syncNow');
const syncStatusEl = document.getElementById('syncStatus');
const conflictsRoot = document.getElementById('conflicts');
const exportBtn = document.getElementById('exportJson');
const importFileInput = document.getElementById('importFile');

/* -------------------------
   Rendering and basic app actions
   ------------------------- */
function renderQuote(q) {
  if (!quoteDisplay) return;
  if (!q) {
    quoteDisplay.innerHTML = '<p>No quote to show.</p>';
    return;
  }
  quoteDisplay.innerHTML = `<p style="font-size:1.2rem">"${escapeHtml(q.text)}"</p>
                            <p style="color:#666">— ${escapeHtml(q.category)}</p>
                            <small style="color:#999">id: ${q.id} • updated: ${new Date(q.updatedAt).toLocaleString()}</small>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* Show random quote filtered by category selection */
function showRandomQuote() {
  const sel = categoryFilter ? categoryFilter.value : 'all';
  const pool = sel === 'all' ? quotes : quotes.filter(q => q.category === sel);
  if (pool.length === 0) {
    renderQuote(null);
    return;
  }
  const idx = Math.floor(Math.random() * pool.length);
  const q = pool[idx];
  renderQuote(q);
  // sessionStorage: last shown (optional)
  try {
    sessionStorage.setItem('lastQuote', JSON.stringify(q));
  } catch (e) { /* ignore */ }
}

/* -------------------------
   Form (create via DOM)
   ------------------------- */
function createAddQuoteForm() {
  if (!formRoot) return;
  formRoot.innerHTML = '';
  const text = document.createElement('input');
  text.type = 'text';
  text.placeholder = 'Enter quote text';
  text.id = 'newQuoteText';
  text.style.minWidth = '240px';

  const cat = document.createElement('input');
  cat.type = 'text';
  cat.placeholder = 'Category';
  cat.id = 'newQuoteCategory';

  const add = document.createElement('button');
  add.textContent = 'Add Quote';
  add.type = 'button';
  add.addEventListener('click', addQuote);

  formRoot.appendChild(text);
  formRoot.appendChild(cat);
  formRoot.appendChild(add);
}

/* Add local quote (gives temporary local ID and marks local change) */
function addQuote() {
  const textEl = document.getElementById('newQuoteText');
  const catEl = document.getElementById('newQuoteCategory');
  const textVal = textEl ? textEl.value.trim() : '';
  const catVal = catEl ? catEl.value.trim() || 'Uncategorized' : 'Uncategorized';
  if (!textVal) { alert('Enter quote text'); return; }
  // temp local id (negative or uuid)
  const tempId = 'local-' + Date.now();
  const newQ = {
    id: tempId,
    text: textVal,
    category: catVal,
    updatedAt: new Date().toISOString(),
    syncStatus: 'local' // local means not yet synced
  };
  quotes.push(newQ);
  saveLocal();
  updateCategoryFilter();
  if (textEl) textEl.value = '';
  if (catEl) catEl.value = '';
  alert('Saved locally. Will sync to server soon.');
}

/* Populate category dropdown from local quotes */
function updateCategoryFilter() {
  if (!categoryFilter) return;
  const current = categoryFilter.value || 'all';
  const cats = Array.from(new Set(quotes.map(q => q.category))).sort();
  categoryFilter.innerHTML = '';
  const optAll = document.createElement('option'); optAll.value = 'all'; optAll.textContent = 'All'; categoryFilter.appendChild(optAll);
  cats.forEach(c => {
    const o = document.createElement('option'); o.value = c; o.textContent = c; categoryFilter.appendChild(o);
  });
  if ([...categoryFilter.options].some(o => o.value === current)) categoryFilter.value = current;
}

/* -------------------------
   Sync logic
   ------------------------- */
async function syncWithServer(showNotifications = true) {
  setSyncStatus('Syncing...');
  try {
    const serverQuotes = await mockServer.fetchQuotes(); // simulate fetch

    // Map local by id for quick lookup
    const localById = new Map(quotes.map(q => [String(q.id), q]));

    // 1) Handle server -> local integration and detect conflicts
    const newLocal = [...quotes]; // will mutate later
    conflicts = [];

    for (const s of serverQuotes) {
      const sid = String(s.id);
      const local = localById.get(sid);

      if (!local) {
        // server has a new quote we don't -> add it (server wins)
        newLocal.push({ ...s, syncStatus: 'synced' });
      } else {
        // both server and local have it -> check timestamps
        const serverTime = new Date(s.updatedAt).getTime();
        const localTime = new Date(local.updatedAt).getTime();

        if (serverTime > localTime) {
          // server newer
          // if local has local changes flagged 'local', treat as conflict
          if (local.syncStatus === 'local') {
            // conflict: both changed - by default apply server but store conflict for manual resolution
            conflicts.push({ local: { ...local }, server: { ...s } });
            // default policy: server wins -> overwrite local
            const idx = newLocal.findIndex(q => String(q.id) === sid);
            if (idx !== -1) newLocal[idx] = { ...s, syncStatus: 'synced' };
          } else {
            // local not modified -> accept server update
            const idx = newLocal.findIndex(q => String(q.id) === sid);
            if (idx !== -1) newLocal[idx] = { ...s, syncStatus: 'synced' };
          }
        } else if (localTime > serverTime) {
          // local newer - try pushing local to server (local changes to persist)
          if (String(local.id).startsWith('local-')) {
            // local-only (temp id) -> create on server and map id
            try {
              const created = await mockServer.createQuote(local);
              // replace temp id in newLocal
              for (let i = 0; i < newLocal.length; i++) {
                if (String(newLocal[i].id) === String(local.id)) {
                  newLocal[i] = { ...created, syncStatus: 'synced' };
                }
              }
            } catch (e) {
              console.error('Failed to create on server', e);
            }
          } else {
            // update server with local version
            try {
              const updated = await mockServer.updateQuote(local);
              for (let i = 0; i < newLocal.length; i++) {
                if (String(newLocal[i].id) === String(local.id)) {
                  newLocal[i] = { ...updated, syncStatus: 'synced' };
                }
              }
            } catch (e) {
              console.error('Failed to update server', e);
            }
          }
        } else {
          // timestamps equal -> nothing to do; ensure syncStatus synced
          const idx = newLocal.findIndex(q => String(q.id) === sid);
          if (idx !== -1) newLocal[idx].syncStatus = 'synced';
        }
      }
    }

    // 2) Check local entries that server doesn't have (local-only)
    for (const local of quotes) {
      const idStr = String(local.id);
      if (!serverQuotes.some(s => String(s.id) === idStr)) {
        if (idStr.startsWith('local-')) {
          // local created while offline: create it on server
          try {
            const created = await mockServer.createQuote(local);
            // replace temp id
            for (let i = 0; i < newLocal.length; i++) {
              if (String(newLocal[i].id) === idStr) {
                newLocal[i] = { ...created, syncStatus: 'synced' };
              }
            }
          } catch (e) {
            console.error('Create failed', e);
          }
        } else {
          // server missing an id that local has -> decide policy (server precedence: delete local)
          // Apply server-wins by removing local (if needed). For demo we'll keep local but mark as 'synced'
          // (In production you may want a delete marker)
        }
      }
    }

    // commit merged newLocal to quotes and storage
    quotes = newLocal;
    saveLocal();
    updateCategoryFilter();
    renderConflicts();
    setSyncStatus('Synced at ' + new Date().toLocaleTimeString());
    if (showNotifications && conflicts.length) {
      // notify user conflicts were found and server-wins were applied automatically
      alert(`${conflicts.length} conflict(s) detected. Server changes were applied by default. You can manually review them below.`);
    }
  } catch (err) {
    console.error('Sync failed', err);
    setSyncStatus('Sync failed: ' + (err.message || 'unknown'));
  }
}

/* -------------------------
   Conflict UI & actions
   ------------------------- */
function renderConflicts() {
  if (!conflictsRoot) return;
  conflictsRoot.innerHTML = '';
  if (!conflicts || conflicts.length === 0) {
    conflictsRoot.style.display = 'none';
    return;
  }
  conflictsRoot.style.display = 'block';
  const title = document.createElement('h3'); title.textContent = 'Conflicts';
  conflictsRoot.appendChild(title);

  conflicts.forEach((c, idx) => {
    const wrapper = document.createElement('div');
    wrapper.style.padding = '8px';
    wrapper.style.border = '1px solid #eee';
    wrapper.style.marginBottom = '8px';
    wrapper.style.background = '#fff';

    const info = document.createElement('div');
    info.innerHTML = `<strong>Quote ID:</strong> ${escapeHtml(String(c.server.id))} <br/>
                      <strong>Server (applied):</strong> "${escapeHtml(c.server.text)}" — <em>${escapeHtml(c.server.category)}</em><br/>
                      <strong>Your Local version:</strong> "${escapeHtml(c.local.text)}" — <em>${escapeHtml(c.local.category)}</em><br/>`;
    wrapper.appendChild(info);

    const keepLocalBtn = document.createElement('button');
    keepLocalBtn.textContent = 'Keep Local (Push to server)';
    keepLocalBtn.style.marginRight = '8px';
    keepLocalBtn.addEventListener('click', async () => {
      // push local to server
      try {
        const result = await mockServer.updateQuote(c.local);
        // update local store with server-return (which now matches local)
        const i = quotes.findIndex(q => String(q.id) === String(c.local.id) || String(q.id) === String(c.server.id));
        if (i !== -1) {
          quotes[i] = { ...result, syncStatus: 'synced' };
          saveLocal();
          updateCategoryFilter();
          conflicts.splice(idx, 1);
          renderConflicts();
          alert('Local version pushed and synced.');
        }
      } catch (e) {
        alert('Failed to push local to server.');
      }
    });

    const keepServerBtn = document.createElement('button');
    keepServerBtn.textContent = 'Keep Server (Leave as is)';
    keepServerBtn.addEventListener('click', () => {
      // just remove the conflict from list since server already applied
      conflicts.splice(idx, 1);
      renderConflicts();
      alert('Server version retained.');
    });

    wrapper.appendChild(keepLocalBtn);
    wrapper.appendChild(keepServerBtn);
    conflictsRoot.appendChild(wrapper);
  });
}

/* -------------------------
   UI helpers
   ------------------------- */
function setSyncStatus(txt) {
  if (!syncStatusEl) return;
  syncStatusEl.textContent = txt;
}

/* -------------------------
   Import / Export helpers
   ------------------------- */
function exportToJson() {
  try {
    const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quotes.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    alert('Export failed');
  }
}

function importFromJsonFile(ev) {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!Array.isArray(parsed)) throw new Error('JSON must be an array');
      const sanitized = parsed.filter(it => it && typeof it.text === 'string').map(it => ({
        id: it.id || ('local-' + Date.now() + '-' + Math.floor(Math.random()*1000)),
        text: it.text,
        category: it.category || 'Imported',
        updatedAt: new Date().toISOString(),
        syncStatus: String(it.id || '').startsWith('local-') ? 'local' : 'synced'
      }));
      quotes.push(...sanitized);
      saveLocal();
      updateCategoryFilter();
      alert('Imported ' + sanitized.length + ' quotes');
    } catch (err) {
      alert('Import failed: ' + (err.message || err));
    } finally {
      importFileInput.value = '';
    }
  };
  reader.readAsText(file);
}

/* -------------------------
   Initialization + periodic sync
   ------------------------- */
function init() {
  loadLocal();
  createAddQuoteForm();
  updateCategoryFilter();

  // try restore last shown from sessionStorage
  const lastRaw = sessionStorage.getItem('lastQuote');
  if (lastRaw) {
    try {
      const last = JSON.parse(lastRaw);
      renderQuote(last);
    } catch (e) { renderQuote(null); }
  } else {
    renderQuote(null);
  }

  // wire events
  if (newQuoteBtn) newQuoteBtn.addEventListener('click', showRandomQuote);
  if (categoryFilter) categoryFilter.addEventListener('change', () => { localStorage.setItem('lastCategory', categoryFilter.value); });
  if (syncNowBtn) syncNowBtn.addEventListener('click', () => syncWithServer(true));
  if (exportBtn) exportBtn.addEventListener('click', exportToJson);
  if (importFileInput) importFileInput.addEventListener('change', importFromJsonFile);

  // restore last selected category
  const lastCat = localStorage.getItem('lastCategory');
  if (lastCat && categoryFilter) {
    // populate categories first then set (populate uses quotes)
    updateCategoryFilter();
    if ([...categoryFilter.options].some(o => o.value === lastCat)) categoryFilter.value = lastCat;
  }

  // periodic sync
  setInterval(() => syncWithServer(false), SYNC_INTERVAL_MS);
  // initial sync
  syncWithServer(false);
}

init();
