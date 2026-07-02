# TunerPro WebHelp Digest

## source/TunerProOverview.htm
URL: https://www.tunerpro.net/WebHelp/source/TunerProOverview.htm

TunerPro Overview
TunerPro Overview
Welcome to
TunerPro & TunerPro RT!
TunerPro is a software platform designed to enable you to manipulate
the calibration data present in modern vehicle engine, transmission, and body control electronics, as well as view real-time parameters for various vehicle makes and models. For editing calibrations, TunerPro uses a versatile and extensible calibration definition format (XDF) that is user-defineable and is quite powerful. For data acquisition, TunerPro utilizes a feature-rich acquisition module with powerful features for interfacing with generic com port interfaces.
Use TunerPro to:
Modify Binary Data
Use XDF definition to decode and edit binary files
Edit raw hex or show calculated values in the editors
Display and edit constants, bitmasks and flags, 2D and 3D tables, 2D functions, and more
Compare up to 5 bins for easy tuning
Log changes to a plain text file for future reference of
changes
Graph tables in 2 and 3 dimensions
Powerful hex editor for viewing raw bin data
Define how data is visualized with the XDF definition format
Add new items
Delete existing items
Change the order/group items
Automatically keeps track of numbers of items in XDF
Access to all XDF parameters
Sort items by name/location/value in the Item Summary List
Use the Graphical Table Finder to easily find tables or locate
areas undefined in your XDF
Easily search for items by keyword(s), addresses, or size.
Stack/Split Bins
Compile bins for bin switchers such as those offered by Craig
Moates.
Load/Save stack layouts for future editing or splitting
Split compiled bins into the original bin components
Emulate (RT version only)
Make changes in the editor in real-time, while the car is
running (special hardware required)
Monitor & Log Real-time Data (RT version only)
Great for diagnosing
problems or checking tune progress. The proper definition file, if it exists, is required for your particular vehicle. A special hardware interface may be required.
Simultaneously monitor and log live data while making changes to the calibration (hardware required)
Use live vehicle data to indicate the current location within the calibration that the vehicle is running within
Trace address locations requested by the vehicle's computer! This is a powerful feature that allows you to trace realtime data without the use of a specific diagnostics data stream (address tracing requires specific hardware such as the Ostrich II from Moates)

## source/TunerProInterface.htm
URL: https://www.tunerpro.net/WebHelp/source/TunerProInterface.htm

Untitled Document
The TunerPro User Interface
A screen capture of a typical TunerPro screen layout is shown below (TunerPro RT screen shown). The three major areas are marked in the screenshot.
UI Components
Title Bar
At the very top of the main window is the application title bar, as is typical with most Windows applications. The title bar shows the currently open BIN, XDF, ADX, and XDL files, as well as their modified state. A file with an asterisk ('*') after it has been modified, and the changes have not yet been saved to disk.
Main Menus
Below the title bar is the main application menu, as is typical with most Windows applications. The menus allow you to direct access most of features of the application.
Main Toolbar
Immediately below the menu is the application's main toolbar. The toolbar is designed to give you quick access to the more commonly used features and commands, and it is broken down into groups. You can show and hide toolbar groups, or the toolbar completely, via toggling the group in the View->Toolbars menu, or by right clicking in the toolbar.
XDF Item Tree (
1
)
Under the '
1
' at the left side of the illustration above is the XDF Item Tree. This tree list exposes all of the editable items in the XDF definition that you've loaded. Double clicking an item in the list will open the items respective binary editor in the workspace to the right ('
2
' in the illustration).
The XDF Item Tree can be arranged in various ways, depending on the selection in &quot;View By&quot; at the top of the tree window. You can arrange items in the list by type, category, or in a flat, ordered list. If you wish to rearrange the order of XDF items in the tree, you must do so in the &quot;Ordered List&quot; mode.
The tree can be closed by clicking in the 'X' in the top right corner of its window. It can be re-opened from the View menu or View toolbar.
Workspace (
2
)
Under the '
2
' in the illustration above is the main editor workspace. This is where all binary editors will be opened when you double click an item from the XDF Item Tree. Multiple editors can be open within the workspace simultaneously.
Bottom Utility Tab (
3
)
Under the '
3
' in the illustration is the bottom utility tab. Many of the utility windows accessible from the menus and toolbars will open in this tab view, including the Item Summary List, Item Comments, and all of the data acquisition views (TunerPro RT).
Main Status Bar
At the very bottom of the main application window is the main status bar. This status bar shows various data points, including the current emulation state, data acquisition state, and info about the detected hardware (TunerPro RT), as well as quick information about the XDF Item currently selected in the XDF Item Tree. A more detailed description of the status bar can be found
below
.
The Status Bar
Parts of the status bar:
1: Emulation Status (RT Only)
- If green, you are currently emulating. Changes made to the bin (via the

## source/GeneralEditing.htm
URL: https://www.tunerpro.net/WebHelp/source/GeneralEditing.htm

General Prom Editing Overview
What do I need? How do I edit?
There are a number of components involved in editing binary data with TunerPro. The major pieces are explained here.
1) Obtaining the binary data you wish to edit
2)
The binary data itself (a BIN file, etc)
3) The definition file that deciphers what each byte in the bin means in the &quot;real
world&quot;
5) The editing software (TunerPro) that can load the binary file and and interact
with it.
6) Uploading the newly edited bin to the vehicle
Obtaining the binary data
TunerPro can edit binary information from a wide range of makes and model vehicles, and from a wide range of years. How the binary information is stored in the vehicle plays a role in how the binary information is extracted from the computer.
Older vehicles tend to have EPROMs or EEPROMs, which can be read with a special piece of hardware called an EPROM or EEPROM programmer (or &quot;burner&quot;). The PROM burner is a hardware device that is used to read the
information off of a chip. Most PROM burners interface with a computer, and
once the chip is read, the file that contains the information from the chip
can be saved via computer to file (the bin file). Once the bin is edited, the
PROM burner must be utilized for burning the new, or modified bin file back
onto the chip. TunerPro can directly interface with the BURN1 (Flash & Burn) from Moates.net.
Starting around the mid-90's (depending on make and model), many vehicle computers utilized flash memory to store the calibration and code. This flash memory is typically read using a special set of instructions passed to the computer through the diagnostic port. Just how this is done typically varies by the manufacturer of the vehicle's computer.
Once extracted, the information is typically stored on the PC as a single binary file. The filename extension for that file is typically .bin, but it can really be any extension. It is this file that TunerPro manipulates.
The bin file
The bin file is the partial or complete image of the calibration information, the code that the computer executes, or both. The bin file contains raw binary data imaged from the vehicle's memory itself,
and each byte or set of bytes in the file corresponds to a particular function
that the car's ECM needs to operate. The bin contains
the information the vehicle's computer (which goes by various names: ECM, BCM, ECU, PCM, DME, etc), needs to make sense/use
of the data it receives from the various sensors in and around the engine.
The definition file
The definition, or template, file is
a file that tells the editing software how to interpret each byte in the bin
file. TunerPro's native definition format is &quot;XDF&quot; (although it can also import .ECU files). The definition basically says, in plain English, &quot;the byte at location
X
in the bin file should be multiplied/divided/offset by
W, Y, Z
to come
up with a real world number.&quot; For example, in a made-up bin, lets say the
byte at the 215th offset (or said a different way, the 215th byte) in the bin
file is 9. The ECM that this bin is meant
for might use this byte for determining the temperature at which to turn on
the engine's cooling fan. Well, 9 by itself isn't a very useful number, so

## source/Preferences.htm
URL: https://www.tunerpro.net/WebHelp/source/Preferences.htm

TunerPro Preferences
Preferences
Preferences editor can be found in the tools menu, or by right-clicking in the workspace window. Below
is a short description of each option.
In this section:
General Options
Color Preferences
Keyboard Shortcuts
Default Bin Definitions
Data Acquisition and Emulation
General Options
Load Last XDF at Startup -
If checked,
the XDF file that you specify as default will open automatically when you
load TunerPro.
Load Last BIN at startup -
If checked,
the last opened bin will open next time you start TunerPro.
S
how Units in Item Summary List
- If checked, the item's units are outputted to the value column of the Item Summary List.
Enable Edit Logging -
If
checked, changes made to a bin are logged in a plain text file. If the currently
edited bin resides as c:\MyBin.bin, the log file will reside as c:\MyBin.log.
Item List Tracking
- If checked, when an editor is made active (brought to the top of all editors) in the workspace, it is selected in the XDF Item Tree and the Item Summary List.
Warn of Changes on Editor Close
- If checked, you will be prompted to save any unsaved changes when closing the bin editor. If no changes have been made since you last applied changes or since opening the editor, you will not be prompted.
Display Data -
Setting this to Hex causes
all parameters to be shown as they appear in the bin file - in raw hex. If
you choose to show calculated values, each hex byte will be calculated using
the XDF parameters and displayed in the editor(s).
Compare Mode -
if set to edit - compare, when compare mode
is selected in the table editor, the difference between the editable bin data
and the compare bin data is shown. Also toggled from the Table Editor Toolbox.
Color Table Cells -
When checked, table cells are colored based on the table-defined maximum and minimum values. If no max/min is set, the cells will not be colored.

## source/Shortcuts.htm
URL: https://www.tunerpro.net/WebHelp/source/Shortcuts.htm

