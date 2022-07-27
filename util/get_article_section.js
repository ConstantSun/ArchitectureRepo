const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const url1 = 'https://aws.amazon.com/blogs/mt/integrate-administrator-approval-for-ec2-image-builder-amis-using-aws-systems-manager/';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(url1);


    let pTags = await page.$$('span[property="articleSection"]')
    for (let index = 0; index < pTags.length; index++) {
        const element = pTags[index];
        let value = await element.evaluate(el => el.textContent, element)
        console.log("value:");
        console.log(value);
        
    }

    await browser.close();
})();
