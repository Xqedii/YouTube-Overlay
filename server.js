const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require('cors');

const PORT = 3005;
const HOST = "127.0.0.1";

let mainWindow = null;
let commandQueue = [];

function startServer(win) {
    mainWindow = win;

    const app = express();
    const server = http.createServer(app);
    const io = new Server(server, { cors: { origin: "*" } });

    app.use(cors());
    app.use(express.json({ limit: '5mb' }));

    let currentData = {
        title: "", subtitle: "", time: "", image: "",
        running: 2, shuffle: 2, repeat: 2, bassIntensity: 0,
    };

    app.post("/update", (req, res) => {
        try {
            currentData = req.body;

            if (mainWindow) {
                mainWindow.webContents.send('update-data', currentData);
            }
            io.emit("update", currentData);

            res.sendStatus(200);
        } catch (error) {
            res.sendStatus(500);
        }
    });

    app.get("/poll", (req, res) => {
        if (commandQueue.length > 0) {
            const command = commandQueue.shift();
            res.json(command);
        } else {
            res.json({});
        }
    });

    io.on("connection", (socket) => {
        socket.emit("update", currentData);
    });

    server.listen(PORT, HOST);
}

function addElectronCommand(command) {
    commandQueue.push(command);
}

module.exports = { startServer, addElectronCommand };
