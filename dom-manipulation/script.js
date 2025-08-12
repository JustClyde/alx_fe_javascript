// script.js - Dynamic Quote Generator with storage + JSON import/export

// Default quotes (used only if localStorage has none)
const DEFAULT_QUOTES = [
  { text: "The best way to predict the future is to create it.", category: "Motivation" },
  { text: "Life is 10% what happens to us and 90% how we react to it.", category: "Life" },
  { text: "The purpose of our lives is to be happy.", category: "Happiness" },
  { text: "Do not take life too seriously. You will never get out of it alive.", category: "Humor" }
];

const LOCAL_KEY = 'quotes';
const SESSION_LAST_QUOTE = 'lastQuote'; // will store an object

// runtime array
let quotes = [];

// DOM refs
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const exportBtn = document.getElementById('exportJson');
const importFileInput = document.getElementById('importFile');
const categoryFilter = document.getElementById('categoryFilter');
const clearLocalBtn = document.getElementById('clearLocal');

// -------------- Storage helpers --------------
function saveQuotes() {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(quotes));
  } catch (e) {
    console.error('Failed saving quotes to localStorage:', e);
  }
}

function loadQuotes() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) {
      quotes = [...DEFAULT_QUOTES];
      saveQuotes(); // persist defaults
      return;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Local quotes is not an array');
    // basic validation: every item should have text & category
    quotes = parsed.filter(q => q && typeof q.text === 'string' && typeof q.category === 'string');
    if (quotes.length === 0) {
      quotes = [...DEFAULT_QUOTES];
    }
  } catch (e) {
    console.warn('Error loading quotes from localStorage - falling back to defaults:', e);
    quotes = [...DEFAULT_QUOTES];
    saveQuotes();
  }
}

// -------------- UI helpers --------------
function renderQuote(quoteObj) {
  quoteDisplay.innerHTML = '';
  if (!quoteObj) {
    quoteDisplay.innerHTML = '<p class="quote-text">No quote available.</p>';
    return;
  }
  const pText = document.createElement('p');
  pText.className = 'quote-text';
  pText.textContent = `"${quoteObj.text}"`;

  const pCat = document.createElement('p');
  pCat.className = 'quote-category';
  pCat.textContent = `— ${quoteObj.category}`;

  quoteDisplay.appendChild(pText);
  quoteDisplay.appendChild(pCat);
}

function getFilteredQuotes() {
  const sel = categoryFilter.value;
  if (!sel || sel === 'all') return quotes;
  return quotes.filter(q => q.category.toLowerCase() === sel.toLowerCase());
}

function showRandomQuote() {
  const pool = getFilteredQuotes();
  if (pool.length === 0) {
    renderQuote(null);
    sessionStorage.removeItem(SESSION_LAST_QUOTE);
    return;
  }
  const idx = Math.floor(Math.random() * pool.length);
  const quote = pool[idx];
  renderQuote(quote);
  // store last quote in session storage (temporary)
  try {
    sessionStorage.setItem(SESSION_LAST_QUOTE, JSON.stringify(quote));
  } catch (e) {
    console.warn('Could not set session storage:', e);
  }
}

function updateCategoryFilter() {
  // preserve current selection
  const current = categoryFilter.value || 'all';
  // get unique categories
  const cats = Array.from(new Set(quotes.map(q => q.category))).sort((a,b) => a.localeCompare(b));
  // rebuild
  categoryFilter.innerHTML = '';
  const optAll = document.createElement('option');
  optAll.value = 'all';
  optAll.textContent = 'All categories';
  categoryFilter.appendChild(optAll);
  cats.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });
  // restore if possible
  if ([...categoryFilter.options].some(o => o.value === current)) {
    categoryFilter.value = current;
  }
}

// -------------- Form creation & add logic --------------
function createAddQuoteForm() {
  const root = document.getElementById('form-root');
  root.innerHTML = ''; // clear

  const textInput = document.createElement('input');
  textInput.id = 'newQuoteText';
  textInput.type = 'text';
  textInput.placeholder = 'Enter a new quote';
  textInput.style.minWidth = '280px';

  const categoryInput = document.createElement('input');
  categoryInput.id = 'newQuoteCategory';
  categoryInput.type = 'text';
  categoryInput.placeholder = 'Enter quote category';

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.textContent = 'Add Quote';
  addBtn.addEventListener('click', addQuote);

  root.appendChild(textInput);
  root.appendChild(categoryInput);
  root.appendChild(addBtn);
}

function addQuote() {
  const textElem = document.getElementById('newQuoteText');
  const catElem = document.getElementById('newQuoteCategory');
  if (!textElem || !catElem) return;

  const text = textElem.value.trim();
  const category = catElem.value.trim() || 'Uncategorized';

  if (!text) {
    alert('Please enter a quote text before adding.');
    return;
  }

  const newQ = { text, category };
  quotes.push(newQ);
  saveQuotes();
  updateCategoryFilter();

  // clear form
  textElem.value = '';
  catElem.value = '';

  // give visual feedback
  alert('Quote added successfully!');
}

function clearSavedQuotes() {
  if (!confirm('This will clear all saved quotes and restore defaults. Proceed?')) return;
  localStorage.removeItem(LOCAL_KEY);
  loadQuotes();
  updateCategoryFilter();
  renderQuote(null);
}

// -------------- JSON import/export --------------
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
    console.error('Export failed', e);
    alert('Export failed. See console for details.');
  }
}

function importFromJsonFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!Array.isArray(parsed)) throw new Error('Imported JSON must be an array of quote objects.');
      // basic validation and normalize
      const sanitized = parsed
        .filter(item => item && typeof item.text === 'string')
        .map(item => ({
          text: item.text,
          category: typeof item.category === 'string' ? item.category : 'Imported'
        }));
      if (sanitized.length === 0) throw new Error('No valid quote objects found in the file.');
      // append to existing
      quotes.push(...sanitized);
      saveQuotes();
      updateCategoryFilter();
      alert(`${sanitized.length} quotes imported successfully!`);
      // clear file input value so same file can be re-imported if needed
      importFileInput.value = '';
    } catch (err) {
      console.error('Import error', err);
      alert('Failed to import JSON: ' + (err.message || err));
      importFileInput.value = '';
    }
  };
  reader.onerror = function() {
    alert('Failed to read file.');
    importFileInput.value = '';
  };
  reader.readAsText(file);
}

// -------------- Initialization --------------
function init() {
  loadQuotes();
  createAddQuoteForm();
  updateCategoryFilter();

  // restore last viewed quote from sessionStorage if present
  const lastRaw = sessionStorage.getItem(SESSION_LAST_QUOTE);
  if (lastRaw) {
    try {
      const obj = JSON.parse(lastRaw);
      if (obj && obj.text) renderQuote(obj);
      else renderQuote(null);
    } catch (e) {
      renderQuote(null);
    }
  } else {
    renderQuote(null);
  }

  // events
  newQuoteBtn.addEventListener('click', showRandomQuote);
  exportBtn.addEventListener('click', exportToJson);
  importFileInput.addEventListener('change', importFromJsonFile);
  categoryFilter.addEventListener('change', () => { /* optional: immediately show a quote from new filter */ });
  clearLocalBtn.addEventListener('click', clearSavedQuotes);
}

// run
init();
