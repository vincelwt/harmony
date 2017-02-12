'use strict';

var screenshots = ['scr1', 'scr2', 'scr3', 'scr4'];

document.addEventListener('DOMContentLoaded', function() {
    initDownload();
    setImages();
});

function setImages() {
    var odd = false;
    each('.feature>img', function(el) {
        if (odd) {
            el.parentNode.insertBefore(el, el.parentNode.firstChild);
        }
        odd = !odd;
    });
}

function initDownload() {
    var os = detectOs();
    if (os) {
        setDownloadButton(os);
    }
}

function detectOs() {
    var platform = navigator.platform.toLowerCase();
    if (platform.indexOf('mac') >= 0) {
        return 'mac';
    }
    if (platform.indexOf('linux') >= 0) {
        return 'linux';
    }
    if (platform.indexOf('win') >= 0) {
        return 'win32';
    }
    return undefined;
}

function setDownloadButton(os) {
    setDownloadButtonTitle(os);
    setLatestReleaseUrl(os);
}

function setDownloadButtonTitle(os) {
    each('.btn-download>.btn-desc', function(el) {
        switch (os) {
            case 'mac':
                el.innerHTML = '<i class="fa fa-apple"></i> for Mac OS X';
                break;
            case 'win32':
                el.innerHTML = '<i class="fa fa-windows"></i> for Windows';
                break;
            case 'linux':
                el.innerHTML = '<i class="fa fa-linux"></i> for Linux';
                break;
        }
    });
    each('.btn-sub-link', function(el) {
        el.style.display = 'block';
    });
}

function setLatestReleaseUrl(os) {
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.addEventListener('load', function() {
        releasesLoaded(xhr.response, os)
    });
    xhr.open('GET', 'https://api.github.com/repos/antelle/keeweb/releases/latest');
    xhr.send();
}

function releasesLoaded(releaseInfo, os) {
    var knownAssets = [
        'KeeWeb.linux.x64.deb',
        'KeeWeb.mac.dmg',
        'KeeWeb.win32.exe'
    ];
    var url;
    releaseInfo.assets.forEach(function(asset) {
        if (asset.name.indexOf(os) > 0 && knownAssets.indexOf(asset.name) >= 0) {
            url = asset.browser_download_url;
        }
    });
    if (url) {
        each('.btn-download', function(el) {
            el.setAttribute('href', url);
        });
    }
}

function rotateScreenshot(next) {
    var el = document.getElementById('scr-large');
    var src = el.getAttribute('src');
    var pic = src.match(/scr\d/)[0];
    var ix = screenshots.indexOf(pic);
    ix = (ix + screenshots.length + (next ? 1 : -1)) % screenshots.length;
    src = src.replace(pic, screenshots[ix]);
    el.setAttribute('src', src);
    each('.screenshot-loader', function(el) {
        el.style.display = 'inline-block';
    });
}

function screenshotLoaded() {
    each('.screenshot-loader', function(el) {
        el.style.display = 'none';
    });
}

function each(sel, fn) {
    Array.prototype.forEach.call(document.querySelectorAll(sel), fn);
}
