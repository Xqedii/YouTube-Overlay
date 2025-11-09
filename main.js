const { app, BrowserWindow, Tray, Menu, screen, ipcMain, nativeImage } = require('electron');
const path = require('path');
const myServer = require('./server.js');

let win;
let tray;

app.on('ready', () => {
  const { width } = screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width: 320,
    height: 150,
    x: width - 340,
    y: 20,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');
  win.setAlwaysOnTop(true, 'screen-saver');

  myServer.startServer(win);

  ipcMain.on('control', (event, data) => {
    myServer.addElectronCommand(data);
  });


  const iconPath = path.join(__dirname, 'icon.ico');
  const trayIcon = nativeImage.createFromPath(iconPath);
  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Toggle',
      click: () => {
        if (win.isVisible()) win.hide();
        else win.show();
      }
    },
    {
      label: 'Settings',
      click: () => {
        win.webContents.send('toggle-settings');
      }
    },
    {
      label: 'Close',
      click: () => app.quit()
    }
  ]);

  tray.setToolTip('YouTube Overlay');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (win.isVisible()) win.hide();
    else win.show();
  });
});