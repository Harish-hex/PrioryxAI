const cheerio = require('cheerio');
fetch('https://internshala.com/internships/software-development-internships/')
  .then(res => res.text())
  .then(html => {
    const $ = cheerio.load(html);
    const jobs = [];
    $('.internship_meta').each((i, el) => {
      const title = $(el).find('.job-title-href').text().trim();
      const company = $(el).find('.company-name').text().trim();
      const location = $(el).find('.locations').text().trim();
      const salary = $(el).find('.stipend').text().trim() || 'Not disclosed';
      const url = 'https://internshala.com' + $(el).find('.job-title-href').attr('href');
      if (title) jobs.push({ title, company, location, salary, url });
    });
    console.log(JSON.stringify(jobs.slice(0, 5), null, 2));
  }).catch(e => console.error(e));
