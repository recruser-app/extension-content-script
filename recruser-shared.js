
function setUserIfTestingEnvironment() {
    if (isTestingEnvironment()) {
        setToLocalStorage('recruserUser', {
            email: "rec1@gmail.com",
            expireInMs: 1558556419249.2485,
            id: "0eb595e6-26e8-4902-bf69-65866478b516",
            name: "rec1@gmail.com",
            role: 0,
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJMT0NBTCBBVVRIT1JJVFkiOiJBdXRoU2VydmVyIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvbmFtZSI6InJlYzFAZ21haWwuY29tIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiUmVjcnVpdGVyIiwibmJmIjoxNTU3OTUxNjE5LCJleHAiOjE1NTg1NTY0MTksImlzcyI6IkF1dGhTZXJ2ZXIiLCJhdWQiOiJBYXJzZXJBcGkifQ.Gy5BWheLHp4F-98NyDN9G4YDADQAT8HzjzR6O62-wpk"
        });
    }
}

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