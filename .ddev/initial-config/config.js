const fs = require('fs');

exports.piwikUrl = "https://matomo.ddev.site/";
exports.phpServer = {
    HTTP_HOST: 'matomo.ddev.site',
    REQUEST_URI: '/',
    REMOTE_ADDR: '127.0.0.1'
};

const browserConfig = {
  args: ['--no-sandbox', '--ignore-certificate-errors']
};

// Puppeteer 24 downloads an arch-appropriate Chrome during `npm install` and can run on both amd64
// and arm64, but we prefer the Chromium the ddev web image installs: it's always present, avoids a
// per-arch branch, and keeps the local browser consistent across machines. Local screenshots may
// still differ slightly from the CI-generated expected screenshots.
if (fs.existsSync('/usr/bin/chromium')) {
  browserConfig.executablePath = '/usr/bin/chromium';
}

exports.browserConfig = browserConfig;
