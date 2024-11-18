const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;
const sqlite3 = require('sqlite3');
const bodyParser = require('body-parser');
const path = require('path');

// Enable CORS to allow the front-end to make requests
app.use(cors());

// Middleware to parse JSON bodies in requests
app.use(express.json());

// Dummy data for the alarm system
let settings = {
    alarmCode: '1234',
    alarmStatus: false
};

// Route to get the settings
app.get('/api/settings', (req, res) => {
    res.json(settings);
});

// SQLite database setup for different systems
const dbs = {
    camera: new sqlite3.Database('./cameraData.db'),
    kitchenLights: new sqlite3.Database('./kitchenlights.db'),
    garage: new sqlite3.Database('./garage.db'),
    livingLights: new sqlite3.Database('./livinglights.db'),
    studyRoomLights: new sqlite3.Database('./studyroom.db'),
    coffeeMachine: new sqlite3.Database('./coffee_machine.db'),
    stove: new sqlite3.Database('./kitchen.db')
};

// Function to initialize SQLite tables for each system
function initializeDatabase(db, query, defaultData = '') {
    db.serialize(() => {
        db.run(query);
        if (defaultData) {
            db.run(defaultData);
        }
    });
}

// Initialize all necessary tables
initializeDatabase(dbs.camera, "CREATE TABLE IF NOT EXISTS camera_data (id INTEGER PRIMARY KEY AUTOINCREMENT, status TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");
initializeDatabase(dbs.kitchenLights, 'CREATE TABLE IF NOT EXISTS kitchen_lights (id INTEGER PRIMARY KEY, brightness INTEGER)', 'INSERT OR IGNORE INTO kitchen_lights (id, brightness) VALUES (1, 0)');
initializeDatabase(dbs.garage, `CREATE TABLE IF NOT EXISTS garage (
    id INTEGER PRIMARY KEY,
    gateStatus INTEGER NOT NULL,
    garageCode TEXT NOT NULL
)`, 'INSERT OR IGNORE INTO garage (id, gateStatus, garageCode) VALUES (1, 0, "1234")');
initializeDatabase(dbs.livingLights, `CREATE TABLE IF NOT EXISTS living_lights (id INTEGER PRIMARY KEY AUTOINCREMENT, brightness REAL)`, 'INSERT OR IGNORE INTO living_lights (id, brightness) VALUES (1, 0.5)');
initializeDatabase(dbs.studyRoomLights, `CREATE TABLE IF NOT EXISTS studyroom_lights (id INTEGER PRIMARY KEY AUTOINCREMENT, brightness REAL)`, 'INSERT OR IGNORE INTO studyroom_lights (id, brightness) VALUES (1, 0.5)');
initializeDatabase(dbs.coffeeMachine, `CREATE TABLE IF NOT EXISTS coffee_machine (id INTEGER PRIMARY KEY AUTOINCREMENT, power BOOLEAN NOT NULL DEFAULT false)`, 'INSERT INTO coffee_machine (power) SELECT false WHERE NOT EXISTS (SELECT 1 FROM coffee_machine)');
initializeDatabase(dbs.stove, `CREATE TABLE IF NOT EXISTS stoves (
    id INTEGER PRIMARY KEY,
    state INTEGER DEFAULT 0,
    strength INTEGER DEFAULT 0
)`, 'INSERT OR IGNORE INTO stoves (id, state, strength) VALUES (1, 0, 0), (2, 0, 0), (3, 0, 0), (4, 0, 0)');

// Alarm System Endpoints
app.post('/api/settings/status', (req, res) => {
    const { alarmCode } = req.body;
    if (alarmCode === settings.alarmCode) {
        settings.alarmStatus = !settings.alarmStatus;
        res.json({ alarmStatus: settings.alarmStatus });
    } else {
        res.status(401).json({ message: 'Incorrect code' });
    }
});

app.post('/api/settings/update', (req, res) => {
    const { oldAlarmCode, newAlarmCode } = req.body;
    if (oldAlarmCode === settings.alarmCode) {
        settings.alarmCode = newAlarmCode;
        res.json({ message: 'Alarm code updated successfully' });
    } else {
        res.status(401).json({ message: 'Old code is incorrect' });
    }
});

// Camera System
app.post('/api/camera', (req, res) => {
    const { status } = req.body;
    if (status) {
        const stmt = dbs.camera.prepare("INSERT INTO camera_data (status) VALUES (?)");
        stmt.run(status, function (err) {
            if (err) {
                return res.status(500).send({ error: 'Failed to save camera status' });
            }
            res.status(200).send({ message: 'Camera status saved', id: this.lastID });
        });
        stmt.finalize();
    } else {
        res.status(400).send({ error: 'Invalid status' });
    }
});