TunerPro Keyboard Shortcuts
Keyboard Shortcuts
All keyboard shortcuts can be customized in TunerPro. Below are the list of the default shortcuts for the frequently used commands. Consult the
preferences
guide for more information on customization.
Bin Related:
Ctrl + O = Opens a bin file
Ctrl + S = Saves a bin file
Ctrl + T = Opens the bin comparison tool
Ctrl + &quot;-&quot; or Number Pad - decrements
value to next available hex value
Ctrl + &quot;=&quot; or Number Pad + increments value to next available hex
value
Compare Bin Switching:
Ctrl + 1 = Select Compare Bin 1
Ctrl + 2 = Select Compare Bin 2
Ctrl + 3 = Select Compare Bin 3
Ctrl + 4 = Select Compare Bin 4
XDF Related:
Ctrl + E = Opens an XDF file
Ctrl + N = Creates new XDF Item and opens item editor
Ctrl + D = Deletes selected XDF Item
Ctrl + F = Find an Item based on a keyword, address, or size
F2 = Opens XDF Item Editor to Edit currently selected item
Ctrl + F2 = Opens the XDF header editor
View/Tools Related:
F2 = Opens XDF Item editor
F3 = Enables/Disables Emulation Mode (RT Only)
F5 = Opens Bin Stacker
F6 = Opens the XDF Item Tree
F7 = Opens Item Summary List
F10 = Opens Item Comments/Help Toolbox
F11 = Opens Table Graph (if table editor is active)
F12 = Opens Help
Ctrl + G = Graphical Table Finder
Hardware Related:
Ctrl + B = Opens Chip Program/Read tool (RT +
AutoProm/Flash & Burn Only)
Ctrl + P = Opens AutoProm A/D Data monitor window
Emulation Related:

## source/ViewFilters.htm
URL: https://www.tunerpro.net/WebHelp/source/ViewFilters.htm

Visibility & Categories Filters
Visibility Filters
Items can be filtered (shown or hidden) based on the visibility level and category defined for each item in the definition. To change the visibility filters, make sure the filters toolbar is visible by selecting View->Toolbars->Visibility & Categories, or by right clicking in the toolbar and selecting Visibility & Categories.
Visibility Level
Items can be shown or hidden by their defined visibility level. In this way, visibility levels can be used somewhat like &quot;knowledge&quot; or &quot;experience&quot; filters, where level 1 is the most basic and level 10 is the most advanced. By selecting
Show Only
, only items with the specified level will be shown. By selecting
Show Up To,
items at or below the selected level will be visible. For instance, if &quot;Show Up To&quot; and &quot;Level 5&quot; is selected, items defined to be visible in levels 1 through 5 will be visible (as will any items with &quot;Always Visible&quot;).
XDF Header Editor
|
Categories
7/8/09  21:00

## source/EditingBins.htm
URL: https://www.tunerpro.net/WebHelp/source/EditingBins.htm

Editing Bin Files
Editing Bin Files
One of the primary purposes of TunerPro is to edit binary files. To do this, you must first load your binary file and its corresponding definition file.
To open the bin:
Via the menu, select
File -> Open Bin
or use the corresponding keyboard shortcut (Default is Ctrl + O)
Browse to the desired bin and double click
it
To open the definition file:
Via the menu, s
elect
XDF -> Select XDF
or use the corresponding keyboard shortcut (default is Ctrl + E)
Browse to the appropriate XDF file and double click it.
Opening the XDF file will enumerate the XDF Item tree with the available bin parameters available for editing. Once
you have your bin and XDF file loaded, select the bin parameter you'd like
to edit from the tree
.
A Note On Rounding
Many values in a bin are converted to real-world
values by way of a calculation. When you change a calculated value in a TunerPro
editor window and save it (or update it when emulating), the value is returned
back to a byte (or 2 bytes if the item is 16 bits). If the value needs rounding,
it is rounded to the nearest byte value (generally, the nearest unsigned integral value - e.g. 1, 2, 3, 4, ... 255).
You might notice that you changed the base timing
to 6.71 and then saved it. Next time you opened it you noticed the value was
6.69 instead of your intended 6.71. This is a result of the rounding and is
completely expected and completely normal. This has to do with the resolution
of the final value after it is &quot;reconverted&quot;.
.
Constants
,
Flags
,
Tables
.
7/15/09  12:32

## source/Constants.htm
URL: https://www.tunerpro.net/WebHelp/source/Constants.htm

Constants
XDF Constants
Constant Overview
A constant (sometimes referred to as a &quot;scalar&quot;) is a singular value in a binary. A constant might be used used, for example, to represent the temperature above which a cooling fan engages, or the maximum RPM of a motor.
The Constant Editor
The Constant Editor
To edit a constant, select the constant you wish
to edit from the constants list. The desired parameter and its current value
are displayed in the constant editor. You can select the number in the edit
field and type in the value you desire. If you do this, when the item is saved
(either by pressing the save button in the editor or by saving the bin out to
file), the value you chose will automatically get rounded to the nearest possible
value in the bin.
Another choice is to hit the keypad + and - keys
or Ctrl + &quot;+&quot; or Ctrl + &quot;-&quot; on the main keyboard to increment
and decrement the values to their nearest possible values.
If you have a comparison bin selected, the compare
bin's value will also be displayed. You may copy it manually or by pressing
the &quot;copy&quot; button.
You may use the slider provided in the editor window
to select a value within the possible range of values for the item. Updating
the value in the edit box will update the position of the slider in realtime.
Flags
,
Tables
,
Editing Bins
,
Comparing
Bins
7/17/09  23:09

## source/Flags.htm
URL: https://www.tunerpro.net/WebHelp/source/Flags.htm

Editing Flags
XDF Flags
Flag Overview
A flag represents a bit within a series of bits. A byte contains a series 8 bits. A bit
can only be set or clear (1 or 0). Each bit, therefore, can represent a &quot;switch&quot;
or &quot;flag.&quot; For instance, a flag could be used to enable or disable a feature, where a bit value of 1 represents &quot;on&quot; and a bit value of 0 represents &quot;off.&quot; Additionally, you can compare a bit pattern (bitmask) to determine if its state matches a particular pattern or does not match a particular pattern.
A flag (and bitmask) in TunerPro has two states - set or not set (or, in terms of a bitmask, the mask either matches or does not match).
The Flag Editor
The Flag Editor
To edit a flag, select the desired flag set from
the flag list. You will be presented with the flag info in the flag editor.
Check or uncheck the values you wish. A checked item means the bit for that
item within the mask is set (= 1). No check means the bit is cleared (= 0).
Constants
,
Tables
,
Editing Bins
,
XDF Flag Definition Editor
7/17/09  23:10

## source/Tables.htm
URL: https://www.tunerpro.net/WebHelp/source/Tables.htm

Editing Tables
XDF Tables
Table Overview
A table (sometimes referred to as a map) is a group of values representing the output on two or more axes where each value is a cell in a table. Tables are often used by a host computer as a lookup mechanism for a particular functionality. For instance, the spark advance to be applied at a given load and RPM might be represented as a 3D table in a binary where the X axis is the load, Y is the RPM, and Z is the output - the spark advance . Similarly, the idle speed for a given coolant temperature might be represented as a 2D table where the dependent (fixed) axis is the temperature, and the independent (variable or output) axis is the the idle RPM.
The Table Editor
The Table Editor
To edit a table, double click the table you wish
to edit in the table list. This brings up the table editor. Edit the values
you wish to edit using the same guidelines as the constants.
Range Selection
You can select a range of cells in a table by either
left-clicking on the first cell in the range and, while holding the mouse button,
dragging the mouse to the last cell in the range. Alternately you may click
in the first cell, press and hold the shift-key, and click once in the last
cell in the range. With a range of cells selected, you can increment or decrement
the values in the selection range all at once, or make use of the table functions
in the table editor toolbox to modify the selected range. You can also copy
and paste data to and from the selected range.
Copying/Pasting
Table data can be copied to and pasted from the
Windows clipboard. Once you've selected a cell or range of cells in the editor,
you can copy the data to the clipboard by either pressing control + c or by
right-clicking in the table and selecting &quot;Copy Selection&quot;. Once data
is copied to the clipboard it can be pasted elsewhere into the table or into
another program such as Microsoft Excel.
To paste data into a table, select the first cell
at which you'd like to paste the data and hit control + v, or right-click in
the table and select &quot;Paste starting at cursor&quot;.
Note:
when
pasting data into the table, the data in the clipboard must be able to fit in
the table, and fit within the space provided by the current cursor location
and the bounds of the table. If this requirement is not met, the data will not
be pasted.
Table Tools
The table editor toolbar has a group in it that allows you to edit the current selection with special functions, such as smooth, offset, multiply, etc. This allows you to, for instance, multiply an entire row, column, or table
by a desired factor, or add to an entire column.
Note that these functions can only be used when viewing
calculated values. That is to say, it will not work if you're viewing raw hex.
To do so:

## source/Functions.htm
URL: https://www.tunerpro.net/WebHelp/source/Functions.htm

Editing Functions
XDF Functions
Function Overview
A function is a special type of 2-dimensional table where both the X and Y axes are independent and editable.
The Function Editor
The Function Editor
To edit a table, double click the table you wish
to edit in the table list. This brings up the table editor. Edit the values
you wish to edit using the same guidelines as the constants.
Range Selection
You can select a range of cells in a table by either
left-clicking on the first cell in the range and, while holding the mouse button,
dragging the mouse to the last cell in the range. Alternately you may click
in the first cell, press and hold the shift-key, and click once in the last
cell in the range. With a range of cells selected, you can increment or decrement
the values in the selection range all at once, or make use of the table functions
in the table editor toolbox to modify the selected range. You can also copy
and paste data to and from the selected range.
Copying/Pasting
Table data can be copied to and pasted from the
Windows clipboard. Once you've selected a cell or range of cells in the editor,
you can copy the data to the clipboard by either pressing control + c or by
right-clicking in the table and selecting &quot;Copy Selection&quot;. Once data
is copied to the clipboard it can be pasted elsewhere into the table or into
another program such as Microsoft Excel.
To paste data into a table, select the first cell
at which you'd like to paste the data and hit control + v, or right-click in
the table and select &quot;Paste starting at cursor&quot;.
Note:
when
pasting data into the table, the data in the clipboard must be able to fit in
the table, and fit within the space provided by the current cursor location
and the bounds of the table. If this requirement is not met, the data will not
be pasted.
Constants
,
Flags
,
Tables
,

