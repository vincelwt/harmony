var basicContext = require('./js/vendor/basicContext.min.js')

function trackContextMenu(e, index) {
    let items = [
      { title: 'Play next', fn: function(){

        playingTrackList.splice(g.playing.indexPlaying+1, 0, trackList[index]);
        updateTrackListIndexes();

      } },

      { }, // Separator

      { title: 'View artist', fn: function(){

        viewArtist(trackList[index])

      } },

      { title: 'View album', fn: function(){

        viewAlbum(trackList[index])

      } },

      { }, // Separator

      { title: 'Copy URL', fn: function(){

        notifier.notify({ 'title': 'Share URL copied', 'message': 'Song URL successfully copied to clipboard!' });

        window.copyToClipboard(trackList[index].share_url);

      } },

    ]

    basicContext.show(items, e)
}

function soundcloudTrackContextMenu(e, index) {
    let items = [
      { title: 'Play next', fn: function(){

        playingTrackList.splice(g.playing.indexPlaying+1, 0, trackList[index]);
        updateTrackListIndexes();

      } },

      { }, // Separator

      { title: 'View user', fn: function(){

        viewArtist(trackList[index])

      } },

      { }, // Separator

      { title: 'Copy URL', fn: function(){

        window.copyToClipboard(trackList[index].share_url);

      } },

    ]

    basicContext.show(items, e)
}