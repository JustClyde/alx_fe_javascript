// Quotes array with objects
let quotes = [
  { text: "The best way to predict the future is to create it.", category: "Motivation" },
  { text: "Life is 10% what happens to us and 90% how we react to it.", category: "Life" },
  { text: "The purpose of our lives is to be happy.", category: "Happiness" },
  { text: "Do not take life too seriously. You will never get out of it alive.", category: "Humor" }
];

// DOM elements
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const quoteTextInput = document.getElementById("newQuoteText");
const quoteCategoryInput = document.getElementById("newQuoteCategory");

// Function to show a random quote
function showRandomQuote() {
  if (quotes.length === 0) {
    quoteDisplay.innerHTML = "No quotes available!";
    return;
  }
  
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];
  
  // Clear and build quote HTML dynamically
  quoteDisplay.innerHTML = "";
  
  const quoteText = document.createElement("p");
  quoteText.textContent = `"${quote.text}"`;
  
  const quoteCategory = document.createElement("p");
  quoteCategory.className = "quote-category";
  quoteCategory.textContent = `— ${quote.category}`;
  
  quoteDisplay.appendChild(quoteText);
  quoteDisplay.appendChild(quoteCategory);
}

// Function to add a new quote
function addQuote() {
  const text = quoteTextInput.value.trim();
  const category = quoteCategoryInput.value.trim();
  
  if (text === "" || category === "") {
    alert("Please enter both a quote and category.");
    return;
  }
  
  // Add new quote object to array
  quotes.push({ text, category });
  
  // Clear inputs
  quoteTextInput.value = "";
  quoteCategoryInput.value = "";
  
  alert("New quote added!");
}

// Event listeners
newQuoteBtn.addEventListener("click", showRandomQuote);
addQuoteBtn.addEventListener("click", addQuote);
