import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
    "https://cfmtrhlovulezzswxqsu.supabase.co", // Replace with your Supabase Project URL
    "YOUR_NEW_ANON_PUBLIC_KEY" // Replace with your valid anon public key
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
