# ArchitectureRepo

Note: 

1. This crawler uses puppeteer (https://www.npmjs.com/package/puppeteer) that controls Chrome or Chromium, therefore your running machine needs to install Chrome/Chromium. If you run in an EC2 ubuntu OS, you can install Chromium by running :
$ sudo apt install -y chromium-browser

2. You maybe encounter err related to puppeteer when running it :

Fix it by writing :

        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser'
          });

or:

        const browser = await puppeteer.launch();
