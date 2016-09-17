var basicContext = require('./js/vendor/basicContext.min.js')
var index;

function trackContextMenu(e, listIndex) {

    index = listIndex;

    let items = [
      { title: 'Play next', fn: function(){

        playingTrackList.splice(g.playing.indexPlaying+1, 0, trackList[index]);
        updateTrackListIndexes();

      } },

      { } // Separator
    ];

    items = items.concat(window[trackList[index].service].contextmenuItems).concat([

      { }, // Separator

      { title: 'Copy URL', fn: function(){

        notifier.notify({ 'title': 'Share URL copied', 'message': 'Song URL successfully copied to clipboard!' });

        window.copyToClipboard(trackList[index].share_url);

      } },

    ]);

    basicContext.show(items, e)
}
