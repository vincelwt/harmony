## Features

![Nem](screenshot.png?raw=true "Nem")

* Super sleek interface
* Full keyboard control
* Distraction-free

### Controls
**Space** -> Play/Pause

**N** -> Next track

**S (coming soon)** -> Shuffle playlist

**L (coming soon)** -> Like track

## Instructions

Tested on Ubuntu and Elementary OS.

#### Install dependencies 
>pip install -r requirements.txt

**On OSX you may need to :**

> brew install pygobject pygobject3 gstreamer gst-plugins-base

#### Complete the config.py file with:

**Your Soundcloud username:** the last part of your profile url. For example if your profile is http://soundcloud.com/coolusername, coolusername is your username.
**Your Soundcloud password**
**A valid SoundCloud API client_id and client_secret** (you can find a lot by [searching Github](https://github.com/search?utf8=%E2%9C%93&q=soundcloud+client+secret&type=Code&ref=searchresults))

## Todo
* Like a track
* Notifications (when a track is playing)
* Caching of data
* Progress bar instead of "loading..."
* Play all playlists (not only favorites)
* Error handling when no internet or invalid username
* Shuffle function
* Better icon corresponding to "Nem"
