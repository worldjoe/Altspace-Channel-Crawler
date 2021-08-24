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


fs.writeFile('events.csv', 'EVENT NAME,VENUE NAME,START DATE,START TIME,END DATE,END TIME,TIMEZONE, CATEGORIES,EVENT WEBSITE,EVENT DESCRIPTION\n', function (err) {
  if (err) return console.log(err);
});


function writeVenue(name, website) {
  name = name.replace(' | AltspaceVR', '');
  name = name.replace("'", '');
  venueText = name + ',' + website + '\n';
  console.log("Writing venue " + venueText);
  fs.appendFile('venue.csv', venueText, function (err) {
    if (err) return console.log(err);
  });
  return name;
}

function writeEvent(name, venue, unixStartTime, unixEndTime, tags, website, description) {
  name = name.replace(' | AltspaceVR', '');
  name = name.replace(',', '');
  //  venue = venue.replace(' Channel', '');

  var endDateObj = new Date(unixEndTime * 1000);
  var startDateObj = new Date(unixStartTime * 1000);
  console.log('ISO Start Date' + startDateObj.toISOString());
  console.log('ISO End Date' + endDateObj.toISOString());
  var startMonth =  startDateObj.getUTCMonth()+1;
  var endMonth =  endDateObj.getUTCMonth()+1;

  var startHours =  startDateObj.getUTCHours();
  var endHours =  endDateObj.getUTCHours();

  var startDate = startDateObj.getUTCFullYear() + '-' + startMonth + '-' + startDateObj.getUTCDate();
  var endDate = endDateObj.getUTCFullYear() + '-' + endMonth + '-' + endDateObj.getUTCDate();

  var startTime = startHours + ':' + startDateObj.getUTCMinutes() + ':' + startDateObj.getUTCSeconds();
  var endTime = endHours + ':' + endDateObj.getUTCMinutes() + ':' + endDateObj.getUTCSeconds();

  description = description.replace('"', '\'');
  description = description.replace(/\n/gi, '');
  description = description.replace(/\r/gi, '');

  name = name.replace('"', '\'');
  name = name.replace(/\n/gi, '');
  name = name.replace(/\r/gi, '');

  var eventString = '"' + name + '",' + venue + ',' + startDate + ',' + startTime + ',' + endDate + ',' + endTime + ',' + 'UTC,"' + tags.join() + '",' + website + ',"' + description + '"\n';
  console.log(eventString);

  fs.appendFile('events.csv', eventString, function (err) {
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

          // don't add any events from camps that aren't during burn week
          // unless they are hosted by BRCvr Events
          if (venue.localeCompare("BRCvr Events") == 0 || isDuringBurnWeek(unixStartTime)) {
            writeEvent(title, venue, unixStartTime, unixEndTime, hashTagArray, 'https://account.altvr.com/' + eventLink, description);
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
//c.queue();
//c.queue( '');
c.queue( 'https://account.altvr.com/channels/otterspace');
c.queue( 'https://account.altvr.com/channels/brcvr');
c.queue( 'https://account.altvr.com/channels/Marshmallow');
c.queue( 'https://account.altvr.com/channels/pagansinvr');
c.queue( 'https://account.altvr.com/channels/tlp');
c.queue( 'https://account.altvr.com/channels/nikosevents');
c.queue( 'https://account.altvr.com/channels/DJCeleste');
c.queue( 'https://account.altvr.com/channels/VenusSX');
c.queue( 'https://account.altvr.com/channels/nymphs_vrium');
c.queue( 'https://account.altvr.com/channels/CampKissingFish');
c.queue( 'https://account.altvr.com/channels/wellbeinginVR');
c.queue( 'https://account.altvr.com/channels/timemachine');
c.queue( 'https://account.altvr.com/channels/paperbrcvr');
c.queue( 'https://account.altvr.com/channels/TurtleTurtleTurtle');
c.queue( 'https://account.altvr.com/channels/1804280890814104486');
c.queue( 'https://account.altvr.com/channels/nymphs_vrium');
c.queue( 'https://account.altvr.com/channels/1647417260878332280');
c.queue( 'https://account.altvr.com/channels/BurningMountain');
c.queue( 'https://account.altvr.com/channels/meditation');
c.queue( 'https://account.altvr.com/channels/aestheticmobiledivision');
c.queue( 'https://account.altvr.com/channels/videogasmchannel');
c.queue( 'https://account.altvr.com/channels/BRCvrVirtualRangerEvents');
c.queue( 'https://account.altvr.com/channels/Gnosis');
c.queue( 'https://account.altvr.com/channels/1809820067253191080');
c.queue( 'https://account.altvr.com/channels/BRC3PO');
c.queue( 'https://account.altvr.com/channels/1809913081313099942');
c.queue( 'https://account.altvr.com/channels/1808277890802909627');
c.queue( 'https://account.altvr.com/channels/1808531147869651662');
c.queue( 'https://account.altvr.com/channels/Fuckup-Nights-Armenia-261262471068075');
c.queue( 'https://account.altvr.com/channels/i-transcendence');
c.queue( 'https://account.altvr.com/channels/1810363593342845345');
c.queue( 'https://account.altvr.com/channels/1810611495667499372');
c.queue( 'https://account.altvr.com/channels/1704445078413509384');
c.queue( 'https://account.altvr.com/channels/flight2mars');
c.queue( 'https://account.altvr.com/channels/1807495125421523031');

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
