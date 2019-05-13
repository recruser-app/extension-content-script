function makeAsyncXhrRequest(method, url, options) {
    return new Promise((resolve, reject) => {

        if (options === undefined) options = {}
        if (options.body === undefined) options.body = '';
        if (options.headers === undefined) options.headers = [];
        if (options.token === undefined) options.token = '';

        let xhr = new XMLHttpRequest()
        xhr.open(method, url, true);

        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', `Bearer ${options.token}`);
        for (var i = 0; i < options.headers.length; i++) {
            xhr.setRequestHeader(options.headers[i].key, options.headers[i].value);
        }
        xhr.onload = function () {
            if (xhr.status < 401) {
                return resolve({ status: xhr.status, body: xhr.response });
            } else if (xhr.status == 401) {
                return reject({ status: 401, body: 'Unauthorized' });
            } else if (xhr.status == 403) {
                return reject({ status: 403, body: 'Access forbidden' });
            } else if (xhr.status == 404) {
                return reject({ status: 404, body: 'Not found' });
            } else if (xhr.status == 500) {
                return reject({ status: 500, body: 'Internal server error occured' });
            } else {
                return reject({ status: xhr.status, body: xhr.responseText });
            }
        }
        //don't fire for ordinary responses (400, 401, 403, 404, 500 , ...)
        xhr.onerror = function () {
            return reject({ status: xhr.status, body: xhr.response });
        }
        xhr.send(JSON.stringify(options.body));
    });
}