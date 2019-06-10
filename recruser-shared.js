
function getHeaders() {
    return new Headers({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getUserToken()}`
    });
}
function getUserToken() {
    let data = getFromLocalStorage('recruserUser');
    if (!data) return '';
    return data.token;
}

function getApiHost() {
    return 'http://localhost:57492';
}

function isTestingEnvironment() {
    return location.href.startsWith('file:///') || location.href.startsWith('https://extension-components');
}

function getFromLocalStorage(key) {
    let dataStr = localStorage.getItem(key);
    if (dataStr == 'null' || dataStr == 'undefined' || !dataStr)
        return null;
    return JSON.parse(dataStr);
}
function setToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}