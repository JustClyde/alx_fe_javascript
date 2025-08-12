let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Don’t let yesterday take up too much of today.", category: "Inspiration" },
  { text: "It’s not whether you get knocked down, it’s whether you get up.", category: "Perseverance" }
];

document.getElementById("newQuote").addEventListener("click", displayRandomQuote);

// Load saved category filter if available
const savedCategory = localStorage.getItem("selectedCategory") || "all";
document.getElementById("categoryFilter").value = savedCategory;

// Populate categories on load
populateCategories();
filterQuotes();

// Save quotes to local storage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Display a random quote based on current filter
function displayRandomQuote() {
  const category = document.getElementById("categoryFilter").value;
  const filtered = category === "all" ? quotes : quotes.filter(q => q.category === category);
  
  if (filtered.length === 0) {
    document.getElementById("quoteDisplay").innerText = "No quotes found for this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filtered.length);
  document.getElementById("quoteDisplay").innerText = filtered[randomIndex].text;
}

// Add new quote
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (text && category) {
    quotes.push({ text, category });
    saveQuotes();
    populateCategories();
    filterQuotes();
    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";
  } else {
    alert("Please enter both quote text and category.");
  }
}

// Populate category dropdown dynamically
function populateCategories() {
  const select = document.getElementById("categoryFilter");
  const selectedValue = select.value;
  select.innerHTML = `<option value="all">All Categories</option>`;
  
  const categories = [...new Set(quotes.map(q => q.category))];
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });

  // Restore previous selection if it exists
  if (categories.includes(selectedValue) || selectedValue === "all") {
    select.value = selectedValue;
  }
}

// Filter quotes by selected category
function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", selectedCategory);
  displayRandomQuote();
}

// Export quotes as JSON file
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "quotes.json";
  link.click();
  URL.revokeObjectURL(url);
}

// Import quotes from JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategories();
        filterQuotes();
        alert("Quotes imported successfully!");
      } else {
        alert("Invalid JSON format.");
      }
    } catch (err) {
      alert("Error parsing JSON file.");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}
