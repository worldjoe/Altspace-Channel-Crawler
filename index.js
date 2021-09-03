const fs = require('fs')
const Crawler = require('crawler');

  /*
const fileContents = fs.readFileSync('./magic.html').toString()

// Queue some HTML code directly without grabbing (mostly for tests)
eventCrawler.queue([{
    html: fileContents
}]);
*/

fs.writeFile('venue.csv', 'VENUE NAME,VENUE WEBSITE\n', function (err) {
  if (err) return console.log(err);
});

/*
fs.writeFile('organizer.csv', 'ORGANIZER NAME,ORGANIZER EMAIL,ORGANIZER WEBSITE,ORGANIZER PHONE', function (err) {
  if (err) return console.log(err);
});
*/


fs.writeFile('events.csv', 'EVENT NAME,VENUE NAME,START DATE,START TIME,END DATE,END TIME,TIMEZONE, CATEGORIES,EVENT WEBSITE,EVENT DESCRIPTION, EVENT CODE\n', function (err) {
  if (err) return console.log(err);
});

fs.writeFile('PSTevents.csv', 'EVENT NAME,VENUE NAME,START DATE,START TIME,END DATE,END TIME,TIMEZONE, CATEGORIES,EVENT WEBSITE,EVENT DESCRIPTION, EVENT CODE\n', function (err) {
  if (err) return console.log(err);
});


function writeVenue(name, website) {
  name = name.replace(' | AltspaceVR', '');
  name = name.replace("'", '');
  name = name.replace(/,/g, '');
  venueText = name + ',' + website + '\n';
  console.log("Writing venue " + venueText);
  fs.appendFile('venue.csv', venueText, function (err) {
    if (err) return console.log(err);
  });
  return name;
}

function writeEvent(name, venue, unixStartTime, unixEndTime, tags, website, description, eventCode) {
  name = name.replace(' | AltspaceVR', '');
  name = name.replace(/,/g, '');
  //  venue = venue.replace(' Channel', '');

  var endDateUTCObj = new Date(unixEndTime * 1000);
  var startDateUTCObj = new Date(unixStartTime * 1000);
  console.log('ISO Start Date' + startDateUTCObj.toISOString());
  console.log('ISO End Date' + endDateUTCObj.toISOString());
  var startMonthUTC =  startDateUTCObj.getUTCMonth()+1;
  var endMonthUTC=  endDateUTCObj.getUTCMonth()+1;

  var startHoursUTC =  startDateUTCObj.getUTCHours();
  var endHoursUTC =  endDateUTCObj.getUTCHours();

  var startDateUTC = startDateUTCObj.getUTCFullYear() + '-' + startMonthUTC + '-' + startDateUTCObj.getUTCDate();
  var endDateUTC = endDateUTCObj.getUTCFullYear() + '-' + endMonthUTC + '-' + endDateUTCObj.getUTCDate();

  var startTimeUTC = startHoursUTC + ':' + startDateUTCObj.getUTCMinutes() + ':' + startDateUTCObj.getUTCSeconds();
  var endTimeUTC = endHoursUTC + ':' + endDateUTCObj.getUTCMinutes() + ':' + endDateUTCObj.getUTCSeconds();


  var startMonthPST =  startDateUTCObj.getMonth()+1;
  var endMonthPST=  endDateUTCObj.getMonth()+1;

  var startHoursPST =  startDateUTCObj.getHours();
  var endHoursPST =  endDateUTCObj.getHours();

  var startDatePST = startDateUTCObj.getFullYear() + '-' + startMonthPST + '-' + startDateUTCObj.getDate();
  var endDatePST = endDateUTCObj.getFullYear() + '-' + endMonthPST + '-' + endDateUTCObj.getUTCDate();

  var startTimePST = startHoursPST + ':' + startDateUTCObj.getMinutes() + ':' + startDateUTCObj.getSeconds();
  var endTimePST = endHoursPST + ':' + endDateUTCObj.getMinutes() + ':' + endDateUTCObj.getSeconds();

  description = description.replace('"', '\'');
  description = description.replace(/\n/gi, '');
  description = description.replace(/\r/gi, '');
  description = description.replace(/,/g, '');

  name = name.replace('"', '\'');
  name = name.replace(/\n/gi, '');
  name = name.replace(/\r/gi, '');

  var eventString = '"' + name + '",' + venue + ',' + startDateUTC + ',' + startTimeUTC + ',' + endDateUTC + ',' + endTimeUTC + ',' + 'UTC,"' + tags.join() + '",' + website + ',"' + description + '",' + eventCode + '\n';
  var eventStringPST = '"' + name + '",' + venue + ',' + startDatePST + ',' + startTimePST + ',' + endDatePST + ',' + endTimePST + ',' + 'PST,"' + tags.join() + '",' + website + ',"' + description + '",' + eventCode + '\n';
  console.log(eventString);

  fs.appendFile('events.csv', eventString, function (err) {
    if (err) return console.log(err);
  });
  fs.appendFile('PSTevents.csv', eventStringPST, function (err) {
    if (err) return console.log(err);
  });
}

