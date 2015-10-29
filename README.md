## Features

![Nem](screenshot.png?raw=true "Nem")

* No need to login, based on Soundcloud public data
* Super sleek interface
* Full keyboard control
* Distraction-free

### Controls
**Space** -> Play/Pause

**N** -> Next track

**S (coming soon)** -> Shuffle playlist

## Instructions

Tested on Ubuntu and Elementary OS.

#### Install dependencies 
>pip install -r requirements.txt

**On OSX you may need to :**

> brew install pygobject pygobject3 gstreamer gst-plugins-base

#### Complete the config.py file with:

**A Soundcloud username:** the last part of a profile url. For example if your profile is http://soundcloud.com/coolusername, coolusername is your username.

**A valid SoundCloud API client_id** (you can find a lot by [searching Github](https://github.com/search?q=soundcloud+client_id&type=Code&utf8=%E2%9C%93))

## Todo
* Cross-platform notifications (when a track is playing)
* Play all public playlists (not only favorites)
* Error handling when no internet or invalid username
* Shuffle function
* Better icon corresponding to "Nem"
* Package with all dependencies for easy install
