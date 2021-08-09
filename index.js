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
  venueText = name + ',' + website + '\n';
  console.log("Writing venue " + venueText);
  fs.appendFile('venue.csv', venueText, function (err) {
    if (err) return console.log(err);
  });
  return name;
}

function writeEvent(name, venue, unixStartTime, unixEndTime, tags, website, description) {
  name = name.replace(' | AltspaceVR', '');
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

          writeEvent(title, venue, unixStartTime, unixEndTime, hashTagArray, 'https://account.altvr.com/' + eventLink, description);

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
c.queue( 'https://account.altvr.com/channels/otterspace');
c.queue( 'https://account.altvr.com/channels/brcvr');
c.queue( 'https://account.altvr.com/channels/VenusSX');

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
