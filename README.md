## Features

![Nem](screenshot.png?raw=true "Nem")

* Super sleek interface
* Keyboard control
* Distraction-free
* Notification when a track start playing

### Controls
**Space** -> Play/Pause

**N** -> Next track

**L** -> Like track

**S (coming soon)** -> Shuffle playlist

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
* Caching of data
* Progress bar instead of "loading..."
* Play all playlists (not only favorites)
* Shuffle function
* Better icon corresponding to "Nem"
