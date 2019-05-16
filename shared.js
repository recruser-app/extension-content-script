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

function getFromLocalStorage(key) {
    return JSON.parse(localStorage.getItem(key));
}
function setToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function isTestingEnvironment() {
    return location.href.startsWith('file:///') || location.href.startsWith('https://extension-components');
}