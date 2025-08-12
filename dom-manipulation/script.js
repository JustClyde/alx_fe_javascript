// Send a new quote to the server
async function sendQuoteToServer(quote) {
    try {
        const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(quote)
        });

        if (!response.ok) throw new Error("Failed to send quote to server");

        const result = await response.json();
        console.log("Quote sent to server:", result);

    } catch (error) {
        console.error("Error sending quote:", error);
    }
}

// Example: Hook into your "add quote" form
document.getElementById("addQuoteForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const text = document.getElementById("quoteText").value;
    const author = document.getElementById("quoteAuthor").value;
    const category = document.getElementById("quoteCategory").value;

    const newQuote = { text, author, category };

    // Save locally
    let quotes = JSON.parse(localStorage.getItem("quotes")) || [];
    quotes.push(newQuote);
    localStorage.setItem("quotes", JSON.stringify(quotes));

    // Send to server
    sendQuoteToServer(newQuote);

    // Refresh display
    displayQuotes(quotes);

    // Clear form
    e.target.reset();
});
