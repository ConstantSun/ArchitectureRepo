# ArchitectureRepo

Note: 
You may encounter err related to puppeteer when running it :

Fix it by writing :

        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser'
          });

or:

        const browser = await puppeteer.launch();