## source/TableGraphing.htm
URL: https://www.tunerpro.net/WebHelp/source/TableGraphing.htm

Table Graphing
Table Graphing
TunerPro allows you to graph 2 and 3 dimensional
tables. To do so, open the table of your choice from the table list or item
summary. Within the table editor you will find a button titled &quot;Graph&quot;.
Pressing this button will open the graph for the active table. The table will
be a line graph for 2D tables (2D = comparing 2 values, i.e. &quot;Power Enrich
Vs. Temp&quot;) or a surface plot for 3D tables (3D = comparing 3 values,
i.e. &quot;LV8 vs. RPM vs. Degrees Spark Advance&quot;).
Below is an example of a 2D graph:
Below is an example of a 3D graph:
In both 2D and 3D graphs data points can be dragged
and changed by clicking on the data point you wish to change and dragging
the mouse. In 2D graphs, the active point is colored red. In 3D graphs the
active point is outlined in bold. The graph and corresponding table value
will update in real-time with your mouse movements. Changing values in an
actively-graphed table will also automatically update the corresponding graph.
Multi-Selection
Dragging the mouse while the left mouse button is down will draw a selection rectangle. All points that fall within that rectange will be selected. Alternately, you can select using Ctrl + Left click. Clicking on a selected point while holding the Ctrl key will unselect the point.
Rotating, Shifting, and Zooming a 3D
graph
Using the mouse:
Rotate = hold Ctrl, click on the graph, and move
the mouse
Shift = hold Shift, click on the graph and move the mouse
Zoom = hold both Shift & Ctrl, click on the graph and move the mouse
Using the keyboard:
Rotate = hold Ctrl and use the arrow keys
Shift = hold Shift and use the arrow keys
Zoom = hold Ctrl & Shift and use the [ (out) and ] (in) keys
3D graphs feature colored data points. This feature
may be disabled in the General tab of the Preferences dialog. The highest
points in the graph are a deep red, the lowest in the graph are a deep blue.
Values in-between are approprately shown within the gradient between red and
blue. The colors are updated as the highest and lowest point change.
If you find the 3D graph update rate to be too
slow, you may turn off off-screen rendering in the General tab of the Preferences
dialog. Note that this will cause the graph to flicker when it updates.
Tables
7/8/09  21:07

## source/ItemSummary.htm
URL: https://www.tunerpro.net/WebHelp/source/ItemSummary.htm

Item Summary List
The Item Summary List
Selecting Items:
When you select an item, if the main lists are
open, you will notice that the main lists will also reflect your selection.
You may double click an item in the list to edit its value(s). This means you
do not need to have the main lists open. You may hide them by selecting the
appropriate option from the &quot;view&quot; menu or by pressing F6. Also, if
the main lists are open and you select an item from one of the main lists, you
will notice that the summary list will reflect that selection, too. This is
normal behavior.
Adjusting values in the list
Selecting an item will show the adjustment slider
for the item. To adjust the value of the item, you may drag the adjustment slider.
To inc/dec a value, select the item in the list and press +/- to inc/dec. Only
Constants and Flags can be adjusted or inc/dec. Tables cannot. Note: adjusting
or inc/dec a flag may produce undesireable results as you may be unaware of
the individual bits being set.
Columns:
Item Name - this is the name associated with the
XDF Item
Calculated - this is the value of the item within the loaded bin file.
Hex - this is the raw hex value of the item within the loaded bin file.
Location - this is the location (or range if multi-byte or table) of the item
within the bin file.
Adjust - If an item is selected and active, an adjustment slider will show up
in this column in the row of the selected item.
Re-arranging columns:
To re-arrange the columns, simply drag the column
headings to the desired order/position.
Sorting Columns:
To sort the various columns, click on the column
heading. The first click will sort down. The second click will sort up. The
third click returns the list to the order found in the XDF file itself.
Re-sizing columns:
To resize the columns, drag the column heading
dividers until the column reaches the desired size.
All column sizes and orders will be saved when
closing the list or the application. When re-opening the list, it will return
to the previous state.

## source/ComparingBins.htm
URL: https://www.tunerpro.net/WebHelp/source/ComparingBins.htm

Comparing Bins
Comparing Bins
TunerPro allows you to select up to 4 bins for easy comparison.
To load comparison bins, in the &quot;Compare&quot; menu choose &quot;Load
Compare Bins...&quot;. You will be presented with the following dialog:
Browse to each bin using the &quot;...&quot; button. You needn't
use all 4. Once your compare bins are selected, you will be able to see, simultaneously,
the values of both the current editable bin as well as the active comparison
bin.
To select an active compare bin, you can select the desired
bin from the &quot;Compare&quot; menu
or
you can use the quick-key
command. Cntl + 1 selects the first compare bin, Ctrl + 2 selects the second,
and so on. If a bin is not loaded into a slot, you will not be able to select
the slot.
The default active compare bin after bin selection is the first
slot that contains a bin, i.e. if slot 1 does not contain a bin but slot 2 does,
when pressing &quot;OK&quot; in the selection dialog, the default compare bin
will be slot 2.
Comparing Constants:
To compare constants, select the desired constant
from the constant list. You will be presented with your editable bin's value
for your that item. Below that you will find the name of the compare bin followed
by it's value for the item. You can copy the comparison bin's value to the editable
bins value by pressing the &quot;Copy&quot; button.
Comparing Flags:
To compare flags, select the desired flag from
the flag list. On the left side of the flag editor is the editable bin's flag
value. On the right is the comparison bin's value.
Comparing Tables:
To compare tables, selected the desired table in
the table list by double clicking. The table editor will open with the editable
bin's information. To view the comparison bin's table, click the &quot;compare&quot;
button. If a compare bin has not yet been selected, you will be presented with
a browse window to select the compare bin. Once selected (or if already selected),
the table editor will change to show the compare bin's values. When in compare
mode, the table background changes to the color you specify in the preferences
(&quot;Non-editable Cell background color&quot;).
If you're viewing the comparison table in &quot;Difference&quot;

## source/EditLogging.htm
URL: https://www.tunerpro.net/WebHelp/source/EditLogging.htm

Edit Logging
Edit Logging
TunerPro has the ability to keep track of changes
you make to your bin by writing out changes to a log file. You can enable
this in the preferences (General Tab). If enabled, every time you press the
save or update (if emulating) button in an editor, the change you make is
logged to a file in the directory of the bin being edited with a filename
matching the bin name with &quot;.log&quot; appended. For instance, if you're
editing &quot;c:\bins\ANZA.bin&quot;, the log file will be found at &quot;c:\bins\ANZA.log&quot;.
You can open the log in the text editor of your choice.
A log entry consists of the date and time of
the change, the type of item that was changed (Constant, Flag, Table), the
title of the item, the old value (where applicable), and the new value (where
applicable).
Below is an example of a log:
Edit Log for ANZA_NOCS.bin created by TunerPro.
**************************************************************************
10/18/2003 21:55:22 Constant: Maximum Spark Advance changed from 41.836 (0x77)
Degrees to 39.376 (0x70) Degrees
10/18/2003 21:55:28 Table: Spark Correction - LV8 vs. Coolant Temp changed
10/18/2003 21:55:33 Flag: VATS & KNOCK Sensor Diag. changed from (0xFD)
to (0xFF)
Preferences
7/8/09  21:04

## source/XDFAddRemoveOrder.htm
URL: https://www.tunerpro.net/WebHelp/source/XDFAddRemoveOrder.htm

Adding, Removing, and Ordering XDF Items
Adding, Removing, and Ordering XDF Items
Adding New XDF Items
You can add a Bin Definition Item a number of ways:
Right click on the item at which you'd like to insert the
new item in the main item list and select &quot;Insert new XDF Item&quot;
Select the item and select &quot;New XDF Item&quot; from
the XDF menu
Press Ctrl + N on your keyboard
Select the item and press the &quot;New Item&quot; button
in the XDF Toolbox
Removing XDF Items
You can delete a definition item a number of ways:
Right click on the item and select &quot;Delete XDF Item&quot;
Select the item and select &quot;Delete XDF Item&quot; from
the XDF menu
Select the item and hit Ctrl + D on your keyboard
Select the item and press the Delete button in the XDF Toolbar
Reordering XDF Items
To change the order of items in a list (and ultimately the definition
file itself), you must first change the tree view mode to &quot;Ordered List.&quot; Once in that mode, simply left-click on the item in the list and drag it to the desired
location elsewhere in the list. The new order should be reflected in all other tree modes. For example, if Item C comes before Item 14 in the ordered view, then Item C should always come before Item 14 in all other modes
XDF Editor Toolbar
7/15/09  20:28

## source/XDFEditorToolbar.htm
URL: https://www.tunerpro.net/WebHelp/source/XDFEditorToolbar.htm

The XDF Editor Toolbar
The XDF Editor Toolbar
The XDF Editor toolbar provides quick access
to common XDF editing functionality. Below is a description of each button
Delete Selected XDF Item
Pressing this button will delete the currently-selected
XDF item.
Insert/New XDF Item
Pressing this button will open the &quot;New
XDF Item&quot; window to insert a new XDF item into the definition. In the
new item window you can choose the type of item to create and whether or not
to insert the item at the selection.
Edit XDF Item Properties
Pressing this button brings up the properties
window for the selected XDF item.
New XDF
Pressing this button will create a new initialized
XDF, removing all current items. If the previous XDF has been modified, you
will be prompted to save or discard the changes before a new XDF is created.
7/8/09  21:12

