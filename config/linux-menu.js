const electron = require('electron');
const app = electron.app;

let menuTemplate = [
  {
    label: 'Edit',
    submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        {label: 'Quit', accelerator: 'Cmd+Q', click: function() {force_quit=true; app.quit();}}
    ]
  },
  {
    label: 'View',
    submenu: [{ label: 'Toggle Full Screen',
      accelerator: (function () {
        if (process.platform === 'darwin') {
          return 'Ctrl+Command+F'
        } else {
          return 'F11'
        }
      }),
        click: function (item, focusedWindow) {
          if (focusedWindow) {
            focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
          }
        }
      },
    {
      label: 'Toggle Developer Tools',
      accelerator: (function () {
        if (process.platform === 'darwin') {
          return 'Alt+Command+I'
        } else {
          return 'Ctrl+Shift+I'
        }
      }),
      click: function (item, focusedWindow) {
        if (focusedWindow) {
          focusedWindow.toggleDevTools()
        }
      }
    }]
  },
  {
    label: 'Window',
    role: 'window',
    submenu: [
        { label: 'Minimize', accelerator: 'CmdOrCtrl+M',role: 'minimize'},
        { label: 'Close', accelerator: 'CmdOrCtrl+W', role: 'close'}
    ]
  },
  {
    label: 'Help',
      role: 'help',
      submenu: [{ label: 'Learn More',
        click: function () {
          electron.shell.openExternal('http://electron.atom.io')
        }
      }]
}]

// Give this menu to main process
module.exports = {
    menuTemplate
};
