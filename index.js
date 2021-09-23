const fs = require('fs')
const Crawler = require('crawler');

  /*
const fileContents = fs.readFileSync('./magic.html').toString()

// Queue some HTML code directly without grabbing (mostly for tests)
eventCrawler.queue([{
    html: fileContents
}]);
*/

/*
fs.writeFile('organizer.csv', 'ORGANIZER NAME,ORGANIZER EMAIL,ORGANIZER WEBSITE,ORGANIZER PHONE', function (err) {
  if (err) return console.log(err);
});
*/


/*
fs.writeFile('events.csv', 'TIMESTAMP, PEOPLE_INSIDE, EVENT NAME,VENUE NAME,START DATE,START TIME,END DATE,END TIME,TIMEZONE, CATEGORIES,EVENT WEBSITE,EVENT DESCRIPTION, EVENT CODE\n', function (err) {
  if (err) return console.log(err);
});

fs.writeFile('PSTevents.csv', 'EVENT NAME,VENUE NAME,START DATE,START TIME,END DATE,END TIME,TIMEZONE, CATEGORIES,EVENT WEBSITE,EVENT DESCRIPTION, EVENT CODE\n', function (err) {
  if (err) return console.log(err);
});
*/


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

function writeEvent(timestamp, peopleInside, name, venue, unixStartTime, unixEndTime, tags, website, description, eventCode) {
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

  var eventString = timestamp + ',' + peopleInside + ',' + '"' + name + '",' + venue + ',' + startDateUTC + ',' + startTimeUTC + ',' + endDateUTC + ',' + endTimeUTC + ',' + 'UTC,"' + tags.join() + '",' + website + ',"' + description + '",' + eventCode + '\n';
  var eventStringPST = timestamp + ',' + peopleInside + ',' + '"' + name + '",' + venue + ',' + startDatePST + ',' + startTimePST + ',' + endDatePST + ',' + endTimePST + ',' + 'PST,"' + tags.join() + '",' + website + ',"' + description + '",' + eventCode + '\n';
  console.log('\x1b[32m%s\x1b[0m', eventString);

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

function handleEventLink(eventLink) {
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
            console.log('\x1b[36m%s\x1b[0m', '*****************************************************************************');
            var title = $('title').text();
            console.log(title);
            var links = $("a");
            var venue;
          links.each(function(i, link) {
            var linkHref = $(link).attr("href");
            if (linkHref.search(/\/channels\//i) !== -1) {
               console.log("Channel = " + linkHref);
               venue = $(link).find('h2').text();
              console.log("Venue = " + venue);
            }
          });

          var peopleInside = $('div.stat--value').text();
          var timeStamp = Date.now();

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

          writeEvent(timeStamp, peopleInside, title, venue, unixStartTime, unixEndTime, hashTagArray, 'https://account.altvr.com/' + eventLink, description, eventCode);

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
          console.log($('title').text());
          // console.log($('div.banner__footer').text());
          var events = $("div.event-block");
          events.each(function(i, event) {
            var linkHref =$(event).find('a').attr("href");
            var later = $(event).find('div.block-time-estimate').text();
            if (!later) {
                console.log(linkHref);
              handleEventLink(linkHref);
            } else {
            console.log(later);
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
c.queue( 'https://account.altvr.com/events/main');



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