## source/XDFHeader.htm
URL: https://www.tunerpro.net/WebHelp/source/XDFHeader.htm

XDF Header Editor
The XDF Header Definition Editor
Clicking the &quot;View/Edit XDF Header Info&quot; button brings
up the XDF Item Editor.
General Tab:
This tab allows you to edit the general properties of the entire
XDF file. Below is a description of each field.
Title -
Use this field to assign an informative name
for your XDF.
Description
- Use this field to enter a description or the
XDF. You can enter information on the intended application, notes, etc.
Author
- This field contains the Author's name.
XDF Version
- This field contains a string identifying the
version of the XDF file.
Bin Size (Hex)-
This is the size of the bin file in bytes that is viewed/edited
with this XDF. This number should be entered in hex and should accurately
reflect the size of the bin being edited, even if the bin is a stacked version
of a smaller bin, i.e. if you're editing a 32k padded version of a 16k bin.
Base Offset
- The offset specified here is either added (if
the &quot;subtract&quot; checkbox is
un
checked) or subtracted
(&quot;Subtract&quot; is checked) from the base address of each item defined
in the XDF. This is useful for quickly and easily allow the XDF to edit a
stacked bin (a bin that has padding at the beginning). For instance, if you
have a 16k bin sitting in the upper portion of a 32k file, you can specify
an offset of 0x4000. An object may then have a base address of 0xF0, however,
the item will be edited at offset 0x40F0 in the bin. Alternately, this field
can also be used for ECMs that reference items from an offset. For instance,
in DSM applications, the first byte in a bin is referenced by the ECM as 0x8000.
When editing the bin, it makes more sense to have the items defined per the
addressing the ECM uses. For this, enter 0x8000 as the offset and select &quot;Subtract&quot;.
An item that has a base address defined as 0x80F0 actually references address
0x80F0 - 0x8000, or 0xF0 in the bin.

## source/XDFConstantEditor.htm
URL: https://www.tunerpro.net/WebHelp/source/XDFConstantEditor.htm

XDF Constant Definition Editor
XDF Constant Definition Editor
General Tab
Constants are used to represent singular values
defined in the bin, such as fan turn on temperatures, speed and RPM limiters,
etc.
Title -
This
is the title or common name of the item that is defined. The title entered
here will be visible in the main and summary item lists.
Description -
This field is
used to provide a description of the item's functionality and any notes that
may be useful to the end-user. The text entered here is displayed in the item
comments tab in the main application window.
Units -
This field identifies
the units of the outputted value, i.e. Degrees F for coolant, Degrees for
spark, etc.
Address -
This is the address
within the bin file that contains the raw value for this item. Input this
number as a hex digit. This address may be offset by the
Base
Offset
field of the XDF Header if the Base Offset is set to anything other
than 0.
Size -
This
is the size in bits of the raw data present in the bin for this item. Note
that 8 bits is 1 byte, 16 bits is 2 bytes, and 32 bits is 4 bytes.
Signed -
If enabled, the source data is interpretted as a signed value.
LSB First
- If enabled, the source data is read as little-endian (least significant byte first). This should be checked for Intel type processors, and should not be checked for Motorola type processors.
Output Type -
This
indicates how the final data is displayed to the user. Selections include:
Floating Point -
outputs the final data

## source/XDFFlagEditor.htm
URL: https://www.tunerpro.net/WebHelp/source/XDFFlagEditor.htm

XDF Flag Definition Editor
XDF Flag Definition Editor
Flags (sometimes simply called &quot;bits&quot;)
represent a single bit within a byte in the bin. Flags are often used as &quot;switches&quot;
for functionality within the car's ECM program. For instance in the screenshot
above, a single bit enables or disables VATS (Vehicle Anti-Theft System).
If this bit is unchecked in the
flag editor
, VATS
will not function, allowing the car to start without the embedded &quot;chip&quot;
in the key.
Title -
This is the title of
the bit/flag. This title will be visible in the main and summary item lists.
Description -
This field is used to describe the functionality
of the flag for the end-user. The information entered in this field will be
visible in the item comments box in the main application window.
Address -
This field represents the address, in hex, within
the bin of the raw byte containing the bit to be edited. This address may
be offset by the amount specified in the
Base Offset
field of the XDF Header editor.
Bit Number -
This is the bit number of the byte of the flag.
This number is zero-based, meaning the first bit is bit 0, and the last bit
is bit 7.
XDF Header Editor
,
Flag Editor
7/15/09  17:35

## source/XDFTableEditor.htm
URL: https://www.tunerpro.net/WebHelp/source/XDFTableEditor.htm

XDF Table Definition Editor
XDF Table Definition Editor
Tables represent a collection of data arranged
in a specific fashion. Most often tables are used by the ECM to lookup values
based on inputs such as RPM and Load.
General Tab
Title -
The
name of the table to be displayed in the main and summary lists.
Description -
Description information is displayed in the
item comments window within the main application window. Use this field for
descriptive information regarding the use and function of the table.
Address -
This is the start address, in hex, of the table
data within the bin. This value may be altered by the value specified in the
Base Offset
field of the XDF Header.
Cell Data Size -
This is the size, in bits, of each data
point, or cell, in the table. 8 bits is 1 byte, 16 bits is 2 bytes, and 32
bits is 4 bytes.
Output Type
-
This indicates
how the final data is displayed to the user. Selections include:
Floating Point -
outputs the final data
as a decimal point number, such as 1.00 or 3.23.
Integer -
Final data is outputted as an integer (1, 2,
3, etc). Floating point data will be truncated to the nearest integer (1.6
will truncate to 1).
Hex Digits -
Final Data will be outputted as hex (decimal
11 will be outputted at 0x0B, etc).
String -
Final Data will be outputted as a string of characters.
Cell Units -
This

## source/XDFFunctionEditor.htm
URL: https://www.tunerpro.net/WebHelp/source/XDFFunctionEditor.htm

XDF Function Editor
XDF Function Editor
7/15/09  17:48

## source/GenConv.htm
URL: https://www.tunerpro.net/WebHelp/source/GenConv.htm

XDF Item - General Conversion
XDF Item Conversion Editor
Some XDF  item editors contain a
&quot;Conversion&quot; tab. One of the most powerful (and complex,
quite frankly) features of the TunerPro XDF file format is its ability to
perform complex math on binary data. This tab contains information on the math
that gets done in order to convert the raw information in the bin to a useable,
real-world engineering value. This topic is not simple, but is worth taking
the time to completely understand. Please read carefully and, most importantly,
experiment!
Equation Format:
The equation format field represents the general
form of the math that is to be done. This field contains the constants, operators,
and arguments (or variables) for the math that should be performed. To edit
the equation format, click the &quot;Edit...&quot; button next to the field.
In order to best understand how the equation format field works, lets look
at an example:
(0.351567 * X) + 3.000
0.351567 and 3.000 represent
constants
.
Constants can be added/subtracted to, or multiplied/divided by other constants,
or by reference values (explained below).
* and + represent
operators
.
Operators should be familiar to you. Here are the valid operators in an equation
format (more may be added in the future):
* (multiply)
/ (divide)
+ (add)
- (subtract)
% (Modulus)
| (Bitwise OR)
& (Bitwise AND)
^ (Bitwise XOR)
X represents an
argument
.
Arguments are the power behind the equation format. They are equivalent to

## source/Categories.htm
URL: https://www.tunerpro.net/WebHelp/source/Categories.htm

Untitled Document
Categories
XDF Items can be assigned categories. More info on this to be added...
XDF Header Editor
7/15/09  20:29

## source/DataAcq.htm
URL: https://www.tunerpro.net/WebHelp/source/DataAcq.htm

Data Acquisition Overview
(TunerPro RT Only)
Data Acquisition Overview
What is Data Acquisition?
The Data Acquisition module of TunerPro can be utilized to gather real-time information from the vehicle, or device such as a wideband oxygen sensor, for tuning and diagnostics. To define how TunerPro communicates with the vehicle or interface hardware, a user loads (or creates) a definition (ADX) file. The ADX definition is similar to XDF definition used to edit bins, but it includes additional information that represents commands and responses that dictate how the vehicle or interface communicates.
What equipment is needed to make use of
the data acquisition module?
In the most basic case, the data acquisition module communicates via a COM (serial) port. This means that any hardware that can output a typical TTL/serial signal, including through a USB to serial converter or chipset that function through a virtual COM port, can probably be utilized with TunerPro given the proper definition. This includes most GM OBDI ALDL interfaces, including those that utilize virtual COM ports, OBDII intefaces that utilize virtual com ports, many wideband oxygen sensor controllers (TechEdge, Innovate, etc), Nissan Consult interfaces, and many more.
Just like with XDF definitions, ADX definitions are generally created by the user community.
What vehicles can TunerPro log?
TunerPro uses a general format (much like the bin definition) in order to communicate with the vehicle or interface. The answer to this question generally comes down to whether or not there's an interface for the vehicle, and whether or not a definition has been created for TunerPro. Visit the TunerPro web site for updated information on what datastream definitions
are currently available. More are being created all the time.
7/30/09  12:35

## source/DataAcqStart.htm
URL: https://www.tunerpro.net/WebHelp/source/DataAcqStart.htm

