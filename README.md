# ArchitectureRepo

Note: 
You may encounter this err when running puppeteer:

UnhandledPromiseRejectionWarning: Error: Failed to launch the browser process!
/home/ubuntu/capstone/ArchitectureRepo/node_modules/puppeteer/.local-chromium/linux-1011831/chrome-linux/chrome: error while loading shared libraries: libgbm.so.1: cannot open shared object file: No such file or directory

Fix it by writing :

        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser'
          });
