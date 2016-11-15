'use strict';

const electron = require('electron');
const { app, Menu, Tray } = require('electron')
const BrowserWindow = electron.BrowserWindow;
const menu = electron.Menu;
const globalShortcut = electron.globalShortcut;
const windowStateKeeper = require('electron-window-state');
const Configstore = require('configstore');
const conf = new Configstore("harmony");

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
		height: mainWindowState.height,
		resizable: true,
		width: mainWindowState.width,
		minWidth: 140,
		minHeight: 86,
		acceptFirstMouse: true,
		icon: 'icon.png',
		titleBarStyle: 'hidden'
	});

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

	// Gets menu object based on platform app is currently running on
	let menuTemplate;
	switch(process.platform) {
		case 'darwin':
			menuTemplate = require('~/config/macOS-menu').menuTemplate;
			break;
		case 'win32':
			menuTemplate = require('~/config/windows-menu').menuTemplate;
			break;
		default:
			menuTemplate = require('~/config/linux-menu').menuTemplate;
	};

	// Creates a new platform-specific menu from our template above
	menu.setApplicationMenu(menu.buildFromTemplate(menuTemplate));

	// Loads the actual html file that serves as our UI frontend
	mainWindow.loadURL('file://' + __dirname + '/app/index.html');

	// Handles the window being closed
	mainWindow.on('closed', () => {
		mainWindow = null;
	})

	if (!conf.get("settings") || !conf.get("settings").tray) return;

	tray = new Tray(__dirname + '/icon.png');

	let contextMenu = Menu.buildFromTemplate([
		{ label: 'Favorite', click: function() { mainWindow.webContents.executeJavaScript("FavPlaying(true)") } },
		{ label: 'Play/Pause', click: function() { mainWindow.webContents.executeJavaScript("playPause()") } },
		{ label: 'Next', click: function() { mainWindow.webContents.executeJavaScript("nextTrack()") } },
		{ label: 'Previous', click: function() { mainWindow.webContents.executeJavaScript("prevTrack()") } },
		{ type: "separator" },
		{ label: 'Show player', click: function() { mainWindow.show() } },
		{ label: 'Hide player', click: function() { mainWindow.hide() } },
		{ label: 'Quit', click: function() { app.quit() } }
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

app.on('ready', function () {
	if (process.platform == 'darwin') {
		globalShortcut.register('Command+Q', function () {
			app.quit();
		});
	}
	createWindow();
});

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
