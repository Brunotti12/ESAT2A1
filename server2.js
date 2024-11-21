// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Setup Express App
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Databases Initialization
const databases = {
    kitchenLights: new sqlite3.Database(path.join(__dirname, 'kitchenlights.db')),
    camera: new sqlite3.Database('./cameraData.db'),
    garage: new sqlite3.Database('./garage.db'),
    livingLights: new sqlite3.Database('./livinglights.db'),
    studyroomLights: new sqlite3.Database('./studyroom.db'),
    kitchenStove: new sqlite3.Database('./kitchen.db'),
    coffeeMachine: new sqlite3.Database('./coffee_machine.db'),
};

// Initialize Databases
const initDatabase = (db, initQueries) => {
    db.serialize(() => {
        initQueries.forEach(query => db.run(query));
    });
};

// Initialize Kitchen Lights Database
initDatabase(databases.kitchenLights, [
    'CREATE TABLE IF NOT EXISTS kitchen_lights (id INTEGER PRIMARY KEY, brightness INTEGER)',
    'INSERT OR IGNORE INTO kitchen_lights (id, brightness) VALUES (1, 0)'
]);

// Initialize Camera Database
initDatabase(databases.camera, [
    'CREATE TABLE IF NOT EXISTS camera_data (id INTEGER PRIMARY KEY AUTOINCREMENT, status TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)'
]);

// Initialize Garage Database
initDatabase(databases.garage, [
    'CREATE TABLE IF NOT EXISTS garage (id INTEGER PRIMARY KEY, gateStatus INTEGER NOT NULL, garageCode TEXT NOT NULL)',
    'INSERT OR IGNORE INTO garage (id, gateStatus, garageCode) VALUES (1, 0, "1234")',
    'CREATE TABLE IF NOT EXISTS garage_lights (id INTEGER PRIMARY KEY, position INTEGER NOT NULL, brightness REAL NOT NULL)',
    'INSERT OR IGNORE INTO garage_lights (id, position, brightness) VALUES (1, 0, 0)'
]);

// Initialize Living Lights Database
initDatabase(databases.livingLights, [
    'CREATE TABLE IF NOT EXISTS living_lights (id INTEGER PRIMARY KEY, brightness REAL)',
    'INSERT OR IGNORE INTO living_lights (id, brightness) VALUES (1, 0.5)'
]);

// Initialize Studyroom Lights Database
initDatabase(databases.studyroomLights, [
    'CREATE TABLE IF NOT EXISTS studyroom_lights (id INTEGER PRIMARY KEY, brightness REAL)',
    'INSERT OR IGNORE INTO studyroom_lights (id, brightness) VALUES (1, 0.5)'
]);

// Initialize Kitchen Stove Database
initDatabase(databases.kitchenStove, [
    `CREATE TABLE IF NOT EXISTS stoves (
        id INTEGER PRIMARY KEY,
        state INTEGER DEFAULT 0,
        strength INTEGER DEFAULT 0
    )`,
    ...Array.from({ length: 4 }).map((_, i) =>
        `INSERT OR IGNORE INTO stoves (id, state, strength) VALUES (${i + 1}, 0, 0)`
    )
]);

// Initialize Coffee Machine Database
initDatabase(databases.coffeeMachine, [
    'CREATE TABLE IF NOT EXISTS coffee_machine (id INTEGER PRIMARY KEY, power BOOLEAN NOT NULL DEFAULT 0)',
    'INSERT OR IGNORE INTO coffee_machine (id, power) VALUES (1, 0)'
]);

// Routes

// Alarm System
let alarmSettings = { alarmCode: '1234', alarmStatus: false };

app.get('/api/settings', (req, res) => {
    res.json(alarmSettings);
});

app.post('/api/settings/status', (req, res) => {
    const { alarmCode } = req.body;
    if (alarmCode === alarmSettings.alarmCode) {
        alarmSettings.alarmStatus = !alarmSettings.alarmStatus;
        res.json({ alarmStatus: alarmSettings.alarmStatus });
    } else {
        res.status(401).json({ message: 'Incorrect code' });
    }
});

app.post('/api/settings/update', (req, res) => {
    const { oldAlarmCode, newAlarmCode } = req.body;
    if (oldAlarmCode === alarmSettings.alarmCode) {
        alarmSettings.alarmCode = newAlarmCode;
        res.json({ message: 'Alarm code updated successfully' });
    } else {
        res.status(401).json({ message: 'Old code is incorrect' });
    }
});

// Camera
app.post('/api/camera', (req, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).send({ error: 'Invalid status' });

    databases.camera.run('INSERT INTO camera_data (status) VALUES (?)', [status], function (err) {
        if (err) {
            res.status(500).send({ error: 'Failed to save camera status' });
        } else {
            res.status(200).send({ message: 'Camera status saved', id: this.lastID });
        }
    });
});

// Kitchen Lights
app.get('/api/kitchen-lights', (req, res) => {
    databases.kitchenLights.get('SELECT brightness FROM kitchen_lights WHERE id = 1', (err, row) => {
        if (err) return res.status(500).send('Server error');
        res.json({ brightness: row ? row.brightness : 0 });
    });
});

app.post('/api/kitchen-lights', (req, res) => {
    const { brightness } = req.body;
    if (brightness === undefined || isNaN(brightness)) return res.status(400).send('Invalid brightness value');

    databases.kitchenLights.run('UPDATE kitchen_lights SET brightness = ? WHERE id = 1', [brightness], function (err) {
        if (err) return res.status(500).send('Server error');
        res.send({ message: 'Brightness updated successfully' });
    });
});

// Garage
app.get('/api/garage', (req, res) => {
    databases.garage.get('SELECT gateStatus, garageCode FROM garage WHERE id = 1', (err, row) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch data' });
        res.json(row || { gateStatus: 0, garageCode: '1234' });
    });
});

app.post('/api/garage/status', (req, res) => {
    const { gateStatus } = req.body;
    databases.garage.run('UPDATE garage SET gateStatus = ? WHERE id = 1', [gateStatus], function (err) {
        if (err) return res.status(500).json({ error: 'Failed to update gate status' });
        res.json({ success: true });
    });
});

app.post('/api/garage/code', (req, res) => {
    const { oldCode, newCode } = req.body;
    databases.garage.get('SELECT garageCode FROM garage WHERE id = 1', (err, row) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch garage code' });
        if (row && row.garageCode === oldCode) {
            databases.garage.run('UPDATE garage SET garageCode = ? WHERE id = 1', [newCode], function (err) {
                if (err) return res.status(500).json({ error: 'Failed to update garage code' });
                res.json({ success: true });
            });
        } else {
            res.status(400).json({ error: 'Old code is incorrect' });
        }
    });
});

// Add similar structured routes for the remaining systems...

// Start Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
