const fs = require('fs');
const cheerio = require('cheerio');

function makeEmptyUser() {
    return {
        username: undefined,
        url: undefined,

        // profile_visited: false,
        // crawled: false,

        site_title: undefined,
        visitors: undefined,
        tags: [],

        followers: [],
        follows: [],
        is_supporter: false,
        updates: undefined,
        tips: undefined,

        outbound_links: new Set(),
        inbound_links: new Set(),
    }
}

// helper for other functions.
// gets the sites on a given "browse" page (tags, sort by, followers/following)
// returns a map of (username, <obj>) pairs,
// where the object has the URL for the site, number of visitors, and site title
async function getLinksOnBrowsePage(users_map, url) {
    console.log("INFO: searching for links on: " + url);

    // TODO: real error handling
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }

    const $ = cheerio.load(await response.text());

    // operate on each site listed on this browse page
    $('div.browse-page > ul').children().each(function(i, el) {


        const $el = $(el);

        let user = makeEmptyUser();
        // "'a' that is a direct child of $el"
        const $a = $el.find('> a');
        user.url = $a.attr('href');
        user.site_title = $a.attr('title');

        const $stats = $el.find('div.site-info > div.site-stats > a');
        user.username = $stats.attr('href').replace('/site/', '');

        if (users_map.has(user.username)) {
            console.log("repeat found: " + user.username);
        }

        // the actual text isn't held in an element in the div, just a text node, so
        // .contents() is needed rather than .children()
        // remove commas from the visitor count, so, say, "12,345,678" becomes "12345678"
        user.visitors = Number($stats.contents().filter((i, node) => node.type === 'text').text().replaceAll(',', ''));

        $el.find('div.site-info > div.site-tags').children('a').each(function(i, el) {
            user.tags.push($(el).text());
        })

        // check if there's a heart icon; if there is (ie, the number of child elements that match 'i.fa-heart' is greater than zero), then this user is a supporter
        if ($el.find('div.site-info > div.username > a > i').has('i.fa-heart').length > 0) {
            user.is_supporter = true;
        }

        users_map.set(user.username, user);
    });
}


// crawls the given site looking for any other neocities sites this might link to
function crawl(baseURL) {

}

// populate the passed-in map with every user found by scanning all pages in the
// "newest" category on neocities. also will pick up information like whether the
// user is a supporter, how many visitors they have, and what tags they have, since
// this information is displayed on te "newest" page as well.
// note: this will take a while (5930 pages ~= 3 hrs)
async function getAllSites(users_map) {
    let promises = [];
    const baseURL = `https://neocities.org/browse?sort_by=newest&page=`
    for (let i = 1; i <= 5930; i++) {
        try {
            promises.push(getLinksOnBrowsePage(users_map, baseURL + i));
            await new Promise(r => setTimeout(r, 2000));
        } catch (err) {
            console.error(`failed on page ${i}: ${err}`);
        }
    }
    return Promise.all(promises);
}

async function visitAllProfiles(users_map) {

}

// "main"
(async () => {

    const complaint = `Pass one of the following arguments when you run this thingy.
    scrape    to regenerate list of users by scraping neocities
    update    to update list of users based on
    usernames to generate a newline-separated list of all usernames
So for example:
    npm start update
    `

    if (process.argv.length != 3) {
        console.log(complaint);
        return;
    }

    let users;
    // load the data, either by pulling from the website or loading the json
    const mode = process.argv[2];
    if (mode === "scrape") {
        // part 1: get all users by using the "newest" search category
        console.log('getting info from neocities...');
        users = new Map(); // (username, {user object})
        await getAllSites(users);

        fs.writeFileSync("users.json", JSON.stringify(Object.fromEntries(users)));
    } else if (mode === "update") {
        // TODO: this.
        // i was originally thinking "ok, i'll just scan through, newest to oldest, until i hit
        // a user i've seen before; that must be where the cutoff ended for the last scrape"
        // but for whatever reason the order of sites when sorting by "newest" doesn't seem
        // to stay constant, there's some weird few-webpage fluctuation. i thought this might
        // be due to "newest" actually meaning "newest updated", but that isn't the case either.
        //
        // so i think i'll instead check go until a page which has no unseen users is reached.
    } else if (mode === "usernames") {
        console.log('reading from users.json...');
        if (!fs.existsSync("users.json")) {
            console.error('users.json does not exist. do you need to unzip users.json.gz?');
            return;
        }
        users = new Map(Object.entries(JSON.parse(fs.readFileSync("users.json"))));

        console.log('generating usernames.txt...');
        let bigString = "";
        users.forEach((user) => {
            bigString = bigString + user.username + "\n";
        });
        fs.writeFileSync("usernames.txt", bigString);
        console.log('usernames.txt written.');
    } else {
        console.log(complaint);
    }

})();