// Kitchen Lights
app.get('/api/kitchen-lights', (req, res) => {
    dbs.kitchenLights.get('SELECT brightness FROM kitchen_lights WHERE id = 1', (err, row) => {
        if (err) {
            console.error('Error fetching brightness:', err);
            return res.status(500).send('Server error');
        }
        res.json({ brightness: row ? row.brightness : 0 });
    });
});

app.post('/api/kitchen-lights', (req, res) => {
    const { brightness } = req.body;
    if (brightness === undefined || isNaN(brightness)) {
        return res.status(400).send('Invalid brightness value');
    }
    dbs.kitchenLights.run('UPDATE kitchen_lights SET brightness = ? WHERE id = 1', [brightness], function (err) {
        if (err) {
            console.error('Error updating brightness:', err);
            return res.status(500).send('Server error');
        }
        res.send({ message: 'Brightness updated successfully' });
    });
});

// Garage Gate and Lights
app.get('/api/garage', (req, res) => {
    dbs.garage.get('SELECT gateStatus, garageCode FROM garage WHERE id = 1', (err, row) => {
        if (err) {
            res.status(500).json({ error: 'Failed to fetch data' });
        } else {
            res.json(row);
        }
    });
});

app.post('/api/garage/status', (req, res) => {
    const { gateStatus } = req.body;
    dbs.garage.run('UPDATE garage SET gateStatus = ? WHERE id = 1', [gateStatus], function (err) {
        if (err) {
            res.status(500).json({ error: 'Failed to update gate status' });
        } else {
            res.json({ success: true });
        }
    });
});

app.post('/api/garage/code', (req, res) => {
    const { oldCode, newCode } = req.body;
    dbs.garage.get('SELECT garageCode FROM garage WHERE id = 1', (err, row) => {
        if (err) {
            res.status(500).json({ error: 'Failed to fetch garage code' });
        } else if (row && row.garageCode === oldCode) {
            dbs.garage.run('UPDATE garage SET garageCode = ? WHERE id = 1', [newCode], function (err) {
                if (err) {
                    res.status(500).json({ error: 'Failed to update garage code' });
                } else {
                    res.json({ success: true });
                }
            });
        } else {
            res.status(400).json({ error: 'Old code is incorrect' });
        }
    });
});

// Living Room Lights
app.get('/api/living-lights', (req, res) => {
    dbs.livingLights.get('SELECT brightness FROM living_lights WHERE id = 1', (err, row) => {
        if (err) {
            console.error('Error fetching brightness:', err.message);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json(row || { brightness: 0 });
        }
    });
});

app.post('/api/living-lights', (req, res) => {
    const { brightness } = req.body;
    if (typeof brightness !== 'number' || brightness < 0 || brightness > 1) {
        return res.status(400).json({ error: 'Invalid brightness value' });
    }
    dbs.livingLights.run('UPDATE living_lights SET brightness = ? WHERE id = 1', [brightness], (err) => {
        if (err) {
            console.error('Error updating brightness:', err.message);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json({ message: 'Brightness updated successfully' });
        }
    });
});

// Study Room Lights
app.get('/api/studyroom-lights', (req, res) => {
    dbs.studyRoomLights.get('SELECT brightness FROM studyroom_lights WHERE id = 1', (err, row) => {
        if (err) {
            console.error('Error fetching brightness:', err.message);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json(row || { brightness: 0 });
        }
    });
});

app.post('/api/studyroom-lights', (req, res) => {
    const { brightness } = req.body;
    if (typeof brightness !== 'number' || brightness < 0 || brightness > 1) {
        return res.status(400).json({ error: 'Invalid brightness value' });
    }
    dbs.studyRoomLights.run('UPDATE studyroom_lights SET brightness = ? WHERE id = 1', [brightness], (err) => {
        if (err) {
            console.error('Error updating brightness:', err.message);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json({ message: 'Brightness updated successfully' });
        }
    });
});

// Coffee Machine
app.post('/api/coffee-machine', (req, res) => {
    const { power } = req.body;
    if (power === undefined) {
        return res.status(400).json({ error: 'Invalid power value' });
    }
    dbs.coffeeMachine.run('UPDATE coffee_machine SET power = ? WHERE id = 1', [power ? 1 : 0], (err) => {
        if (err) {
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json({ success: true });
        }
    });
});

// Stove System
app.get('/api/stove', (req, res) => {
    dbs.stove.all('SELECT * FROM stoves', (err, rows) => {
        if (err) {
            res.status(500).json({ error: 'Failed to fetch stove data' });
        } else {
            res.json(rows);
        }
    });
});

app.post('/api/stove', (req, res) => {
    const { id, state, strength } = req.body;
    if (![0, 1].includes(state) || isNaN(strength)) {
        return res.status(400).json({ error: 'Invalid state or strength' });
    }
    dbs.stove.run('UPDATE stoves SET state = ?, strength = ? WHERE id = ?', [state, strength, id], function (err) {
        if (err) {
            res.status(500).json({ error: 'Failed to update stove data' });
        } else {
            res.json({ message: 'Stove data updated successfully' });
        }
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