Data Acquisition - Getting Started
(TunerPro RT Only)
Data Acquisition - Getting Started
To begin acquiring vehicle datastream information
1) Be sure your cable and/or hardware is attached
and properly configured in preferences.
2) Open the ADX definition file for your vehicle and hardware via the menu: Acquisition->Load Defintiion File.
3) From the Acquisition menu, select &quot;Start/Stop Data Scan&quot;
If the connection was succesful, monitoring will
begin immediately. If not, try connecting again. If, after a few attempts,
you still cannot connect, make sure your key is turned at least to the 'on'
position (the car can be started) and try again.
AutoProm Specific Comments
Craig Moates AutoProm can be used to simultaneously
emulate *and* acquire data. To do this, the AutoProm must be in &quot;Software
Mode&quot;. Consult the AutoProm documents for information on how to configure
this.
Alternately, you can use the AutoProm as a normal
interface cable by configuring the AutoProm for &quot;Hardware Mode&quot;.
If configured in this fashion, you can use the AutoProm as a normal cable,
making it compatible with other ALDL data logging software. Note, however,
that when configured this way, you cannot use the AutoProm to burn chips or
emulate. Using TunerPro there is no reason to use the AutoProm in hardware
mode under normal operating circumstances.
Data Tracing
7/20/09  18:40

## source/DAToolbar.htm
URL: https://www.tunerpro.net/WebHelp/source/DAToolbar.htm

Data Acquisition Toolbar
(TunerPro RT Only)
The Data Acquisition Toolbar
The data acquisition toolbar can be used for quick access
to TunerPro acquisition functionality. Below is a description of each button's function
Edit Data Acquisition Definition File (ADX)
Pressing this button will open the ADX File Editor.
Connect to ECM
Pressing this button will initiate communication
between TunerPro and the vehicle/interface.
Open Dashboard
Pressing this button will open the ALDL dashboard.
If no  DA definition is currently loaded, pressing this button will first
open the browse window in which to select an DA definition.
Open DA Item Lists
Pressing this button will open the ALDL values
window. If no DA definition is currently loaded, pressing this button will
first open the browse window in which to select an DA definition.
Open Monitors
Pressing this button will open the DA monitors
window. If no DA definition is currently loaded, pressing this button will
first open the browse window in which to select an DA definition.
7/30/09  12:38

## source/DALists.htm
URL: https://www.tunerpro.net/WebHelp/source/DALists.htm

ALDL Sensor Data
(TunerPro RT Only)
Data Acquisition Data Lists
The &quot;Item Lists&quot; tab displays a collection of numerical or status items. These items are updated as data is gathered. Multiple lists can be defined by the definition author, and the end-user can switch between them via the drop list box at the top of the tab.
Although at the discretion of the definition author, data is typically organized in clusters of related
data and separated by separaters, typically bold faced. If the data stream
definition has alarms (high/low) enabled, if the value is higher or lower
than the alarm threshold, the value is displayed in red, bold faced font.
See Also
:
7/30/09  12:43

## source/DAMonitors.htm
URL: https://www.tunerpro.net/WebHelp/source/DAMonitors.htm

ALDL Monitors
(TunerPro RT Only)
Data Acquisition Monitors
TunerPro's DA monitors are a handy way to keep
track of sensor data trends and see a multi-sample history of a the monitored or logged data.
Temporarily adding or removing a series to a monitor while monitoring/logging
To
temporarily
assign a data item to a monitor, right-click
in the monitor to which you'd like to assign the item and select the item
to display from the menu. Doing so while monitoring will clear the current contents of the
monitor and subsequent sensor data for the specified item will be shown on
the monitor. If the monitor series are changed while playing back or viewing a log, the monitor will be pre-populated with data. When adding a new series, its vertical axis will automatically be added and assigned a color. Its position will be dependent on the current count of series in the monitor, with even series going to one side, and odd series the other.
The vertical axis is the value of the item and
the horizontal axis is the time axis.
Note:
The vertical range displayed
in the monitor corresponds to the range defined in the ADX for the ADX value being monitored. To change
the range displayed, change the range in the ADX Value editor.
7/30/09  12:52

## source/DADash.htm
URL: https://www.tunerpro.net/WebHelp/source/DADash.htm

DA Dashboard
(TunerPro RT Only)
The Data Acquisition Dashboard
Selecting an item to display in the dash:
To select an ALDL item to display in a gauge,
right-click in the gauge in which you'd like to display the item. Select the
item from the popup menu.
7/17/09  23:03

## source/DADataLogging.htm
URL: https://www.tunerpro.net/WebHelp/source/DADataLogging.htm

ALDL Data Logging
(TunerPro RT Only)
Data Acquisition Logging (Datalogging)
Overview
The ability to save ALDL data to file for playback
later is a powerful tool that can be used for tuning and troubleshooting.
With TunerPro RT, you can record data to a file for later playback.
Recording is simple to do:
1) Select a log file to record to by opening
the ALDL setup window (F4) and browsing to a log file
2) Connect to your ECM so that you're monitoring ALDL data.
3) Press record
Playing back the session you just recorded is
as easy as pressing play. Sessions can be exported to a CSV file format, which
can be opened in Microsoft Excel or other charting applications that can import
csv formatted data.
More Detail:
You can immediately (or later) play back the
session you recorded, seeking through the file, or playing back in real-time.
To record a logging session:
1) Select a datastream definition and connect
to your ECM as you normally would.
2) Be sure you're actively monitoring.
3) Select a log file to record to. This can either be a new file, or an existing
one. If pre-existing, a new session will be added to the existing log file.
4) Press the record button in either the setup tab or on the log transport.
5) To end the recording session, press the stop button.
To playback a logging session:
1) If not already selected, select the log file
you wish to playback.
2) In the drop-list on the ALDL setup window, select the log session you'd
like to play back.
3) In either the ALDL setup window or the ALDL log toolbar, press the play
button.
Once playing back, you may pause, resume, and
seek by dragging the slider (or highlighting it and pressing the left/right
arrows on your keyboard). To add a session to the selected file, simply press
record again!
Using the toolbar
You can open the Log toolbar by selecting &quot;ALDL

## source/DATracing.htm
URL: https://www.tunerpro.net/WebHelp/source/DATracing.htm

Data Acquisition Tracing
(TunerPro RT Only)
Data Acquisition Tracing
TunerPro RT implements a feature that allows you to correlate ALDL data with bin parameters in real-time. This feature is useful for quickly identifying problem areas in a tune and the parameters responsible for the problem. This is accomplished by &quot;linking&quot; an XDF (bin definition) file with an ADS (ALDL Datastream definition) file. Once the link has been made, you can edit the XDF items to have direct links to ADS items.
Some notes on data acquisition data tracing:
XDF Constants with ADX linkage will display the ALDL output in the opened constant editor (see
Figure A
below)
XDF Tables with ADX linkage will show the currently active cells in a highlighted state (see
Figure B
below)
In order for XDF Tables to be linked, the axes output types must be set to a non-string type (i.e. int, float, etc). If set to string, TunerPro cannot resolve ALDL output to an axis value.
The link path between an XDF and ADS is relative. If distributing linked files, it is simplest to link the files while they are in the same directory (and distribute them that way). If the ADS and XDF files live in different directories, the files must be distributed (i.e. zipped or rared) with the directory structure intact.
Figure A - Constant Editor With Tracing Enabled
Figure B - Table Editor With Tracing Enabled
7/17/09  23:06

## source/DADatastreamDef.htm
URL: https://www.tunerpro.net/WebHelp/source/DADatastreamDef.htm

The ALDL Datastream Definition File
The Data Acquisition Definition File Editor
The datastream outputted by a car's management computers can vary by make, model and year. If you have available to you information on the datastream utilized by your vehicle, you can use it to
create a definition that TunerPro can use to communicate with your vehicle.
Following is a brief overview of the Data Acquisition feature of TunerPro:
Supports baud rates from 1200-921000, with special handling for GM 160 baud
Supports fixed sized or variable sized reply packets
Can handle command/response schemes, streaming schemes, and multi-listeners
Macro support for linking commands
To begin creating/editing a datastream definition, start TunerPro RT and select &quot;Edit Definition...&quot; from the Acquisition menu in the main application menu bar.
You will be presented with the definition editor,
first displaying the definition header.
The list (called a Tree-View) on the left side
of the editor contains the items in the definition organized by item type.
At the root of the tree-view are the item types. Under each item type are
a list of items of that type. Clicking on an item will allow you to edit the
information for that item.
Displaying data to the user
You're probably creating an ADX definition so that the user (perhaps the user is you) will be able to view the data in a convenient way. TunerPro has a few different outputs for displaying data to the user:
Item Lists
Dashboards
History Tables
Monitors
Defining commands, values, and bitmasks alone isn't enough to get the data in front of the user. To make the data visible to the user in the TunerPro UI, you must assign the items you define to one of these aforementioned outputs.
Creating a new definition
You may start a definition from scratch by selecting &quot;New Definition&quot;from the Acquisition menu in the main application menu..
Adding a new item
To add a new item, you can click on the item
type at the tree-view root and click the &quot;Add New Item&quot; button below the
ADX item tree. Alternately, if you'd like to insert an item of the same type below
an existing item, click the item at which you'd like ot insert the new item
and click the &quot;Add New Item&quot; button.
Moving items
You can move an item within its item type category
by clicking on the item, holding the mouse button, and dragging it to the
location you'd like it to be. You must only drag items within the same item
type group.
Deleting items
You may delete an item by clicking on the item
in the tree-view and clicking the &quot;Delete&quot; button below the list.

## source/DADefCommandsOverview.html
URL: https://www.tunerpro.net/WebHelp/source/DADefCommandsOverview.html

