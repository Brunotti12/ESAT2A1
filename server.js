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

const alarmDb = new sqlite3.Database('./alarm.db');
const garageDb = new sqlite3.Database('./garage.db');
const garageLightDb = new sqlite3.Database('./garage_lights');
const studyLightDb = new sqlite3.Database('./studyRoomLight.db');
const cameraDb = new sqlite3.Database('./camera.db');
const kitchenLightDb = new sqlite3.Database('./kitchenLight.db');
const LivingLightsDB = new sqlite3.Database('./livinglights.db');
const stoveDb = new sqlite3.Database('./stove.db');
const CoffeeDb = new sqlite3.Database('./coffeeMachine.db')
const TVDb = new sqlite3.Database('Television.db');
const SBDb = new sqlite3.Database('./Soundboxes.db');

// Routes
// Alarm System
{
app.get('/api/settings', (req, res) => {
    alarmDb.get("SELECT * FROM settings WHERE id = 1", [], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error fetching alarm settings' });
        }
        if (!row) {
            return res.status(404).json({ message: 'Alarm settings not found' });
        }
        res.json({ alarmCode: row.alarmCode, alarmStatus: row.alarmStatus });
    });
});

app.post('/api/settings/status', (req, res) => {
    const { alarmCode } = req.body;

    alarmDb.get("SELECT * FROM settings WHERE id = 1", [], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error fetching alarm settings' });
        }

        if (row && alarmCode === row.alarmCode) {
            const newStatus = !row.alarmStatus;
            alarmDb.run("UPDATE settings SET alarmStatus = ? WHERE id = 1", [newStatus], function (err) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Error updating alarm status' });
                }
                res.json({ alarmStatus: newStatus });
            });
        } else {
            res.status(401).json({ message: 'Incorrect alarm code' });
        }
    });
});

app.post('/api/settings/update', (req, res) => {
    const { oldAlarmCode, newAlarmCode } = req.body;

    alarmDb.get("SELECT * FROM settings WHERE id = 1", [], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error fetching alarm settings' });
        }

        if (row && oldAlarmCode === row.alarmCode) {
            alarmDb.run("UPDATE settings SET alarmCode = ? WHERE id = 1", [newAlarmCode], function (err) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Error updating alarm code' });
                }
                res.json({ message: 'Alarm code updated successfully' });
            });
        } else {
            res.status(401).json({ message: 'Old code is incorrect' });
        }
    });
});
}

// Garage

{
app.get('/api/garage', (req, res) => {
    garageDb.get("SELECT * FROM garage WHERE id = 1", [], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error fetching Garage settings' });
        }
        if (!row) {
            return res.status(404).json({ message: 'Garage settings not found' });
        }
        res.json({ gateStatus: row.gateStatus, garageCode: row.garageCode });
    });
});

app.post('/api/garage/status', (req, res) => {
    const { garageCode } = req.body;
    console.log(garageCode);

    garageDb.get("SELECT * FROM garage WHERE id = 1", [], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error fetching Garage settings' });
        }

        if (row && garageCode === row.garageCode) {
            const newStatus = !row.gateStatus;
            garageDb.run("UPDATE garage SET gateStatus = ? WHERE id = 1", [newStatus], function (err) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Error updating garage status' });
                }
                res.json({ gateStatus: newStatus });
            });
        } else {
            res.status(401).json({ message: 'Incorrect alarm code' });
        }
    });
});

app.post('/api/garage/update', (req, res) => {
    const { oldGarageCode, newGarageCode } = req.body;

    garageDb.get("SELECT * FROM garage WHERE id = 1", [], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error fetching garage settings' });
        }

        if (row && oldGarageCode === row.garageCode) {
            garageDb.run("UPDATE garage SET garageCode = ? WHERE id = 1", [newGarageCode], function (err) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Error updating garage code' });
                }
                res.json({ message: 'Garage code updated successfully' });
            });
        } else {
            res.status(401).json({ message: 'Old code is incorrect' });
        }
    });
});



app.get('/api/garage_lights', (req, res) => {
    garageDb.get("SELECT * FROM garage_lights WHERE id = 1", [], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error fetching light settings' });
        }
        if (!row) {
            return res.status(404).json({ message: 'Light settings not found' });
        }
        res.json({ position: row.position, brightness: row.brightness });
    });
});

