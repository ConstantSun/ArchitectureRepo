const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');


async function run(){
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://aws.amazon.com/blogs');
    let div_selector= "div.m-card-title"; 

    let list_length    = await page.evaluate((sel) => {
            let elements = Array.from(document.querySelectorAll(sel));
            return elements.length;
    }, div_selector);

    for(let i=0; i< list_length; i++){
        var href = await page.evaluate((l, sel) => {
                    let elements= Array.from(document.querySelectorAll(sel));
                    let anchor  = elements[l].getElementsByTagName('a')[0];
                    if(anchor){
                        return anchor.href;
                    }else{
                        return '';
                    }
                }, i, div_selector);
        console.log('--------> ', href)
    }
    await browser.close();
}
run();