ADX Commands Overview
(TunerPro RT Only)
ADX Commands Overview
ADX Commands are the building blocks that are used for communication between TunerPro and another device. That other device may be a special piece of electronics that acts as an interface between TunerPro and a vehicle, it could be a vehicle's ECM, or it could be another controller such as a wideband oxygen sensor controller.
The three most basic of these building blocks are the send command, listen command, and macro.
The send command sends data from TunerPro to the device. The data being sent could be a message string that requests that the device reply with a set of data, or perhaps a message string that puts the device in a special mode.
The listen command is  used to listen for and collect data that is sent from the device to TunerPro. This could be a reply from a send command, or could be a packet within an uncontrolled stream of data from the device.
A macro is a collection of commands that are to be executed by TunerPro in a specific order, as a group. Most frequently, macros are used to pair a send command with a listen command, where the command pair represent a typical &quot;tunerpro requests data and then retrieves the response from the device&quot; scenario. This scenario is one of the most common.
Headers, Footers, Bodies, Payloads, and Offsets
Although it sounds like we may be talking about body parts and perhaps a bombing run, these are actually the nomenclature used in TunerPro to name components that make up data that is sent from a device to TunerPro. Some devices may only have some of the components, but all deviecs that send data to TunerPro will send at least a body.
Let's look at an example data string that contains all three major components. Let's suppose that a vehicle's computer sends to TunerPro 8 bytes in response to a request from TunerPro. Let's suppose that we have documentation on the data format sent from the device, and the response string has a 2 byte header, 4 byte body, and 2 byte footer. A visualization of that response is below. The numbers in the box represent the offset into the response string.
The header (also known as prefix, or preface) and footer may contain fixed or variable data, although the size must be constant (TunerPro does not support variable sized headers or footers). TunerPro currently can only verify fixed header and footer data for integrity. The header and footer data is otherwise unused, currently. Future versions may be able to parse the data in a useful way.
The body is where the data of interest in, as the payload lives in the body. The payload contains the data that is typically converted and displayed to the user.
8/29/09  20:46

## source/DADefHeader.htm
URL: https://www.tunerpro.net/WebHelp/source/DADefHeader.htm

ADX Header Editor
(TunerPro RT Only)
ADX Header Editor
The definition header contains global information about the
definition, including the definition's title (description), version of the definition
(which the author may use to identify a newer version from an older version),
author, etc. The header also contains the ALDL Commands that can be used to
acquire data from the ECM or set the ECM's state of operation.
Below is a list of each field in the header editor:
Author -
This field is used to identify the author and may
be used for contact information.
Version -
Use this field to indicate the version
of the definition. As changes are made to the definition, you may decide to
change the version number so that users may know if they're version is outdated.
Description -
This field may be used for any additional
information that may be useful to the end user or definition author.
Baud (1200-921600)
- The primary baud rate used to communicate.
RS232 Echo
- If checked, the scanning engine will expect any command sent out to the port to be reflected back immediately to the receive buffer. The echo will be discarded before any further information such as a vehicle response is processed. Many interfaces have the receive and transmit lines tied together. Such interfaces will typically require this box to be checked.
Connection Command
- This is the command that will be sent when you attempt to connect to the data stream. The command here can be a Send Command or a Macro.
Monitor Command
- This is the command that will be sent in a loop while the connection is established. The command selected here is typically the primary command used to gather info from the datastream, and can be a send command, packet listen, or macro.
Disconnect Command
- Similar to the connection command, except this command is sent when you request a disconnection from the data stream.
ADX Commands
8/2/09  19:26

## source/DADefValue.htm
URL: https://www.tunerpro.net/WebHelp/source/DADefValue.htm

ADX Values
(TunerPro RT Only)
ADX Values
ADX Values are used to convert data gathered from the stream to human-readable values that can be displayed to the user in a meaningful way. Items typically defined as ADX Values include throttle position, engine RPM, vehicle speed, coolant temperature, etc.
In this section:
General Tab
Conversion Tab
General Tab
Below are descriptions of each parameter for defining
an ADX Value item:
Title -
This
is the title of the item that will be displayed in the UI anywhere this value is referenced.
Unique ID -
The unique ID is used to uniquely identify this ADX item when it is referenced by other items, such as lists, dashboards, history tables, etc. It can also serve as an internal-only name for the author's information. The max size of this field is 15 characters. This field is not displayed to the end-user.
Description -
Comments
to associated with the item. This is only displayed in the editor itself, but
can serve as a note or reminder to the author or others who may edit the definition. In the future this may be displayed to the user (for instance, to give more detail about an error code).
Data Type -
This
setting is optional and is for data type should match the the type of value that this item represents. This field is used for XDF item linking for
data acquisition tracing
.
Stock Units -
This setting is optional and is for stock units should match the units of the value. This field is used for XDF item linking for
data acquisition tracing
.
Units Override -
This is
the units to be displayed with the value, i.e. Volts, Grams/Sec, MPH, RPM, etc. Currently this is required if you wish units to be displayed. In the future the stock units you specify in the previous field may be used if this field is blank.
Packet Offset (H | D) -
This
is the zero-based byte number within the packet that this value is associated with.  The data at this offset is used for the conversion. If the item is 8 bits (1 byte) in size, it will contain only this
byte. If it is 16 bits (2 bytes) in size, it will this byte number plus the
byte after (MSB, LSB). To input data in hexadecimal, use the left side text field. For decimal, use the right side text field.
Data Source Size -
This
specifies the number of bits (and bytes) that will be used to calculate the
displayed value. 8 bits equals 1 byte, and 16 bytes equals 2 bytes (MSB, LSB), and 32 bits is 4 bytes (MMSB, MSB, LSB LLSB).

## source/DADefBitmask.htm
URL: https://www.tunerpro.net/WebHelp/source/DADefBitmask.htm

ALDL Bit Items
(TunerPro RT Only)
ADX Bitmasks
ADX Bitmasks
items are used to display bit fields that are present in the datastream. Usually bit flags indicate that a
current condition has been met. For instance, when the oxygen sensor
is reading on the rich end of the spectrum, a &quot;Rich&quot; flag will be
set. Trouble codes are also typically outputted as bitmasks, and as such you may define
them this way.
Below is a description of each parameter in an ADX Bitmask item:
Title -
This
is the title of the item that will be displayed in the UI anywhere this value is referenced.
Unique ID -
The unique ID is used to uniquely identify this ADX item when it is referenced by other items, such as lists, dashboards, history tables, etc. It can also serve as an internal-only name for the author's information. The max size of this field is 15 characters. This field is not displayed to the end-user.
Description -
Comments
to associated with the item. This is only displayed in the editor itself, but
can serve as a note or reminder to the author or others who may edit the definition. In the future this may be displayed to the user (for instance, to give more detail about an error code).
Packet Offset (H | D) -
This
is the zero-based byte number within the packet that this value is associated with.  The data at this offset is used for the conversion. If the item is 8 bits (1 byte) in size, it will contain only this
byte. If it is 16 bits (2 bytes) in size, it will this byte number plus the
byte after (MSB, LSB). To input data in hexadecimal, use the left side text field. For decimal, use the right side text field.
Data Source Size -
This
specifies the number of bits (and bytes) that will be used to calculate the
displayed value. 8 bits equals 1 byte, and 16 bytes equals 2 bytes (MSB, LSB), and 32 bits is 4 bytes (MMSB, MSB, LSB LLSB).
LSB First -
Specifies the byte order of the source data. If checked, the source data is treated as least-significant-byte first. For instance, if the following byte sequence were streamed, in this order to the port: [11, 28], if this parameter is checked, the number that the stream represents is 2811. If this parameter is not checked, the order converts to 1128.
Display on TRUE-
This
is the title that will be displayed if the bitmask operation resolves to TRUE.
Display on FALSE -
This
is the title that will be displayed if the bitmask operation resolves to FALSE.
Alarm (TRUE/FALSE)-
If
checked, the bit set title will be displayed in red, bold faced font if the
bit is set.

## source/DADefLookup.htm
URL: https://www.tunerpro.net/WebHelp/source/DADefLookup.htm

Editing ADX Lookup Tables
(TunerPro RT Only)
ADX Lookup Tables
ADX Lookup tables allow the user to enter more
complex data sets that an ADX Value may reference for displaying data.
Adding a lookup table to the definition
To add a lookup table, click on either the Lookup
Tables root node in the item list or on the lookup table after which you'd like
to insert the new table. Once highlighted, click the &quot;Add New Item&quot; button
below the list.
Editing a lookup table
TItle -
Give
the table a simple name with which to identify it when setting up the reference
in the corresponding ADX Value.
Input Type -
The input type determines how the number you type into the input text box will be interpretted. Internally, all inputs are stored as floating point numbers, meaning an entry of &quot;1&quot; is stored as 1.0, and &quot;0xA&quot; is stored as 10.0.
Output Type -
This is the &quot;type&quot; of the table. If Interger
is selected, each output number you enter will represent an integer (no
decimal point) on output. Select &quot;Floating Point&quot; to have each entry outputted as a floating point number (decimal point), or select &quot;String&quot; if each
entry will contain a string (a string is a group of characters that together
make up a word or sentence).
Lookup Mode -
The lookup mode determines how the output value for a given input is determined. See the table below for more detail
Mode
Description
Example. Given two (input, output) entries in a table of [2.0, 4.0] and [4.0, 8.0], an input of:
Note:
inputs that exactly match the input of an entry in the table will resolve to that entry's output value, regardless of the lookup mode. If an input is lower than the lowest input value of any entry in the table, the entry with the lowest input value is used. If an input is higher than the highest input value of any entry in the table, the entry with the highest input value is used.
Interpolate
Given an input value, the output value is the interpolation between the output values of previous and next entries in the table keyed on the input
2.5 would output 5.0
3.0 would ouput 6.0
3.5 would output 7.0
Closest
The input is resolved to the table entry with the closest (rounded) input value. The output is the output value of that entry.
2.5 would ouput 4.0
3.0 would output 8.0
3.5 would output 8.0

## source/DADefDashes.htm
URL: https://www.tunerpro.net/WebHelp/source/DADefDashes.htm

ADX Dashboards
(TunerPro RT Only)
ADX Dashboards
7/31/09  10:29

## source/DADefLists.htm
URL: https://www.tunerpro.net/WebHelp/source/DADefLists.htm

