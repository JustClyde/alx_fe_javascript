// Simulated API endpoint (replace with actual API if needed)
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

// Fetch quotes from server
async function fetchQuotesFromServer() {
    try {
        const response = await fetch(SERVER_URL);
        if (!response.ok) throw new Error("Failed to fetch from server");

        // Simulate that the server returns quotes
        const serverData = await response.json();
        const serverQuotes = serverData.map(item => ({
            text: item.title,
            author: "Unknown",
            category: "General"
        }));

        // Merge with local storage data
        let localQuotes = JSON.parse(localStorage.getItem("quotes")) || [];

        // Simple conflict resolution: server wins
        const mergedQuotes = [...serverQuotes];

        localStorage.setItem("quotes", JSON.stringify(mergedQuotes));
        displayQuotes(mergedQuotes);

        console.log("Quotes synced with server");

    } catch (error) {
        console.error("Error fetching quotes:", error);
    }
}

// Call periodically to simulate live sync
setInterval(fetchQuotesFromServer, 30000); // every 30s
