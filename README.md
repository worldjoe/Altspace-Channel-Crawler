setup:
npm install

run:
node index.js



Afterwards, upload the venue.csv here:
https://brcvr.org/wp-admin/edit.php?post_type=tribe_events&page=aggregator
Import Origin is "CSV File"
Ignore the Import Name
Content Type: Select "Venues"

Then, upload the events.csv here:
https://brcvr.org/wp-admin/edit.php?post_type=tribe_events&page=aggregator
Import Origin is "CSV File"
Ignore the Import Name
Content Type: Select "Events"


Open up this doc:
https://docs.google.com/spreadsheets/d/1-5queGgMVs2p15zbi6bwnrsfT7o_OEGO26xvkzo3mcY/edit#gid=500086104
and add any new venues to the Channels spreadsheet.
You can copy the contents of venue.csv and paste into the spreadsheet then click on the little clipboard icon and select "split text into columns"
Then in the drop down select Comma as the separator.

We also need to past the events.csv into the Events tab.
I find it easier to paste into a new spreadsheet, split the same as above into columns. Then clean up so only the Name and url shows up.
Then you can copy all the data from the old spreadsheet over and remove any dupes.

