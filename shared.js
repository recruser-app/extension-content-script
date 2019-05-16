async function getOrCreateFromCacheAsync(key, callback, minutes) {
    let storageObj = JSON.parse(localStorage.getItem(key));
    if (storageObj && Date.now() - storageObj.timestampInMs > minutes * 1000) {
        storageObj = null;
    }

    if (storageObj) {
        return Promise.resolve(storageObj.data);
    }

    data = await callback();
    localStorage.setItem(key, JSON.stringify({
        data: data,
        timestampInMs: Date.now()
    }));
    return data;
}

async function getFromLocalStorage(key) {
    if (isTestingEnvironment()) {
        return await Promise.resolve(JSON.parse(localStorage.getItem(key)));
    } else {
        return await new Promise(resolve => chrome.storage.local.get(key, resolve));
    }
}
async function setToLocalStorage(key, data) {
    if (isTestingEnvironment()) {
        Promise.resolve(localStorage.setItem(key, JSON.stringify(data)));
    } else {
        return new Promise(resolve => {
            chrome.storage.local.set(data, resolve);
        });
    }
}

function isTestingEnvironment() {
    return location.href.startsWith('file:///') || location.href.startsWith('https://extension-components');
}