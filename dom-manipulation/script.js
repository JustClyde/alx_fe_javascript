// Simulated API endpoint for fetching quotes
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

// Fetch quotes from the server and update local storage
async function fetchQuotesFromServer() {
    try {
        const response = await fetch(SERVER_URL);
        if (!response.ok) throw new Error("Failed to fetch quotes from server");

        const serverQuotes = await response.json();

        // Transform mock server data to match your quote structure
        const formattedQuotes = serverQuotes.map(item => ({
            text: item.title || "No text available",
            author: item.body || "Unknown author",
            category: "Server"
        }));

        // Merge with local quotes, prioritizing server data
        localStorage.setItem("quotes", JSON.stringify(formattedQuotes));

        console.log("Quotes fetched from server:", formattedQuotes);
        displayQuotes(formattedQuotes);

    } catch (error) {
        console.error("Error fetching quotes:", error);
    }
}

// Example: Fetch server quotes every 30 seconds
setInterval(fetchQuotesFromServer, 30000);

// Fetch once on page load
fetchQuotesFromServer();

script.js doesn't contain: ["method", "POST", "headers", "application/json", "Content-Type"]
script.js doesn't contain: ["syncQuotes"]
script.js doesn't contain: ["alert", "Quotes synced with server!"]