app.post('/api/garage_lights/update', (req, res) => {
    const { newPosition, newBrightness } = req.body;
    garageDb.run("UPDATE garage_lights SET position = ? WHERE id = 1", [newPosition], function (err) {
        if(err){
            console.error(err);
            return res.status(500).json({message: "Error saving location data"});
        }
    });
    garageLightDb.run("Update garage_lights SET brightness = ? WHERE id = 1", [newBrightness], function (err){
        if(err){
            console.error(err);
            return res.status(500).json({message: "Error saving brightness data"});
        }
    });

});
}

// Camera
{

app.get('/api/camera', (req, res) => {
    cameraDb.get("SELECT * FROM camera WHERE id = 1", [], (err, row) => {
        if(err){
            console.error(err);
            return res.status(500).json({message: "Data not found"});
        }
        if(!row){
            return res.status(404).json({message: "Not found"});
        }
        res.json({cameraStatus: row.cameraStatus});
    });
});



app.post('/api/camera/update', (req, res) => {
    const { newStatus } = req.body;
    camderaDb.run("UPDATE camera SET cameraStatus = ? WHERE id = 1", [newStatus], function(err){
        if(err){
            console.error(err);
            return res.status(500).json({message: "failed to save data"});
        }
    });
});

app.post('/api/camera', (req, res) => {
});
}

//study Room
app.get('/api/studyroom-lights', (req, res) => {
    studyLightDb.get("SELECT * FROM studyRoomLight WHERE id = 1", [], (err, row) => {
        if(err){
            console.error(err);
            return res.status(500).json({message: "Error fetching data"});
        }
        if(!row){
            return res.status(404).json("ID not found in table");
        }
        res.json({position: row.position, brightness: row.brightness});
    });
});

app.post('/api/studyroom-lights/update', (req, res) => {
    const {newPosition, newBrightness} = req.body;
    studyLightDb.run("UPDATE studyRoomLight SET brightness = ? WHERE id = 1", [newBrightness], function (err){
        if(err){
            console.log(err);
            return res.status(500).json({message: "Error storing data"});
        }
    });

    studyLightDb.run("UPDATE studyRoomLight SET position = ? WHERE id = 1", [newPosition], function (err){
        if (err){
            console.log(err);
            return res.status(500).json({message: "Error storing data"});
        }
    });
});

}

// Kitchen Lights
{

app.get('/api/kitchenLight', (req, res) => {
    kitchenLightDb.get("SELECT * FROM kitchenLight where id = 1", [], (err, row) => {
        if(err){
            console.error(err);
            return res.status(500).json({message: "not found"});
        }
        if(!row){
            return res.status(404).json({message: "not found"});
        }
        res.json({position: row.position, brightness: row.brightness});
    });
});

app.post('/api/kitchenLight/update', (req, res) => {
    const {newPosition, newBrightness} = req.body;
    kitchenLightDb.run("UPDATE kitchenLight SET position = ? WHERE id = 1", [newPosition], function(err){
        if(err){
            console.error(err);
            return res.status(500).json({message: "error"});
        }
    });
    kitchenLightDb.run("UPDATE kitchenLight SET brightness = ? WHERE id = 1", [newBrightness], function (err){
        if(err){
            console.error(err);
            return res.status(500).json({message: "error"});
        }
    });
});
}

// LivingLights
{

    app.get('/api/living-lights', (req, res) => {
        LivingLightsDB.get("SELECT * FROM living_lights WHERE id = 1", [], (err, row) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Error fetching light settings' });
            }
            if (!row) {
                return res.status(404).json({ message: 'Light settings not found' });
            }
            res.json({ position: row.position, brightness: row.brightness });
        });
    });
    
    app.post('/api/living-lights/update', (req, res) => {
        const { newPosition, newBrightness } = req.body;
        LivingLightsDB.run("UPDATE living_lights SET position = ? WHERE id = 1", [newPosition], function (err) {
            if(err){
                console.error(err);
                return res.status(500).json({message: "Error saving location data"});
            }
        });
        LivingLightsDB.run("Update living_lights SET brightness = ? WHERE id = 1", [newBrightness], function (err){
            if(err){
                console.error(err);
                return res.status(500).json({message: "Error saving brightness data"});
            }
        });
    
    });
    
}


// Stove


// GET endpoint to fetch stove data from the database
app.get('/api/stove-data', (req, res) => {
    const sql = 'SELECT * FROM stove_data ORDER BY id DESC LIMIT 1'; // Get the most recent row
    stoveDb.get(sql, (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            S1S: row.S1S,
            S1P: row.S1P,
            S2S: row.S2S,
            S2P: row.S2P,
            S3S: row.S3S,
            S3P: row.S3P,
            S4S: row.S4S,
            S4P: row.S4P,
        });
    });
});

