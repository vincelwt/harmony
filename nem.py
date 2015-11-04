#!/usr/bin/python
# encoding=utf8
import soundcloud
import os
import gi
from gi.repository import Gst, GObject, Gtk, GLib, Gdk
import config

client = soundcloud.Client(client_id=config.api_client_id, client_secret=config.api_client_secret, username= config.username, password=config.password)

favorites_tracks = []
mystream_tracks = []
tracks = []

def milliToR(miliseconds):
    hours, milliseconds = divmod(miliseconds, 3600000)
    minutes, milliseconds = divmod(miliseconds, 60000)
    seconds = round(float(milliseconds) / 1000, 0)
    #if hours != 0:
    #    s = "%02i:%02i:%02i" % (hours, minutes-60*hours, seconds)
    #else:
    s = "%02i:%02i" % (minutes, seconds)
    return str(s)
    
def get_resource_path(rel_path):
    dir_of_py_file = os.path.dirname(__file__)
    rel_path_to_resource = os.path.join(dir_of_py_file, rel_path)
    abs_path_to_resource = os.path.abspath(rel_path_to_resource)
    return abs_path_to_resource

class GTK_Main(object):

    def getSoundcloudData(self):
        #Get first 200 items (limit) of tracks
        rqt = client.get("/me/favorites", limit=200, linked_partitioning=1)
        temp_tracks = []
        temp_tracks.extend(rqt.collection)
        while hasattr(rqt, 'next_href'): # Iterate through all pages of soundcloud favorites
            rqt = client.get(rqt.next_href)
            temp_tracks.extend(rqt.collection)

        for i in temp_tracks:
            if hasattr(i, 'title') and hasattr(i, 'duration') and hasattr(i, 'stream_url'):
                tracks.append({'type': 'favorites', 'title': i.title, 'duration': i.duration, 'stream_url': i.stream_url})


        #Get only 200 items (limit) of tracks
        rqt = client.get("/me/activities", limit=200)
        temp_tracks = []
        temp_tracks.extend(rqt.collection)

        for i in temp_tracks:
            if i.type == "track" or i.type == "track-sharing" or i.type == "track-repost":
                if hasattr(i.origin, 'title') and hasattr(i.origin, 'duration') and hasattr(i.origin, 'stream_url'):
                    tracks.append({'type': 'mystream', 'title': i.origin.title, 'duration': i.origin.duration, 'stream_url': i.origin.stream_url})
        # Loading finished, show data
        self.vbox.remove(self.loading)
        self.scrolledwindow.show()
        self.loadMyStream('')
         
    def playStream(self, iter):
        model = self.treeview.get_model()
        #Check if a song is already playing, and erase it's status icon
        if 'playing_cell' in globals():
            self.liststore.set_value(playing_cell, 0, '')
        global playing_cell
        playing_cell = iter
        self.liststore.set_value(playing_cell, 0, Gtk.STOCK_MEDIA_PLAY)
        
        track = model[iter][1]
        for f in tracks:
            if f['title'].encode('ascii', 'ignore') == track:
                self.window.set_title(track)
                old_state = self.player.get_state(0)[1]
                if old_state == Gst.State.PAUSED:
                    self.player.set_state(Gst.State.NULL)
                else:
                    self.player.set_state(Gst.State.NULL)
                    
                self.player.set_property("uri", f['stream_url']+"?client_id="+client.client_id)
                self.player.set_state(Gst.State.PLAYING) 
    
    def onClickRow(self, treeview, path, column):
        model = treeview.get_model()
        iter = model.get_iter(path)
        self.playStream(iter)
                
    def PlayPause(self):
        old_state = self.player.get_state(0)[1]
        if old_state == Gst.State.PAUSED:
            self.player.set_state(Gst.State.PLAYING)
            self.liststore.set_value(playing_cell, 0, Gtk.STOCK_MEDIA_PLAY)
        elif old_state == Gst.State.PLAYING:
            self.player.set_state(Gst.State.PAUSED)
            self.liststore.set_value(playing_cell, 0, Gtk.STOCK_MEDIA_PAUSE)
        else:
            # We play the first track
            model = self.treeview.get_model()
            iter = model.get_iter_first()
            self.playStream(iter) 

    def NextTrack(self):
        if 'playing_cell' in globals():
           next_iter = self.liststore.iter_next(playing_cell) 
           self.playStream(next_iter)

    def OnGstMessage(self, bus, message):
        if message.type == Gst.MessageType.EOS:
          self.NextTrack()
        elif message.type == Gst.MessageType.ERROR:
            print("error occured reading this track, next")       
            self.NextTrack()
          
    def KeyPressed(self, widget, event):
        keyname = Gdk.keyval_name(event.keyval)
        if keyname == "space":
            self.PlayPause()
            return True
        elif keyname == "n":
            self.NextTrack()
            return True

    def loadFavorites(self, a):
        self.liststore.clear()
        for i in tracks:
            if i['type'] == "favorites":
                self.liststore.append(['  ', i['title'].encode('ascii', 'ignore'), milliToR(i['duration'])])

    def loadMyStream(self, a):
        self.liststore.clear()
        for i in tracks:
            if i['type'] == "mystream":
                self.liststore.append(['  ', i['title'].encode('ascii', 'ignore'), milliToR(i['duration'])])

            
    def __init__(self):     
        self.window = Gtk.Window(Gtk.WindowType.TOPLEVEL)
        self.window.set_default_size(400, 600)
        self.window.set_border_width(0)
        self.window.set_title("Nem")
        self.window.set_icon_from_file(get_resource_path("icon.png"))
        self.window.connect("destroy", Gtk.main_quit, "WM destroy")
        self.window.connect('key_press_event', self.KeyPressed)
    
        # ---------------- Cross platform & theme-independent style -------------------
        style_provider = Gtk.CssProvider()
        style_provider.load_from_data('''
        GtkTreeView row:nth-child(even) { background-color: #F5F5F5; color: #333333}
        GtkTreeView row:nth-child(odd) { background-color: #FFFFFF; color: #333333}
        GtkTreeView row:selected { background-color: #3D9BDA; color: #FFFFFF}
        ''')
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(), style_provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION)
        #---------------------------------------------------------------------------------
        
        self.vbox = Gtk.VBox(orientation=Gtk.Orientation.VERTICAL, spacing=6)
        self.window.add(self.vbox)

        self.liststore = Gtk.ListStore(str, str, str)
        self.treeview = Gtk.TreeView(self.liststore)
        self.treeview.connect('row-activated', self.onClickRow) #Double click handler
        self.treeview.set_rules_hint(True)  #Different color for each row
        self.treeview.set_headers_visible(False) # Hide headers
        self.treeview.set_property('height-request', 500)        
        self.treeview.set_search_column(-1) #not searchable (so keypress events don't interfers
        self.treeview.set_reorderable(True) #drag & drop rows
  
        # create the TreeViewColumns to display the data
        self.statusColumn = Gtk.TreeViewColumn('')
        self.trackColumn = Gtk.TreeViewColumn('Track')
        self.timeColumn = Gtk.TreeViewColumn('Time')
        
        # add columns to treeview
        self.treeview.append_column(self.statusColumn)
        self.treeview.append_column(self.trackColumn)
        self.treeview.append_column(self.timeColumn)

        # create a CellRenderers to render the data
        self.cellStatus = Gtk.CellRendererPixbuf()
        self.cellTrack = Gtk.CellRendererText()
        self.cellTime = Gtk.CellRendererText()

        # add the cells to the columns
        self.statusColumn.pack_start(self.cellStatus, False)
        self.trackColumn.pack_start(self.cellTrack, True)
        self.trackColumn.set_sort_column_id(1)  # Allow sorting on the track column
        self.timeColumn.pack_start(self.cellTime, False)

        # 2nd argument is for mapping with data from liststore append above
        self.statusColumn.set_attributes(self.cellStatus, stock_id=0)
        self.trackColumn.set_attributes(self.cellTrack, text=1)
        self.timeColumn.set_attributes(self.cellTime, text=2)
       
        #Column auto expand based on window size
        self.trackColumn.set_fixed_width(100)
        self.trackColumn.set_expand(True)
        
        #-------------------- STACK SWITCHER --------------------
        self.btnMyStream = Gtk.RadioButton()
        self.btnMyStream.set_label('My stream')
        self.btnMyStream.connect('toggled', self.loadMyStream)
        self.btnMyStream.set_property('draw-indicator', False)

        self.btnFavorites = Gtk.RadioButton().new_from_widget(self.btnMyStream)
        self.btnFavorites.set_label('Favorites')
        self.btnFavorites.connect('toggled', self.loadFavorites)
        self.btnFavorites.set_property('draw-indicator', False)

        stack_switcher = Gtk.StackSwitcher() # This is the two togglable buttons at the top
        stack_switcher.add(self.btnMyStream)
        stack_switcher.add(self.btnFavorites)

        #Mimicing the look and showing Gtk.StackSwitcher
        stack_switcher.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED)
        stack_switcher.get_style_context().add_class("raised")
        stack_switcher.set_homogeneous(True);
        stack_switcher.set_property('margin', 5)

        self.vbox.pack_start(stack_switcher, False, True, 0)
        #------------------------------------------------------

        # So we can scroll through treeview
        self.scrolledwindow = Gtk.ScrolledWindow()
        self.scrolledwindow.set_hexpand(True)
        self.scrolledwindow.set_vexpand(True)
        self.scrolledwindow.add(self.treeview)
        self.vbox.pack_start(self.scrolledwindow, True, True, 0)

        self.loading = Gtk.Label() # Label because spinner widget reaaaaally lag and block
        self.loading.set_label("Loading your tracks...")
        self.vbox.pack_start(self.loading, True, True, 0)

        self.window.show_all() # Show all widgets
        self.scrolledwindow.hide() #Hidden before data is loaded in rows so we can show the loading...

        GLib.timeout_add(500, self.getSoundcloudData)  #Ugly timeout to wait for the window to be shown - to be changed

        # All the gstreamer audio stuff
        self.player = Gst.ElementFactory.make("playbin", "player")
        fakesink = Gst.ElementFactory.make("fakesink", "fakesink")
        bus = self.player.get_bus()
        bus.add_signal_watch()
        bus.connect('message', self.OnGstMessage)
      
Gst.init(None)
GTK_Main()
GObject.threads_init()
Gtk.main()