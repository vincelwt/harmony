'use strict';

const electron = require('electron');
const {Menu} = require('electron');
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
      minWidth: 120,
      minHeight: 38,
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


  // Create the Application's main menu
  if (process.platform == 'darwin') { // To enable shortcuts on OSX

    var template = [{
          label: "Harmony",
          submenu: [
              { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
              { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
              { type: "separator" },
              { label: 'Developer Tools', accelerator: 'Alt+CmdOrCtrl+I',
                click (item, focusedWindow) {
                  if (focusedWindow) focusedWindow.webContents.toggleDevTools()
                }
              },
              { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
              { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
              { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
              { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" },
              { type: "separator" },
              { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
          ]}
      ];

      Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  }


}

app.setName('Harmony');

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
