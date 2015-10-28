#!/usr/bin/python
# encoding=utf8
import soundcloud
import os
import gi
gi.require_version('Gst', '1.0')
from gi.repository import Gst, GObject, Gtk, Gdk
import config

favorites_tracks = []
client = soundcloud.Client(client_id=config.api_client_id)

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

    def getData(self):
        id_user = client.get("/resolve?url=http://soundcloud.com/"+config.username).id
        #Get first 200 items (limit) of tracks
        tracks = client.get("/users/"+str(id_user)+"/favorites", limit=200, linked_partitioning=1)
        favorites_tracks.extend(tracks.collection)
        # Iterate through all pages of soundcloud tracks
        while hasattr(tracks, 'next_href'):
            tracks = client.get(tracks.next_href)
            favorites_tracks.extend(tracks.collection)
            
        for i in favorites_tracks:
        	self.liststore.append(['', i.title.encode('ascii', 'ignore'), milliToR(i.duration)])
            

    def playStream(self, iter):
        model = self.treeview.get_model()
        #Check if a song is already playing, and erase it's icon
        if 'playing_cell' in globals():
            self.liststore.set_value(playing_cell, 0, '')
        global playing_cell
        playing_cell = iter
        self.liststore.set_value(playing_cell, 0, Gtk.STOCK_MEDIA_PLAY)
        
        track = model[iter][1]
        #To change : actually comparing tracks name but should get the list index and play the index sound
        for f in favorites_tracks:
            if f.title.encode('ascii', 'ignore') == track:
                self.window.set_title(track)
                old_state = self.player.get_state(0)[1]
                if old_state == Gst.State.PAUSED:
                    self.player.set_state(Gst.State.NULL)
                else:
                    self.player.set_state(Gst.State.NULL)
                    
                self.player.set_property("uri", f.stream_url+"?client_id="+client.client_id)
                self.player.set_state(Gst.State.PLAYING) 
    
    def onClickRow(self, treeview, path, column):
        model = treeview.get_model()
        iter = model.get_iter(path)
        self.playStream(iter)
                
    def PlayPause(self, w):
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

    def NextTrack(self, w):
        if 'playing_cell' in globals():
           next_iter = self.liststore.iter_next(playing_cell) 
           self.playStream(next_iter)
           
    def OnMessage(self, bus, message):
        if message.type == Gst.MessageType.EOS:
          self.NextTrack('')
        elif message.type == Gst.MessageType.ERROR:
            print("error occured reading this track, next")       
            self.NextTrack('')
          
    def KeyPressed(self, widget, event):
        keyname = Gdk.keyval_name(event.keyval)
        if keyname == "space":
            self.PlayPause('')
            return True
        elif keyname == "n":
            self.NextTrack('')
            return True
                
    def __init__(self):     
        self.window = Gtk.Window(Gtk.WindowType.TOPLEVEL)
        self.window.set_default_size(400, 600)
        self.window.set_title("Nem")
        self.window.set_icon_from_file(get_resource_path("icon.png"))
        self.window.connect("destroy", Gtk.main_quit, "WM destroy")
        self.window.connect('key_press_event', self.KeyPressed)
        
        #Cross platform and theme-independent style
        style_provider = Gtk.CssProvider()
        style_provider.load_from_data('''
        GtkTreeView row:nth-child(even) { background-color: #F5F5F5; color: #333333}
        GtkTreeView row:nth-child(odd) { background-color: #FFFFFF; color: #333333}
        GtkTreeView row:selected { background-color: #3D9BDA; color: #FFFFFF}
        ''')
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(), style_provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION)
        
        #self.spinner = Gtk.Spinner()
        #self.spinner.start()
        #self.window.add(self.spinner)

        vbox = Gtk.VBox()
        self.window.add(vbox)
       
        self.liststore = Gtk.ListStore(str, str, str)
        self.treeview = Gtk.TreeView(self.liststore)
        
        #Different color for each row
        self.treeview.set_rules_hint(True)
 
        self.treeview.set_property('height-request', 500)
        
        # create the TreeViewColumns to display the data
        self.statusColumn = Gtk.TreeViewColumn('')
        self.trackColumn = Gtk.TreeViewColumn('Track')
        self.timeColumn = Gtk.TreeViewColumn('Time')
      
        # create rows
        
        
        self.getData()
        
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
        self.timeColumn.pack_start(self.cellTime, False)

        # 2nd argument is for mapping with data from liststore append above
        self.statusColumn.set_attributes(self.cellStatus, stock_id=0)
        self.trackColumn.set_attributes(self.cellTrack, text=1)
        self.timeColumn.set_attributes(self.cellTime, text=2)

        # Allow sorting on the track column and 
        self.trackColumn.set_sort_column_id(1)
        #not searchable (so keypress events don't interfers)
        self.treeview.set_search_column(-1)
        #drag & drop rows
        self.treeview.set_reorderable(True)
       
        #Column auto expand based on window size
        self.trackColumn.set_fixed_width(100)
        self.trackColumn.set_expand(True)
        
        #Double click handler
        self.treeview.connect('row-activated', self.onClickRow)
          
        # So we can scroll through treeview
        scrolledwindow = Gtk.ScrolledWindow()
        scrolledwindow.set_hexpand(True)
        scrolledwindow.set_vexpand(True)
        scrolledwindow.add(self.treeview)
        vbox.pack_start(scrolledwindow, False, True, 0)

        self.window.show_all()

        # All the gstreamer audio stuff
        self.player = Gst.ElementFactory.make("playbin", "player")
        fakesink = Gst.ElementFactory.make("fakesink", "fakesink")
        bus = self.player.get_bus()
        bus.add_signal_watch()
        bus.connect('message', self.OnMessage)
        #GObject.MainLoop().run()
      
Gst.init(None)
GTK_Main()
GObject.threads_init()
Gtk.main()
