const express = require('express');
const cors = require('cors');
const path = require('path');
const { startWatcher } = require('./parser/liveWatcher');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/summary', require('./routes/summary'));
app.use('/api/daily', require('./routes/daily'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/models', require('./routes/models'));
app.use('/api/hourly', require('./routes/hourly'));
app.use('/api/live', require('./routes/live'));

// Serve built client in production
const clientBuild = path.join(__dirname, '../client/dist');
const fs = require('fs');
if (fs.existsSync(clientBuild)) {
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Claude Usage Dashboard server running on http://localhost:${PORT}`);
  startWatcher();
});