ADX List Views
(TunerPro RT Only)
ADX List Views
7/31/09  10:29

## source/DADefHistos.htm
URL: https://www.tunerpro.net/WebHelp/source/DADefHistos.htm

ADX History Tables
(TunerPro RT Only)
ADX History Tables
7/31/09  14:22

## source/DADefMons.htm
URL: https://www.tunerpro.net/WebHelp/source/DADefMons.htm

ADX Monitors
(TunerPro RT Only)
ADX Monitors
7/31/09  10:32

## source/Emulation.htm
URL: https://www.tunerpro.net/WebHelp/source/Emulation.htm

Emulation Overview
(TunerPro RT Only)
Emulation
What is emulation?
Emulation in this case is the ability of a special
piece of hardware to &quot;act like&quot; a chip (EPROM or EEPROM). When changes
are made to the chip image on the host PC, the car's computer sees these changes
in real time. This means the changes are active as soon as they are updated.
This is a very valuable feature as it allows for rapid tuning. No longer is
it necessary to burn a chip after each change is made. Instead, a change can
be made on the side of the road (*never* drive and make changes at the same
time), updated, and the car can immediately be test driven, then more changes,
test drive, etc. A weekend of tuning becomes an hour of tuning.
Emulation Hardware
In order to emulate, a special piece of hardware
is needed (the emulator itself). There are a few companies that offer this
hardware. Currently TunerPro RT is compatible with Transtronic's Romulator
and Craig Moates' AutoProm. These devices plug in between the host PC and
the car's computer. On the car side, the emulator plugs into the socket that
the car's chip normally plugs in to. On the host PC side, the emulator generally
plugs into the serial port. The emulator has in memory the active image of
the chip, and the car runs off of this buffered data. The emulator allows
changes to be made to thsi buffer while the car accesses the information.
Using TunerPro RT to emulate
To emulate using TunerPro RT:
1) Hook up your emulation hardware per the manufacturers
instructions
2) Start the program. If the hardware was installed
properly and is properly connected, it should be auto-detected at application
startup. If you connect the hardware after starting TunerPro, you'll need
to initialize it by selecting &quot;Initialize Attached Hardware&quot; from
the Tools menu or the RT toolbar.
3) Load the bin you wish to use as you normally
would when editing, and load the bin definition as you normally would.
4) It may be helpful to open the emulation toolbar
from the view->toolbars menu or by right-clicking in the main toolbar.
5
) Press the &quot;Upload
Current Bin&quot; button. This loads the currently active bin (in TunerPro)
into the emulation hardware's buffer.

## source/EmulationStart.htm
URL: https://www.tunerpro.net/WebHelp/source/EmulationStart.htm

Getting Started with Emulation
(TunerPro RT Only)
Emulation: Getting Started
To begin emulating
1) Be sure your emulation hardware is attached
and configured appropriately in the preferences menu
2) Load the bin you'd like to emulate along with the appropriate description
file for the bin.
3) If the hardware is installed and connected properly, it should be auto-detected
at application startup. If not, select &quot;initialize attached hardware&quot;
from the file manu.
4 ) You may optionally open the emulation toolbar by selecting it in the view->toolbars
menu or by right clicking in the toolbar window and selecting it.
5) Select &quot;upload current bin&quot;.
This uploads the active bin to the emulator
6) Verify that the bin was uploaded correctly by selecting &quot;Verify&quot;
7) Click &quot;Emulate&quot;
At this point, any changes you make to the current
bin will be uploaded to the emulator and therefore the car should be running
on the changes. If at any point you are uncertain about the emulation buffer's
contents, press &quot;upload curernt bin&quot;. This will update the emulator
with the current bin including any changes you might have made since it was
opened.
7/17/09  23:03

## source/EmulationToolbar.htm
URL: https://www.tunerpro.net/WebHelp/source/EmulationToolbar.htm

The Emulation Toolbar
(TunerPro RT Only)
The Emulation Toolbar
The Emulation toolbar can be used as a shortcut
for common emulation tasks. The buttons are only enabled if emulation hardware
is detected. To detect hardware, select &quot;Initialize Attached Hardware&quot;
from the Tools menu. Below is an outline of the emulation toolbar button functionality.
Upload Current Bin:
This important button uploads the bin currently
loaded for editing in TunerPro to the emulation hardware. This &quot;syncs&quot;
the emulator with the data loaded in the software. Any time you're uncertain
of the emulation buffer's contents, you should press this button to synchronize
the current bin with the emulator. This is a hard-write (and not invisible
to the ECM), so you should not be actively driving your car when you press
this button. You should be pulled over, engine-off, key-on.
Download Current Bin:
This button downloads the bin from the emulator
into the current edit buffer. The size of the bin downloaded is determined
by the currently loaded bin definition file (XDF).
Verify ROM with Bin:
This button will compare the contents of the
emulation buffer with the contents of the current file loaded in the software.
If they match, it will show &quot;success&quot;, if not, it will show &quot;failed&quot;.
If the test return failure, the data in the emulator does not match the data
loaded in the software. You should upload the current bin and run the test
again.
ROM to File:
ROM to file allows you to save the emulation
buffer contents directly to file. To make use of this, you need to know how
large the emulation buffer is in its entirety for the hardware you're using.
A Romulator I, for instance, has 32k of emulation memory (0000-7FFF). If you
are emulating a 16k chip, the chip will &quot;live&quot; in the upper 16k
of memory in the emulator (4000-7FFF). So, if you'd like to dump a 16k chip
from the emulator, you should enter 4000 in the MemStart$ field and 7FFF in
the MemEnd$ field, then press execute. You will be prompted to select a file
to save to (you can create a new file or select an existing file). After you
press Save, the emulation buffer will be dumped to the file you selected.
Enable Emulation:
After the emulator has been initialized and the
current bin has been uploaded, the Enable Emulation button will be enabled.

## source/DiffTool.htm
URL: https://www.tunerpro.net/WebHelp/source/DiffTool.htm

The Comparison Tool
The Comparison Tool
The Difference Tool is used to quickly and easily
view the differences between any two loaded bins, including the currently
editable bin and any of the 4 compare bins.
To use the tool:
1) Load the bins you'd like to compare into the
current editable buffer (File->Open Bin) and/or the Compare Bin buffers
( Ctrl + F1 ).
2) Open the Difference Tool via the Tools menu or by pressing Ctrl + T.
3) Select the two bins you'd like to compare
4) Enter the start and end addresses within which to search. These should
default to the current editable bin size.
5) Select whether or not to limit the search to only items defined in the
XDF. If unchecked, all different bytes will be shown, even if they aren't
currently defined in the XDF. Non-defined items will be displayed in blue
text (see picture above).
6) Click &quot;Search&quot;
The resulting list will contain a row for each
byte that is different between the two bins. Note that a 2-byte XDF item may
be displayed in 2 separate rows if both bytes of the item are different between
the two bins (see &quot;PROM ID&quot; in the screenshot above - this is a
single item in the XDF, but is two bytes in size). Also note that there will
be an entry for each byte that may be different within a table. For instance,
if 4 cells of the spark advance table aredifferent (each cell being a single
byte), there will be 4 rows in the resulting list, each representing a cell.
You can single click an item to find the item
in the main and/or summary lists. Double clicking a defined item will open
the editor for that item.
7/8/09  21:03

## source/FindItem.htm
URL: https://www.tunerpro.net/WebHelp/source/FindItem.htm

Find Item Tool
Find Item Tool
The Find Item Tool is great for finding items
with a common title (or word within their title), and even better as a tool
for cross-referencing addresses within a bin with a defined item. This is
great for going through a hack file and finding out whether or not your definition
file contains an item.
You can specify to search within a single item-type,
or search all item types. You may search by title, address, and size. Once
you've performed your search, you may highlight an item in the resulting list
to find the item in the master lists (or summary list), and double click to
open the item
7/8/09  21:09

## source/BinStacker.htm
URL: https://www.tunerpro.net/WebHelp/source/BinStacker.htm

Bin Stacker
Bin Stacker
The Bin Stacker is used for stacking (or &quot;compiling&quot;
as it is sometimes referred to) smaller bins on top of each other to create
a single, larger file. This is useful, for instance, when you need to put a
16k bin (say, a $6E bin) onto a 32k chip (say, a 29C256 EEPROM). Traditionally,
you would need to burn the 16k bin into the upper 16k of the 32k chip. Bin stacker
allows you to create a 32k file from the 16k bin (in this example).
Bin Stacker is also good for switching devices available from
various sources. These devices allow you to switch between multiple bins on
a single chip, allowing you to, for instance, switch between a &quot;valet&quot;
bin (low performance) and a performance bin, or to test different bin revisions.
Craig Moates (www.moates.net) offers such a switching device.
Description of Interface
Bin Size -
Specifies the size of a single
bin in the layout.
Chip Size -
Specifies the size of the chip that the final layout will
be burned onto.
Switch Block Size -
Specifies the size of each block of memory that a
switch position contains. If you wish to stack a single, smaller bin onto a
chip larger than the bin, you should set the switch block size to match the
size of the chip. For instance, to stack a 16k bin onto a 32k chip (29C256),
set the switch block size to 32k.
Output File -
Specifies the full path of the output file to which the
new, stacked bin will be outputted. To browse to the desired folder/file, click
the Browse button.
Save Layout -
Saves
the layout (paths and parameters) to a file for convenient loading at a later
time.
Load Layout -
Loads a layout from file.
Append -
Once you've
selected your bins and an output file, click the append button to stack the
bins. When stacking is complete, you will be presented with a message box stating

## source/GraphicalTableFinder.htm
URL: https://www.tunerpro.net/WebHelp/source/GraphicalTableFinder.htm

