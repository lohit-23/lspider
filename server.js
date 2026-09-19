const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve Frontend Static Files
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// In-Memory / File-based High Score Storage
const scoresFile = path.join(__dirname, 'scores.json');
let leaderboards = [
  { player: 'Peter Parker', score: 12500, date: new Date().toISOString() },
  { player: 'Miles Morales', score: 9800, date: new Date().toISOString() },
  { player: 'Gwen Stacy', score: 8400, date: new Date().toISOString() },
  { player: 'Spider-Man 2099', score: 7200, date: new Date().toISOString() }
];

// Load saved scores if file exists
if (fs.existsSync(scoresFile)) {
  try {
    const data = fs.readFileSync(scoresFile, 'utf8');
    leaderboards = JSON.parse(data);
  } catch (err) {
    console.error('Error reading scores.json:', err.message);
  }
}

function saveScores() {
  try {
    fs.writeFileSync(scoresFile, JSON.stringify(leaderboards, null, 2));
  } catch (err) {
    console.error('Error saving scores.json:', err.message);
  }
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Stark-Tech Web-Shooter Server Online', timestamp: new Date() });
});

app.get('/api/scores', (req, res) => {
  res.json({
    success: true,
    topScores: leaderboards.slice(0, 10)
  });
});

app.post('/api/scores', (req, res) => {
  const { player, score } = req.body;
  if (!score || typeof score !== 'number') {
    return res.status(400).json({ error: 'Valid score is required' });
  }

  const playerName = (player && typeof player === 'string') ? player.trim().substring(0, 25) : 'Friendly Neighborhood Web-Slinger';
  const newEntry = {
    player: playerName,
    score: Math.floor(score),
    date: new Date().toISOString()
  };

  leaderboards.push(newEntry);
  leaderboards.sort((a, b) => b.score - a.score);
  leaderboards = leaderboards.slice(0, 50); // Keep top 50

  saveScores();

  res.status(201).json({
    success: true,
    entry: newEntry,
    rank: leaderboards.findIndex(entry => entry === newEntry) + 1
  });
});

// Fallback to frontend index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🕷️ Spider-Man Web-Shooter Backend running on http://localhost:${PORT}`);
});
