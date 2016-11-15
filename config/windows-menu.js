const electron = require('electron');
const app = electron.app;

let menuTemplate = [
  {
    label: 'File',
    submenu: [
        { label: 'Open', accelerator: 'Ctrl+O', role: 'open' },
        { label: 'Close', role: 'open' }
    ]
  },
  {
    label: 'Edit',
    submenu: [
        { label: 'Undo', accelerator: 'Ctrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'Shift+Ctrl+Z', role: 'redo' }
    ]
  },
  {
    label: 'View',
    submenu: [{ label: 'Toggle Full Screen',
      accelerator: 'F11',
        click: function (item, focusedWindow) {
          if (focusedWindow) { focusedWindow.setFullScreen(!focusedWindow.isFullScreen()) }
        }
      },
      {
        label: 'Toggle Developer Tools',
        accelerator: 'Ctrl+Shift+I',
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
        { label: 'Minimize', accelerator: 'Ctrl+M',role: 'minimize'},
        { label: 'Close', accelerator: 'Ctrl+W', role: 'close'}
    ]
  }];

// Give this menu to main process
module.exports = {
    menuTemplate
};