// POST endpoint to update stove data in the database
app.post('/api/update-stove', (req, res) => {
    const { S1S, S1P, S2S, S2P, S3S, S3P, S4S, S4P } = req.body;

    const sql = `
        INSERT INTO stove_data (S1S, S1P, S2S, S2P, S3S, S3P, S4S, S4P)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
    stoveDb.run(sql, [S1S, S1P, S2S, S2P, S3S, S3P, S4S, S4P], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(200).send('Stove data updated successfully');
    });
});


// CoffeeMachine


// Fetch the current state of the coffee machine
app.get('/api/coffee-machine', (req, res) => {
    CoffeeDb.get('SELECT power FROM coffeeMachineState ORDER BY id DESC LIMIT 1', (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({
          power: row ? row.power : 0,  // Default to 0 if no data found
        });
      }
    });
  });
  
  // Toggle coffee machine power
  app.post('/api/coffee-machine', (req, res) => {
    const { power } = req.body;
    CoffeeDb.run('INSERT INTO coffeeMachineState (power) VALUES (?)', [power ? 1 : 0], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        if (power === 0) {
          // Clear the queue when turning off the machine
          CoffeeDb.run('DELETE FROM coffeeQueue', (err) => {
            if (err) {
              console.error('Error clearing queue:', err.message);
            }
          });
        }
        res.status(200).json({ success: true });
      }
    });
  });
  
  // Get all orders from the queue
  app.get('/api/coffee-machine/queue', (req, res) => {
    CoffeeDb.all('SELECT * FROM coffeeQueue ORDER BY timestamp ASC', (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    });
  });
  
  // Add a coffee order to the queue
  app.post('/api/coffee-machine/order', (req, res) => {
    const { type } = req.body;
    const timestamp = new Date().toISOString();
    CoffeeDb.run('INSERT INTO coffeeQueue (type, status, timestamp) VALUES (?, ?, ?)', [type, 'pending', timestamp], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(200).json({ success: true, id: this.lastID });
      }
    });
  });
  
  // Update the status of a coffee in the queue
  app.post('/api/coffee-machine/update-status', (req, res) => {
    const { id, status } = req.body;
    CoffeeDb.run('UPDATE coffeeQueue SET status = ? WHERE id = ?', [status, id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(200).json({ success: true });
      }
    });
  });
  
  // Automatically remove pending orders older than 20 seconds
  function removeOldOrders() {
    const timeLimit = new Date(Date.now() - 20 * 1000).toISOString();  // 20 seconds ago
    CoffeeDb.run('DELETE FROM coffeeQueue WHERE status = "pending" AND timestamp < ?', [timeLimit], (err) => {
      if (err) {
        console.error('Error removing old pending orders:', err.message);
      }
    });
  }
  
  // Set interval to check for and remove old pending orders every 5 seconds
  setInterval(removeOldOrders, 5000);
  


// Television
// Endpoint to get the TV status
app.get('/api/television/state', (req, res) => {
    TVDb.get('SELECT status FROM tv WHERE id = 1', (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ state: row ? (row.status === 1 ? 'on' : 'off') : 'off' });
    });
});

// Endpoint to update the TV status
app.post('/api/television/state', (req, res) => {
    const { state } = req.body;
    const newStatus = state === 'on' ? 1 : 0;

    TVDb.run('UPDATE tv SET status = ? WHERE id = 1', [newStatus], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});


// Soundboxes
// API to get the current soundbox state
app.get('/api/soundbox/state', (req, res) => {
    SBDb.get('SELECT status FROM sb WHERE id = 1', (err, row) => {
      if (err) {
        res.status(500).json({ success: false, error: err });
        return;
      }
      res.json({ state: row ? (row.status === 1 ? 'on' : 'off') : 'off' });
    });
  });
  
  // API to update the soundbox state
  app.post('/api/soundbox/state', (req, res) => {
    const { state } = req.body;
    const status = state === 'on' ? 1 : 0;
  
    SBDb.run('UPDATE sb SET status = ? WHERE id = 1', [status], function (err) {
      if (err) {
        res.status(500).json({ success: false, error: err });
        return;
      }
      res.json({ success: true });
    });
  });




// Start Server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});

