https://nodejs.org/en/

setup:
npm install

Check if there are any new channels.
https://docs.google.com/spreadsheets/d/1CrTNfB8D7zKl0dnyvcbWSEnAC-vp8SwNebc18M33MeU/edit#gid=0
Look at the column "Updated on". Paul adds new channels once per day.
Add any new ones to the c.queue in the file.
If Paul notices duplicate events then he'll tell you which camp. Search the terminal log for the name of the venue and you will find a channel that has both a GUID and a friendly name in the list. Remove one of them.

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

Send Paul events.csv via slack
Send @RedBirdBean the PSTevents.csv via slack

