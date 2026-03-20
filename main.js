const fs = require("fs");
const cheerio = require('cheerio');

// TODO: this weird map argument thing is kinda messy idk
async function getLinksOnBrowse(browseOption, pageNr, map) {
    if (!browseOption || !pageNr) {
        throw new Error("pass in arguments!!!");
    }

    const url = `https://neocities.org/browse?sort_by=${browseOption}&page=${pageNr}`;
    console.log("INFO: searching for links on: " + url);

    // TODO: proper error handling
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }

    const $ = cheerio.load(await response.text());


    // operate on each site listed on this browse page
    $('div.browse-page > ul').children().each(function(i, el) {
        const $el = $(el);

        // "link that is a direct child of $el"
        let $a = $el.find('> a');
        let link = $a.attr('href');
        let title = $a.attr('title');

        let $stats = $el.find('div.site-info > div.site-stats > a');
        let visitors = Number($stats.contents().filter((i, node) => node.type === 'text').text().replaceAll(/(\s|,)/g, ''));

        let username = $stats.attr('href').replace('/site/', '');

        let site = {
            url: link,
            title: title,
            visitors: visitors,
        };

        map.set(username, site);
    })
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

    if (process.argv.includes('rerun') || !fs.existsSync("sites.json")) {
        console.log('regenerating data!');
        const sites = new Map();
        // for (const opt of browseOptions) {
        //     await getLinksOnBrowse(opt, 1, sites);
        // }
        await getLinksOnBrowse("special_sauce", 1, sites);

        fs.writeFileSync("sites.json", JSON.stringify(Object.fromEntries(sites)));
    } else {
        console.log('reading from sites.json...');
        const sites = new Map(Object.entries(JSON.parse(fs.readFileSync("sites.json"))));
        sites.forEach((v, k) => {
            process.stdout.write(`(${k}, ${v.url}) and `);
        })
    }


})();
