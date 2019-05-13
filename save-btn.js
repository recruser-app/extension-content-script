
document.getElementById('recruser-save-btn').onclick = () => {
    let token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJMT0NBTCBBVVRIT1JJVFkiOiJBdXRoU2VydmVyIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvbmFtZSI6InJlYzFAZ21haWwuY29tIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiUmVjcnVpdGVyIiwibmJmIjoxNTU3NzQwMzE3LCJleHAiOjE1NTgzNDUxMTcsImlzcyI6IkF1dGhTZXJ2ZXIiLCJhdWQiOiJBYXJzZXJBcGkifQ.tJZp4GFKJpTu_gnTVcWz1z2BFsgZB1ZbDWD0kRmKV4s";
    makeAsyncXhrRequest('GET', `http://localhost:57492/step-systems`, {
        token: token
    }).then(res => {
        document.getElementById('recruser-steps').textContent = res.body;
        console.log(JSON.parse(res.body));
    });
}

