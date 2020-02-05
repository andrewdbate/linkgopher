'use strict';
document.getElementById('extract-this-tab').addEventListener('click', event => {
  handler(false, false).then(() => window.close());
});

document.getElementById('extract-this-tab-filter').addEventListener('click', event => {
  handler(false, true).then(() => window.close());
});

document.getElementById('extract-all-tabs').addEventListener('click', event => {
  handler(true, false).then(() => window.close());
});

document.getElementById('extract-all-tabs-filter').addEventListener('click', event => {
  handler(true, true).then(() => window.close());
});

document.getElementById('about-linkgopher').addEventListener('click', event => {
  const {homepage_url} = chrome.runtime.getManifest();
  openTab(homepage_url).then(() => window.close());
});

// [BEGIN] Localization.
[
  {id: 'extract-this-tab', messageId: 'extractThisTab'},
  {id: 'extract-this-tab-filter', messageId: 'extractThisTabFilter'},
  {id: 'extract-all-tabs', messageId: 'extractAllTabs'},
  {id: 'extract-all-tabs-filter', messageId: 'extractAllTabsFilter'},
  {id: 'about-linkgopher', messageId: 'aboutLinkGopher'}
].forEach(item => {
  const container = document.getElementById(item.id);
  container.innerText = chrome.i18n.getMessage(item.messageId);
})
// [END] Localization.

/**
 * @function handler
 * @param {boolean} allTabs -- obtain all tabs in current window, else current tab only
 * @param {boolean} filtering -- true if filtering is required on the results page
 */
function handler(allTabs, filtering) {
  var firstTabId;
  return getCurrentTab(allTabs)
    .then(items => {
      firstTabId = items[0].id;
      return items.filter(tab => 
        tab.url.startsWith("http")
      ).map(tab =>
        injectScript(tab.id)
      )
    })
    .then(items => {
      let url = `${chrome.extension.getURL('browser/linkgopher.html')}?`;
      if (!allTabs)
        url += `tabId=${firstTabId}&`
      url += `filtering=${filtering}`;
      return openTab(url);
    })
    .catch(error => window.alert(error));
};

/**
 * Get active tab of current window.
 *
 * @function getCurrentTab
 * @param {boolean} allTabs -- obtain all tabs in current window, else current tab only
 */
function getCurrentTab(allTabs) {
  return new Promise((res, rej) => {
    const queryInfo = allTabs ? {
      currentWindow: true
    } : {
      active: true,
      currentWindow: true
    };

    chrome.tabs.query(queryInfo, items => passNext(items, res, rej));
  });
};

/**
 * Create tab with extension's page.
 *
 * @function openTab
 * @param {string} url
 */
function openTab(url) {
  return new Promise((res, rej) => {
    const createProperties = {active: true, url};
    chrome.tabs.create(createProperties, tab => passNext(tab, res, rej));
  });
};

/**
 * Inject script into tab
 *
 * @function injectScript
 * @param {number} tabId -- The ID of tab.
 * @param {string} file -- Pathname of script
 */
function injectScript(tabId, file = '/content-script.js') {
  return new Promise((res, rej) => {
    const details = {
      file,
      runAt: 'document_start'
    };

    chrome.tabs.executeScript(tabId, details, item => passNext(item, res, rej));
  });
};

/**
 * @function passNext
 * @param {*} result
 * @param {function} fulfill
 * @param {function} reject
 */
function passNext(result, fulfill, reject) {
  if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
  return fulfill(result);
};
