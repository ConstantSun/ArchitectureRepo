import puppeteer  from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({
	executablePath: '/usr/bin/chromium-browser'
});
    const page = await browser.newPage();
    const url1 = 'https://aws.amazon.com/blogs/big-data/automate-building-data-lakes-using-aws-service-catalog/';
    // const url2 = 'https://aws.amazon.com/blogs/big-data/how-william-hill-migrated-nosql-workloads-at-scale-to-amazon-keyspaces/';
    await page.goto(url1);


    // const issueSrcs = await page.evaluate(() => {
    //   const srcs = Array
    //   .from(
    //     document.querySelectorAll('img[alt*="Architecture"]')
    //   )
    //   .map((image) => image.getAttribute("src"));
    //   return srcs;
    // });

  

    const images = await page.evaluate(() => Array.from(document.images, e => e.src));
    console.log("Page has been evaluated!");
    console.log("images: ")
    console.log(images);
    var filter_imgs = images.filter(img => img.includes("d2908q01vomqb2.cloudfront"))
    console.log("filtering")
    console.log(filter_imgs)



    // Persist data into data.json file
    // fs.writeFileSync("./data2.json", JSON.stringify(issueSrcs));
    // fs.writeFileSync("./data1.json", JSON.stringify(images));

    console.log("File is created!");

    await browser.close();
})();
