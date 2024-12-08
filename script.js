(async function testConnection() {
    console.log("Testing Supabase connection...");
    const { data, error } = await supabase.from("fantasy_football").select("*");

    if (error) {
        console.error("Supabase Error:", error);
    } else {
        console.log("Supabase Data:", data);
    }
})();
