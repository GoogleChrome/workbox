describe(`[workbox-precaching] Precache and Update`, function() {
  let webdriver = global.__workbox.webdriver;
  let testServerAddress = global.__workbox.serverAddr;

  it(`should load a page with service worker `, function() {
    return webdriver.get(testServerAddress)
    .then(() => {
      return new Promise((resolve) => {
        setTimeout(resolve, 3 * 1000);
      });
    });
  });
});
