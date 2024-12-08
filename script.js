import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Initialize Supabase client
const supabase = createClient(
    "https://cfmtrhlovulezzswxqsu.supabase.co", // Replace with your Supabase Project URL
    "YOUR_ANON_PUBLIC_KEY" // Replace with your anon public key
);

// Test the connection
(async function testConnection() {
    console.log("Testing Supabase connection...");

    const { data, error } = await supabase.from("fantasy_football").select("*");

    if (error) {
        console.error("Supabase Error:", error);
    } else {
        console.log("Supabase Data:", data);
    }
})();