Graphical Table Finder
Graphical Table Finder
Advanced users can make use of the graphical
table finder for viewing &quot;unknown portions&quot; of a bin. Using this
tool, it is much easier to see the repeating patterns and/or characteristic
shapes typical of tables. In the image below, it is quite easy to make out
the repeating rows of the main spark table of $6E code.
To make use of the table finder, open a bin using
TunerPro or TunerPro RT, then press &quot;Ctrl + G&quot;, or selected &quot;Graphical
Table Finder&quot; from the Tools->Advanced menu.
To scroll through the bin visually, drag the
position slider at the top of the toolbox. The viewport can be zoomed by moving
the Viewport Zoom slider. Alternately, you can type the start address you'd
like to view. The viewport will display the information at and beyond the
addrss automatically. The range and therefore end address displayed will depend
on the start address being viewed and the current zoom settings. it is possible
to view around 275 bytes at a time.
I personally use this tool in conjunction with
the &quot;Item Finder&quot; tool (Ctrl + F) by placing a region that I believe
may be a table at the beginning of the viewport, the inputting the start address
in the item finder and searching my XDF file for an item at that address.
If an item doesn't exist, I know I'm missing information in that region. I
can then consult a hack (or disassemble myself) for the information I need.
Item Finder
7/8/09  21:02

## source/HexEditor.htm
URL: https://www.tunerpro.net/WebHelp/source/HexEditor.htm

Hex Editor
Hex Editor
TunerPro's built-in Hex Editor can be used to
view the bin in its' &quot;raw&quot; form. This is typically useful to people
who wish to make changes outside of the defined items
.
Editor Overview
The Hex Editor displays the raw byte values in
rows from left to right. The column to the left displays the first offset
of a respective row. In the example above, the byte value 24 is the first
byte in the bin and is at offset 0 (as can be seen in the offset column).
The second byte, D7, is at offset 01. The second row of byte values begins
at offset 10, etc.
The right most column displays a byte's ASCII
text counterpart. For general bin editing this isn't very useful, however
if there are text strings contained in the bin, they become immediately apparent
in this column.
Status Bar
The status bar displays the current offset of
the cursor and the value under it, the offset range of a selection of multiple
bytes and the number of bytes selected, as well as the insert mode (in the
screen shot above, its OVR for &quot;Overwrite&quot;.
Real-time parameter location
If any of the item lists (either the main list
or the Item Summary List) are open, you'll notice that if you place the cursor
at an offset that has an associated XDF item, that XDF item will be selected
in the list. This makes it easy to tell what XDF item you're editing in the
Hex Editor. If multiple bytes or a range of bytes are selected, a single XDF
item cannot be selected. This is by design.
Commiting changes
Changes made to the bin in the Hex Editor show
up in red. To commit these changes to the active TunerPro bin, go to the Action
menu and select &quot;Commit Changes&quot;. If you've made changes and exit
the hex editor, you'll be asked if you'd like to commit the changes.
Note:
After committing changes, you'll still need to save the bin to file
using the main TunerPro File->Save action.
Saving changes to a separate file
You can save your changes to file without committing
the changes to the active TunerPro bin by select Action->Save As...

## source/AutoPromOverview.htm
URL: https://www.tunerpro.net/WebHelp/source/AutoPromOverview.htm

AutoProm Features Overview
AutoProm Features Overview
Craig Moates' AutoProm has an exclusive subset
of powerful features. TunerPro fully supports the AutoProm and all of its
features, including:
Emulation
ALDL Data Monitoring
PROM burning/reading (29C256, 29C040)
3 channel A/D monitoring and logging
Firmware Update
To enable emulation with the AutoProm, open the &quot;ALDL/Emulation&quot;
preferences tab and select &quot;AutoProm&quot; for the emulation device.
ALDL Data Monitoring with the AutoProm is identical to that
of a standard ALDL link cable. To enable ALDL with the AutoProm, open the &quot;ALDL/Emulation&quot;
preferences tab and select &quot;AutoProm&quot; for the interface type. Additionally,
you may use the AutoProm for monitoring as a standard ALDL interface by toggling
the appropriate switch on the back of the device. If toggled, you'll selec &quot;MAX232/233/2-trans&quot;
for the interface type. This makes the AutoProm compatible with other ALDL logging
software, but also disables the AutoProm's emulation and chip burning abilities.
AutoProm currently supports reading and programming 29C256 and
29F040 EEPROMS. These chips are commonly used replacements for the stock chips
in C3 and C4 ECMs. The 29F040 can be used in a Moate's G3 adapter which allows
the user to select from up to 16 different chip images without changing the
EEPROM. For more information, visit Craig's site at
http://www.moates.net.
Emulation
,
ALDL Overview
,
AutoProm PROM Burning & Reading
7/16/09  16:29

## source/AutoPromPROMIO.htm
URL: https://www.tunerpro.net/WebHelp/source/AutoPromPROMIO.htm

AutoProm PROM Burning & Reading
Prom Burning & Reading with the AutoProm and Flash & Burn Hardware
The AutoProm and Flash & Burn feature chip
burning/reading capabilities that support the following chips:
Read & Write:
29C256 (256kbit, 32kbyte)
29F040 (4mbit, 512kbyte)
27SF512 (512kbit, 64kbyte) **
Reading (Read-Only)::
2732A
27C128
27C256
27C512
J3 Ford EEC-IV Reader (Moates)
J3 Ford EEC-V Reader (Moates)
** AutoProm USB Version only - Serial version
does not support this chip for writing
Below is an outline of how to make use of these
features using TunerPro.
Overviews
Chip I/O in TunerPro is accomplished with a mediary
&quot;buffer&quot;. Burning a file to a chip requires that this buffer be
filled with the file. The buffer is then burned to the chip. Similarly, reading
a chip to a file is done by way of the buffer. The chip gets read into the
buffer, then the buffer gets saved to file.
Burning a chip
From File -
To
burn a file to a chip:
1) Connect the AutoProm or Flash & Burn to
your computer and make sure it has appropriate power
2) Open TunerPro and make sure that the hardware is detected
3) Press Ctrl + B or select &quot;Read/Write Prom&quot; from the tools menu.
This will open the PROM interface pictured above
4) Select the chip you'll be programming in the &quot;Supported Chips&quot;
list.
5) Load the file into the buffer by selecting &quot;Load File to Buffer&quot;.
Note: When loading a file, the chip addressing is automatically changed
to burn the file to the upper portion of the chip in the case of the file
being smaller than the selected chip type.

## source/CreatingECUs.htm
URL: https://www.tunerpro.net/WebHelp/source/CreatingECUs.htm

The Basics of creating an ECU file from a hack
The Basics of creating
an ECU file (or any definition file) from a hack
By Mark
Mansur
Introduction
There seems
to be a growing number of questions asking how to create bin definition files
provided access to a hack for a particular application. The purpose of this
document is to give the reader enough information to create a definition file
with which he can modify his bin, without being able to read assembly.
This document
uses the ECU file format and TunerPro as the working environment and the $6E
ARAP disassembly (hack) as the vehicle application. The concepts within can
be applied to potentially any definition file format.
The
ECU File Format
Since this
document uses the ECU file format as an example, lets take a quick look at
the format. The ECU file format was created for a program called PROM Edit
by Wayne Blair. The format is in the public domain and is used by a number
of different applications today. ECU files contain the basic information needed
to convert information in a .bin file to &quot;real world&quot; engineering
values. ECU files are defined by a 'header&quot; which describes the global
bin file properties and the ECU file itself, followed by each of the &quot;items&quot;.
The ECU header
describes the global properties of the bin file including the location of
the checksum, the address range within which the checksum is calculated, and
information about the ECU file itself such as the number of items contained
in the file. The header
must
be filled out correctly in order
for the checksum to be calculated correctly. Below is a list of each field
in the header and a description of its' use.
ECU ID
A brief description
of the ECU file's intended application. Can be something like &quot;1989
Trans Am $6E&quot; or &quot;GM P4 ECM&quot;
File Size
The size of the bin

## source/UnderstandingHex.htm
URL: https://www.tunerpro.net/WebHelp/source/UnderstandingHex.htm

Understanding Hex for the DIY-EFI enthusiast - Mark Mansur
Understanding
Hex
by Mark
Mansur
http://www.tunerpro.net/
Introduction
Hexidecimal
seems to be a mystical topic to a good portion of beginners in the DIY-EFI
community. I hope to clear up the concept as simply as possible with this
short paper.
Decimal
and Base-10
If you can
read this paper theres a good chance you can also count. When we count in
our every-day world, we count in decimal. The &quot;geek&quot; term for decimal
is Base-10. What it means is that we use 10 different, unique, digits as building
blocks to form numbers (all numbers). For the sake of clarity, I'll list the
base-10 digits: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9.
Hexidecimal
and Base-16
So what exactly
is hexidecimal? Well, its base-16 (Hex means 6 and decimal means 10. Look:
6 + 10 = 16)! And from what I told you about base-10, you sharper readers
may have deduced that it means we use 16 different, unique digits to form
numbers (all numbers). Again, for clarity, I'll list the base-16 digits: 0,
1, 2, 3, 4, 5, 6, 7, 8, 9, A, B, C, D, E, F.
What's
with the letters?
In every-day
counting we are familiar with digits 0-9. But what if we wanted more numeric
&quot;building blocks&quot; with which we could create numbers? We would have
to invent 6 more digits. Having an alphabet at our disposal makes this easy.
We'll borrow letters!. A is the 10th digit, B is the 11th digit, etc, ending
with F as the 15th digit.
Ones,
Tens, Hundreds, and Ones, Sixteens, and Two-Fifty-Sixes!
When we count
from 0, what do we do when we run out of digits in the ones column? We increment
the number in the tens column and start again from zero in the ones column!

