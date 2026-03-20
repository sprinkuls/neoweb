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

        let username = $el.find('div.site-info > div.username > a').attr('href').replace('/site/', '');

        let site = {
            url: link,
            title: title,
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

    for (const opt of browseOptions) {
        let sites = new Map();
        await getLinksOnBrowse(opt, 1, sites);

        console.log(opt + " TOP PAGES:")
        sites.forEach((v, k) => {
            process.stdout.write(v.url + ", ");
        });
    }

})();
