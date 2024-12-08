import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Replace with your actual Supabase Project URL and anon key
const supabase = createClient(
    "https://cfmtrhlovulezzswxqsu.supabase.co", // Your Supabase URL
    "YOUR_ANON_PUBLIC_KEY"                     // Your Supabase anon key
);

(async function testConnection() {
    console.log("Testing Supabase connection...");

    const { data, error } = await supabase.from("fantasy_football").select("*");

    if (error) {
        console.error("Supabase Error:", error);
    } else {
        console.log("Supabase Data:", data);
    }
})();
