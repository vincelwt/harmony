'use strict';

const electron = require('electron');
const { app, Menu, Tray } = require('electron');
const BrowserWindow = electron.BrowserWindow;
const windowStateKeeper = require('electron-window-state');
const Configstore = require('configstore');
const conf = new Configstore("harmony");
require('electron-debug')();

let willQuitApp = false;
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

let tray = null;

function createWindow() {
	let mainWindowState = windowStateKeeper({
		defaultWidth: 701,
		defaultHeight: 450
	});

	mainWindow = new BrowserWindow({
		resizable: true,
		height: mainWindowState.height,		
		width: mainWindowState.width,
		x: mainWindowState.x,
		y: mainWindowState.y,
		minWidth: 140,
		minHeight: 86,
		acceptFirstMouse: true,
		icon: 'icons/icon.png',
		titleBarStyle: 'hidden'
	});


	mainWindow.setMenu(null);
	mainWindow.loadURL('file://' + __dirname + '/app/index.html');
	//mainWindow.webContents.openDevTools();

	mainWindow.on('close', function(e) {
		if (willQuitApp || process.platform !== 'darwin') {
			/* the user tried to quit the app */
			mainWindow = null;
		} else {
			/* the user only tried to close the window */
			e.preventDefault();
			mainWindow.hide();
		}
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
				{ label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
				{ label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
				{ label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
				{ label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" },
				{ type: "separator" },
				{ label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); } }
			]
		}];

		Menu.setApplicationMenu(Menu.buildFromTemplate(template));
	}

	if (!conf.get("settings") || !conf.get("settings").tray) return;

	var trayIconStyle = conf.get("settings").trayIconStyle;
	function trayIconSwitch(style) {
		switch (style) {
			case 'normal': return 'icon';
			case 'white': return 'icon-white';
			case 'black': return 'icon-black';
			default: return 'icon';
		}
	}
	var icon = trayIconSwitch(trayIconStyle);

	tray = new Tray(__dirname + '/icons/'+icon+'.png');

	var contextMenu = Menu.buildFromTemplate([
		{ icon: __dirname + '/icons/tray/heart.png', label: 'Favorite', click: function() { mainWindow.webContents.executeJavaScript("FavPlaying(true)") } },
		{ icon: __dirname + '/icons/tray/pause.png', label: 'Play/Pause', click: function() { mainWindow.webContents.executeJavaScript("playPause()") } },
		{ icon: __dirname + '/icons/tray/next.png',label: 'Next', click: function() { mainWindow.webContents.executeJavaScript("nextTrack()") } },
		{ icon: __dirname + '/icons/tray/previous.png', label: 'Previous', click: function() { mainWindow.webContents.executeJavaScript("prevTrack()") } },
		{ type: "separator" },
		{ icon: __dirname + '/icons/tray/show.png', label: 'Show player', click: function() { mainWindow.show() } },
		{ icon: __dirname + '/icons/tray/hide.png', label: 'Hide player', click: function() { mainWindow.hide() } },
		{ icon: __dirname + '/icons/tray/quit.png', label: 'Quit', click: function() { app.quit() } }
	]);

	tray.on('click', function() {
		if (process.platform == 'darwin' || process.platform == 'win32') {
			tray.popUpContextMenu(contextMenu);
		} else {
			mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
		}
	});

	tray.setToolTip('Harmony Player')
	tray.setContextMenu(contextMenu);

}

app.setName('Harmony');

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// 'activate' is emitted when the user clicks the Dock icon (OS X)
app.on('activate', function() {
	mainWindow.show();
});

// 'before-quit' is emitted when Electron receives 
// the signal to exit and wants to start closing windows
app.on('before-quit', function() {
	willQuitApp = true;
});

app.on('window-all-closed', function() {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
