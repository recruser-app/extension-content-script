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
    let dataStr = localStorage.getItem(key);
    if (dataStr == 'null' || dataStr == 'undefined' || !dataStr)
        return null;
    console.log(key, dataStr);
    return JSON.parse(dataStr);
}
function setToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}