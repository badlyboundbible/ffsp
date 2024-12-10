<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scottish Premiership Fantasy Football</title>
    <link rel="stylesheet" href="style.css">
    <script defer src="script.js"></script>
</head>
<body>
    <h1>Scottish Premiership Fantasy Football</h1>
    
    <!-- Loader -->
    <div id="loader">Loading...</div>

    <!-- Ell's Team -->
    <div class="team">
        <h2>Ell's Allstars</h2>
        <div id="ells-gk" class="position"></div>
        <div id="ells-def" class="position"></div>
        <div id="ells-mid" class="position"></div>
        <div id="ells-fwd" class="position"></div>
    </div>

    <!-- Final Score Section -->
    <div id="final-score">
        <h2>Final Score</h2>
        <p id="winner-display">Winner: -</p>
        <button onclick="calculateWinner()">Calculate Winner</button>
    </div>

    <!-- Jack's Team (Mirrored Layout) -->
    <div class="team">
        <div id="jacks-fwd" class="position"></div>
        <div id="jacks-mid" class="position"></div>
        <div id="jacks-def" class="position"></div>
        <div id="jacks-gk" class="position"></div>
        <h2>Lord Frostly's XI</h2>
    </div>
</body>
</html>
