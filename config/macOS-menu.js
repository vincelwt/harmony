const electron = require('electron');
const app = electron.app;

let menuTemplate = [
  {
    label: 'File',
    submenu: [
        { label: 'Open', accelerator: 'Cmd+O', role: 'open' },
        { label: 'Close', role: 'open' },
        { label: 'Quit', accelerator: 'Cmd+Q', click: function() {force_quit = true; app.quit();} }
    ]
  },
  {
    label: 'Edit',
    submenu: [
        { label: 'Undo', accelerator: 'Cmd+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'Shift+Cmd+Z', role: 'redo' }
    ]
  },
  {
    label: 'View',
    submenu: [
        {
            label: 'Toggle Full Screen',
            accelerator: 'Fn+F11',
            click: function (item, focusedWindow) {
              if (focusedWindow) { focusedWindow.setFullScreen(!focusedWindow.isFullScreen()) }
            }
        },
        {
            label: 'Toggle Developer Tools',
            accelerator: 'Alt+Shift+I',
            click: function (item, focusedWindow) {
              if (focusedWindow) { focusedWindow.toggleDevTools() }
            }
        }
    ]
  },
  {
    label: 'Window',
    role: 'window',
    submenu: [
        { label: 'Minimize', accelerator: 'Cmd+M',role: 'minimize'},
        { label: 'Close', accelerator: 'Cmd+W', role: 'close'}
    ]
  }];

// Give this menu to main process
module.exports = {
    menuTemplate
};