function isDuringBurnWeek(unixStartTime) {
  // gate is August 28th
  // departure is September 6th
  // Friday August 27 = 1630121546
  // Tuesday September 7th = 1631057546
  //
  if (unixStartTime > 1630121546 && unixStartTime < 1631057546) {
    return true;
  }
  return false;
}

function handleEventLink(venue, eventLink) {
  console.log(eventLink);
  const eventCrawler = new Crawler({
    maxConnections: 10,
    // This will be called for each crawled page
    callback: (error, res, done) => {
        if (error) {
            console.log(error);
        } else {
            const $ = res.$;
            // $ is Cheerio by default
            //a lean implementation of core jQuery designed specifically for the server
          var title = $('title').text();
            console.log(title);
            var links = $("a");
          //          var venue;
          links.each(function(i, link) {
            var linkHref = $(link).attr("href");
            if (linkHref.search(/\/channels\//i) !== -1) {
               console.log("Channel = " + linkHref);
              //    venue = $(link).find('h2').text();
              console.log("Venue = " + venue);
            }
          });

          var description = $('meta[property="og:description"]').attr('content');
            var timeDiv = $('div.time-info-one-line-no-day-of-week');
            var unixEndTime = $(timeDiv).attr("data-unix-end-time");
            var unixStartTime = $(timeDiv).attr("data-unix-start-time");
          var endDateObj = new Date(unixEndTime * 1000);
          var startDateObj = new Date(unixStartTime * 1000);
          utcEndString = endDateObj.toUTCString();
          utcStartString = startDateObj.toUTCString();
          console.log("Start time: " + utcStartString);
          console.log("End time: " + utcEndString);

          // find tags/categories
          var aHashTags = $("div.hashtags").find('a')
          var hashTagArray = new Array();
          aHashTags.each(function(i, tag) {
            console.log ("Tag " + $(tag).text());
            hashTagArray.push($(tag).text());
          });
          console.log(description);

          // find event code
          var eventCode = $("div.event_code").find("span").text();
          console.log("Event Code " + eventCode);

          // don't add any events from camps that aren't during burn week
          // unless they are hosted by BRCvr Events
          if (venue.localeCompare("BRCvr Events") == 0 || isDuringBurnWeek(unixStartTime)) {
            writeEvent(title, venue, unixStartTime, unixEndTime, hashTagArray, 'https://account.altvr.com/' + eventLink, description, eventCode);
          } else {
            console.log("Ignoring non burn week event from " + venue);
          }

        }
        done();
    }
});
  eventCrawler.queue('https://account.altvr.com' + eventLink);
}

const c = new Crawler({
    maxConnections: 10,
    // This will be called for each crawled page
    callback: (error, res, done) => {
        if (error) {
            console.log(error);
        } else {
            const $ = res.$;
            // $ is Cheerio by default
            //a lean implementation of core jQuery designed specifically for the server
          //console.log($('title').text());
          // console.log($('div.banner__footer').text());
          var links = $("a");
          var venue = $('title').text();
          venue = writeVenue(venue, res.request.uri.href);
          links.each(function(i, link) {
            //console.log($(link).attr("href"));
            var linkHref = $(link).attr("href");
            if (linkHref.search(/\/events\//i) !== -1) {
              var start_time = $(link).find('div.time-info-date').attr('data-unix-start-time');
              //console.log(start_time);
              if (start_time != undefined) {
                //                console.log("skipping past event");
              } else {
                //                console.log(res.request.uri.href);
                handleEventLink(venue, linkHref);
              }
            }
          });
        }
        done();
    }
});

// Queue just one URL, with default callback
// to find the NUMBER of the channel look for the favoritable_id href
//c.queue();
//c.queue( '');
c.queue( 'https://account.altvr.com/channels/1809820067253191080');
c.queue( 'https://account.altvr.com/channels/1812211998444749374');
c.queue( 'https://account.altvr.com/channels/1812610100926349655');
c.queue( 'https://account.altvr.com/channels/1810207574570565838');
c.queue( 'https://account.altvr.com/channels/1810611495667499372');
c.queue( 'https://account.altvr.com/channels/BRCvrVirtualRangerEvents');
c.queue( 'https://account.altvr.com/channels/masonevents');
c.queue( 'https://account.altvr.com/channels/1812693036384125777');
c.queue( 'https://account.altvr.com/channels/1812624932270506039');
c.queue( 'https://account.altvr.com/channels/1812661889163854714');
c.queue( 'https://account.altvr.com/channels/Void');
c.queue( 'https://account.altvr.com/channels/BurningMountain');
c.queue( 'https://account.altvr.com/channels/flight2mars');
c.queue( 'https://account.altvr.com/channels/domensions');
c.queue( 'https://account.altvr.com/channels/recyclecamp');
c.queue( 'https://account.altvr.com/channels/BRC3PO');
c.queue( 'https://account.altvr.com/channels/Gnosis');
c.queue( 'https://account.altvr.com/channels/Chronotron');
c.queue( 'https://account.altvr.com/channels/1809913081313099942');
c.queue( 'https://account.altvr.com/channels/walterthebus');
c.queue( 'https://account.altvr.com/channels/beatsntreats');
c.queue( 'https://account.altvr.com/channels/friday742');
c.queue( 'https://account.altvr.com/channels/1810363593342845345');
c.queue( 'https://account.altvr.com/channels/i-transcendence');
c.queue( 'https://account.altvr.com/channels/SendmeaNeonHeart');
c.queue( 'https://account.altvr.com/channels/videogasmchannel');
c.queue( 'https://account.altvr.com/channels/BRCvr_Tanu');
c.queue( 'https://account.altvr.com/channels/meditation');
c.queue( 'https://account.altvr.com/channels/1647417260878332280');
c.queue( 'https://account.altvr.com/channels/1812628766552228619');
c.queue( 'https://account.altvr.com/channels/paperbrcvr');
c.queue( 'https://account.altvr.com/channels/realfluffycloud');
c.queue( 'https://account.altvr.com/channels/wellbeinginVR');
c.queue( 'https://account.altvr.com/channels/tlp');
c.queue( 'https://account.altvr.com/channels/1808531147869651662');
c.queue( 'https://account.altvr.com/channels/1804280890814104486');
c.queue( 'https://account.altvr.com/channels/nikosevents');
c.queue( 'https://account.altvr.com/channels/pagansinvr');
c.queue( 'https://account.altvr.com/channels/1812601767288897536');
c.queue( 'https://account.altvr.com/channels/1811372096408781400');
c.queue( 'https://account.altvr.com/channels/1812514981829149444');
c.queue( 'https://account.altvr.com/channels/1554230696057242125');
c.queue( 'https://account.altvr.com/channels/nymphs_vrium');
c.queue( 'https://account.altvr.com/channels/otterspace');
c.queue( 'https://account.altvr.com/channels/brcvr');
c.queue( 'https://account.altvr.com/channels/Marshmallow');
c.queue( 'https://account.altvr.com/channels/DJCeleste');
c.queue( 'https://account.altvr.com/channels/VenusSX');
c.queue( 'https://account.altvr.com/channels/CampKissingFish');
c.queue( 'https://account.altvr.com/channels/timemachine');
c.queue( 'https://account.altvr.com/channels/TurtleTurtleTurtle');
c.queue( 'https://account.altvr.com/channels/aestheticmobiledivision');
c.queue( 'https://account.altvr.com/channels/Fuckup-Nights-Armenia-261262471068075');
c.queue( 'https://account.altvr.com/channels/1812830832423862845');
c.queue( 'https://account.altvr.com/channels/feed-the-artists');
c.queue( 'https://account.altvr.com/channels/Contraptionists');
c.queue( 'https://account.altvr.com/channels/darcy');
c.queue( 'https://account.altvr.com/channels/1814090315309514795');
c.queue( 'https://account.altvr.com/channels/1814074672115876509');
c.queue( 'https://account.altvr.com/channels/1813472249668173829');
c.queue( 'https://account.altvr.com/channels/1813640042363486347');
c.queue( 'https://account.altvr.com/channels/1813656996696555588');
c.queue( 'https://account.altvr.com/channels/bkabstract');
c.queue( 'https://account.altvr.com/channels/mucarobynino');
c.queue( 'https://account.altvr.com/channels/awakenthegiants');
c.queue( 'https://account.altvr.com/channels/1814763864412128130');
c.queue( 'https://account.altvr.com/channels/Cosmic');
c.queue( 'https://account.altvr.com/channels/CampBurningSaucer');
c.queue( 'https://account.altvr.com/channels/1550949030748487816');
c.queue( 'https://account.altvr.com/channels/Samskara');
c.queue( 'https://account.altvr.com/channels/DarkSideZone');
c.queue( 'https://account.altvr.com/channels/DeepArtZone');
c.queue( 'https://account.altvr.com/channels/LiminalZone');
c.queue( 'https://account.altvr.com/channels/centercamp');
c.queue( 'https://account.altvr.com/channels/EmbassyofBurningManInformation');
c.queue( 'https://account.altvr.com/channels/SafetyThirdZone');
c.queue( 'https://account.altvr.com/channels/EcoZone');
c.queue( 'https://account.altvr.com/channels/KeyholeZone');
c.queue( 'https://account.altvr.com/channels/EsplanadeZone');
c.queue( 'https://account.altvr.com/channels/1554776506708788165');
c.queue( 'https://account.altvr.com/channels/TempleoftheGuardian');
c.queue( 'https://account.altvr.com/channels/BRCvr_Main_Stage');
c.queue( 'https://account.altvr.com/channels/El_Pulpo');
c.queue( 'https://account.altvr.com/channels/1813996556886474995');
c.queue( 'https://account.altvr.com/channels/1814970724029301525');
c.queue( 'https://account.altvr.com/channels/MerryMadTeaParty2021');
c.queue( 'https://account.altvr.com/channels/winkinglotus');
c.queue( 'https://account.altvr.com/channels/1815689017002295357');
c.queue( 'https://account.altvr.com/channels/TheBar');
c.queue( 'https://account.altvr.com/channels/disorient');
c.queue( 'https://account.altvr.com/channels/1814290999141204079');



// Queue a list of URLs
//c.queue(['http://www.google.com/','http://www.yahoo.com']);

/*
// Queue URLs with custom callbacks & parameters
c.queue([{
    uri: 'http://parishackers.org/',
    jQuery: false,

    // The global callback won't be called
    callback: (error, res, done) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Grabbed', res.body.length, 'bytes');
        }
        done();
    }
}]);

// Queue some HTML code directly without grabbing (mostly for tests)
c.queue([{
    html: '<p>This is a <strong>test</strong></p>'
}]);
*/
