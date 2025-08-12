// Simulated API endpoint
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

// Send a new quote to the server
async function sendQuoteToServer(quote) {
    try {
        const response = await fetch(SERVER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: quote.text,
                author: quote.author,
                category: quote.category
            })
        });

        if (!response.ok) throw new Error("Failed to send quote to server");

        const data = await response.json();
        console.log("Quote successfully sent to server:", data);

    } catch (error) {
        console.error("Error sending quote:", error);
    }
}

// Example: Hook into your "add new quote" function
function addNewQuote(text, author, category) {
    let localQuotes = JSON.parse(localStorage.getItem("quotes")) || [];
    const newQuote = { text, author, category };
    localQuotes.push(newQuote);
    localStorage.setItem("quotes", JSON.stringify(localQuotes));

    displayQuotes(localQuotes);

    // Also send to server
    sendQuoteToServer(newQuote);
}
