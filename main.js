const cheerio = require('cheerio');

async function getData() {
    const url = "http://localhost:3000/demo";

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const result = await response.text();
        console.log(result);

        const $ = cheerio.load(result);

        // from neocities:
        // "Usernames can only contain letters, numbers, and hyphens, and cannot start or end with a hyphen."

        let links = [];
        $('a').each(function(i, el) {
            links.push($(this).attr('href'));
        });
        links.forEach((link) => console.log(link));


    } catch (error) {
        console.error(error);
        console.error(error.message);
    }
}

getData();
