const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://aws.amazon.com/blogs/big-data/how-william-hill-migrated-nosql-workloads-at-scale-to-amazon-keyspaces/');
    await page.screenshot({ path: "example.png" });


    const issueSrcs = await page.evaluate(() => {
        const srcs = Array
        .from(
          document.querySelectorAll('img[alt*="architecture"]')
        )
        .map((image) => image.getAttribute("src"));
        return srcs;
      });
      const images = await page.evaluate(() => Array.from(document.images, e => e.src));

      console.log("Page has been evaluated!");
      console.log("images: ")
      console.log(images);
      filter_imgs = images.filter(img => img.includes("png"))

      console.log("filtering")
      console.log(filter_imgs)
    // Persist data into data.json file
    // fs.writeFileSync("./data.json", JSON.stringify(issueSrcs));
      fs.writeFileSync("./data1.json", JSON.stringify(images));

    console.log("File is created!");


    await browser.close();
})();