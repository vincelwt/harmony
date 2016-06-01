'use strict';

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const windowStateKeeper = require('electron-window-state');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow () {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 701,
    defaultHeight: 450
  });


  mainWindow = new BrowserWindow({
      height: mainWindowState.height,
      resizable: true,
      width: mainWindowState.width,
      minWidth: 300,
      minHeight: 350,
      acceptFirstMouse: true,
      icon: 'icon.png',
      titleBarStyle: 'hidden'
  });


  mainWindow.setMenu(null);
  mainWindow.loadURL('file://' + __dirname + '/app/index.html');
  //mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
  
  mainWindowState.manage(mainWindow);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
