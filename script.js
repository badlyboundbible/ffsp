async function fetchData() {
    const loader = document.getElementById("loader");

    if (!loader) {
        console.error("Loader element not found in the DOM.");
        return;
    }

    loader.style.display = "block"; // Show the loader
    console.log("Fetching data from Airtable...");

    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (!response.ok) {
            throw new Error(
                `Failed to fetch data: ${response.statusText} (HTTP ${response.status})`
            );
        }

        const data = await response.json();
        console.log("Data fetched successfully:", data);

        if (data.records) {
            displayPlayers(data.records);
        } else {
            console.error("No records found in Airtable.");
            alert("No player data found! Check Airtable configuration.");
        }
    } catch (error) {
        console.error("Error fetching data from Airtable:", error);
        alert("Unable to fetch data. Please try again later.");
    } finally {
        loader.style.display = "none"; // Hide the loader
    }
}
