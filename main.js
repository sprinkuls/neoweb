const fs = require("fs");
const cheerio = require('cheerio');

// helper for other functions.
// gets the sites on a given "browse" page (tags, sort by, followers/following)
// returns a map of (username, <obj>) pairs,
// where the object has the URL for the site, number of visitors, and site title
async function getLinksOnBrowsePage(url) {
    // if (!browseOption || !pageNr) {
    //     throw new Error("pass in arguments!!!");
    // }
    //
    // const url = `https://neocities.org/browse?sort_by=${browseOption}&page=${pageNr}`;
    console.log("INFO: searching for links on: " + url);

    // TODO: proper error handling
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }

    const map = new Map();
    const $ = cheerio.load(await response.text());


    // operate on each site listed on this browse page
    $('div.browse-page > ul').children().each(function(i, el) {
        const $el = $(el);

        // "link that is a direct child of $el"
        let $a = $el.find('> a');
        let link = $a.attr('href');
        let title = $a.attr('title');

        // the actual text isn't held in an element in the div, just a raw text node, so
        // .contents() is needed rather than .children()
        let $stats = $el.find('div.site-info > div.site-stats > a');
        let visitors = Number($stats.contents().filter((i, node) => node.type === 'text').text().replaceAll(/(\s|,)/g, ''));

        let username = $stats.attr('href').replace('/site/', '');

        let site = {
            url: link,
            title: title,
            visitors: visitors,
        };

        map.set(username, site);
    });

    return map;
}

async function getFollowersAndFollows(username) {
    const url = `https://neocities.org/site/${username}/`
    const all_sites = new Map();


    // followers
    let this_pages_sites;
    let pageNr = 1;
    let nrFollowers = 0;
    do {
        this_pages_sites = await getLinksOnBrowsePage(`${url}followers?page=${pageNr}`);
        this_pages_sites.forEach((v, k) => all_sites.set(k, v));
        pageNr++;
        nrFollowers += this_pages_sites.size;
    } while (this_pages_sites.size > 0);
    console.log(`found ${pageNr - 1} pages and ${nrFollowers} followers`);

    // follows
    pageNr = 1;
    let nrFollows = 0;
    do {
        this_pages_sites = await getLinksOnBrowsePage(`${url}follows?page=${pageNr}`);
        this_pages_sites.forEach((v, k) => all_sites.set(k, v));
        pageNr++;
        nrFollows += this_pages_sites.size;
    } while (this_pages_sites.size > 0);
    console.log(`found ${pageNr - 1} pages and ${nrFollows} following`);

    return all_sites;
}

// "main"
(async () => {
    const browseOptions = [
        "special_sauce",
        "random",
        "most_followed",
        "last_updated",
        "views",
        "tipping_enabled",
        "newest",
        "oldest"
    ]

    /*
    if (process.argv.includes('rerun') || !fs.existsSync("sites.json")) {
        console.log('regenerating data!');
        const sites = new Map();
        // for (const opt of browseOptions) {
        //     await getLinksOnBrowse(opt, 1, sites);
        // }
        await getLinksOnBrowsePage("special_sauce", 1, sites);

        fs.writeFileSync("sites.json", JSON.stringify(Object.fromEntries(sites)));
    } else {
        console.log('reading from sites.json...');
        const sites = new Map(Object.entries(JSON.parse(fs.readFileSync("sites.json"))));
        sites.forEach((v, k) => {
            process.stdout.write(`(${k}, ${v.url}) and `);
        })
    }
    */

    /*
    const sites = new Map();
    // const url = `https://neocities.org/browse?sort_by=special_sauce&page=57`;
    await getLinksOnBrowsePage("https://neocities.org/site/dreamy/followers", sites);
    // await getLinksOnBrowse(url, sites);
    console.log('nr sites found: ' + sites.size);
    sites.forEach((v, k) => {
        process.stdout.write(`(${k}, ${v.url}) and \n`);
    })
    */
    const sites = new Map();
    (await getFollowersAndFollows("dreamy")).forEach((v, k) => {
        sites.set(k, v);
    });

    sites.forEach((v, k) => {
        console.log(`(${k}\t=>\t${v.url})`);
    })
    fs.writeFileSync("dreamyfollows.json", JSON.stringify(Object.fromEntries(sites)));


})();
