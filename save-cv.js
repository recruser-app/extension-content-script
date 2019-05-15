let recruserSaveBlock = document.getElementById('saveCv-step');
let recruserSaveBtn = document.getElementById('recruser-save-btn');
let recruserUserInDbText = document.getElementById('recruser-user-in-db');

let recruserSelectVacancyBlock = document.getElementById('recruser-selectVacancy-step');
let recruserSelectVacancyAutocomplete = document.getElementById('recruser-selectVacancy-autocomplete');
let recruserSelectVacancyNextStep = document.getElementById('recruser-selectVacancy-next-step');

let recruserSelectStepBlock = document.getElementById('recruser-selectStep-step');
let recruserSelectStepAutocomplete = document.getElementById('recruser-selectStep-autocomplete');
let recruserSelectStepNextStep = document.getElementById('recruser-selectStep-next-step');

let recruserDoneBlock = document.getElementById('recruser-done-step');

initSteps();

(async () => {
    await setStep(window.RecruserNoneStep);
})();

function initSteps() {
    window.RecruserNoneStep = 'None';
    window.RecruserParseCvStep = 'Parse';
    window.RecruserSelectVacancyStep = 'SelectVacancy';
    window.RecruserSelectStepStep = 'SelectStep';
    window.RecruserDoneStep = 'Done';
}

async function setStep(name) {
    window.recruserStep = name;
    await ManageMarkup(window.recruserStep);
}
function getStep() {
    return window.recruserStep;
}
async function ManageMarkup(step) {
    console.log(step);
    switch (step) {
        case window.RecruserNoneStep: {
            if (await isUrlSupported(location.href)) {
                setStep(window.RecruserParseCvStep);
            }
            break;
        }
        case window.RecruserParseCvStep: {
            var doesUserExistInDb = false;//TODO check in DB using API
            if (doesUserExistInDb) {
                recruserUserInDbText.style.display = 'block';
            } else {
                recruserSaveBtn.style.display = 'block';
                setupParseCvStep();
            }
            break;
        }
        case window.RecruserSelectVacancyStep: {
            SetupSelectVacancyStep();
            break;
        }
        case window.RecruserSelectStepStep: {
            setupSelectStepStep();
            break;
        }
        case window.RecruserDoneStep: {
            setupDoneStep();
            break;
        }
    }
}

function setupParseCvStep() {
    recruserSaveBtn.onclick = (e) => {
        e.preventDefault();
        window.cv = {};
        // parseCv().then(cv => {
        //     window.cv = cv;
        // });
        setStep(window.RecruserParseCvStep);
    };
}

function SetupSelectVacancyStep() {
    recruserSaveBlock.style.display = 'none';
    recruserSelectVacancyBlock.style.display = 'block';

    //https://leaverou.github.io/awesomplete/#advanced-examples
    let autocomplete = new Awesomplete(recruserSelectVacancyAutocomplete, {
        minChars: 1,
        maxItems: 5
    });
    recruserSelectVacancyAutocomplete.oninput = () => {
        let input = recruserSelectVacancyAutocomplete.value;
        fetchVacancies(input).then(vacancies => {
            autocomplete.list = vacancies.map(v => v.title);
        });
    };
    recruserSelectVacancyNextStep.onclick = (e) => {
        e.preventDefault();
        let input = recruserSelectVacancyAutocomplete.value;
        fetchVacancies(input).then(vacancies => {
            if (vacancies.length == 1 && vacancies[0].title == input && vacancies[0].stepSystemId) {
                window.recruserVacancy = {
                    id: vacancies[0].id,
                    title: vacancies[0].title,
                    stepSystemId: vacancies[0].stepSystemId,
                    relation: vacancies[0].recruiterRelation
                };
                setStep(window.RecruserSelectVacancyStep);
            }
            else {
                //show validation message that there are no such vacancy
            }
        });
    };
}

function setupSelectStepStep() {
    console.log(window.recruserVacancy);
    if (!window.recruserVacancy.stepSystemId) {
        setStep(window.RecruserSelectStepStep);
    }

    recruserSelectVacancyBlock.style.display = 'none';
    recruserSelectStepBlock.style.display = 'block';

    let autocomplete = new Awesomplete(recruserSelectStepAutocomplete, {
        minChars: 0,
        maxItems: 15,
        sort: (a, b) => a.order > b.order
    });
    fetchSteps(window.recruserVacancy.stepSystemId, window.recruserVacancy.relation).then(stepsystem => {
        window.recruserStepSystem = stepsystem;
        console.log('step-system', window.recruserStepSystem);

        autocomplete.list = stepsystem.steps.filter(s => s.canUse == true).map(s => s.title);
    });
    recruserSelectStepNextStep.onclick = (e) => {
        e.preventDefault();
        let input = recruserSelectStepAutocomplete.value;
        let possibleSteps = window.recruserStepSystem.steps.filter(s => s.title == input);
        if (possibleSteps.length == 1) {
            let targetStep = possibleSteps[0];
            window.recruserSelectedStepId = targetStep.id;
            console.log(targetStep);
            setStep(window.RecruserSelectStepStep);
        }
        else {
            //show validation message that there are no such vacancy
        }
    };
}

function setupDoneStep() {
    recruserSelectStepBlock.style.display = 'none';
    recruserDoneBlock.style.display = 'block';

    //TODO
    //1. create endpoint that takes all info: CV, vacancyID, stepID
    //or saveCV -> return ID - form and show Link
    //meanwhile save candiate and add him to google sheet
    //2. call asynchronously, don't waiting result
}

function parseCv() {
    // return fetch(`${getApiHost()}/parser/cv`, {
    //     method: 'POST',
    //     headers: getHeaders(),
    //     body: {
    //         url: '',//TODO: get current url
    //         html: document.body
    //     }
    // }).then(resp => {
    //     let cv = resp.json();
    //     //save CV and return cvID to window variable
    // });
}

function fetchVacancies(text) {
    return fetch(`${getApiHost()}/vacancies?count=5&vacancyTitle=${text}`, {
        method: 'GET',
        headers: getHeaders()
    }).then(resp => resp.json());
}

function fetchSteps(stepSystemId, relation) {
    return fetch(`${getApiHost()}/step-systems/${stepSystemId}?relation=${relation}`, {
        method: 'GET',
        headers: getHeaders()
    }).then(resp => resp.json());
}

function getApiHost() {
    return 'http://localhost:57492';
}

function getHeaders() {
    return new Headers({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getUserToken()}`
    });
}
function getUserToken() {
    const dataStr = localStorage.getItem('recruserUser');
    if (!dataStr || dataStr === 'null' || dataStr === 'undefined')
        return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJMT0NBTCBBVVRIT1JJVFkiOiJBdXRoU2VydmVyIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvbmFtZSI6InJlYzFAZ21haWwuY29tIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiUmVjcnVpdGVyIiwibmJmIjoxNTU3NzQwMzE3LCJleHAiOjE1NTgzNDUxMTcsImlzcyI6IkF1dGhTZXJ2ZXIiLCJhdWQiOiJBYXJzZXJBcGkifQ.tJZp4GFKJpTu_gnTVcWz1z2BFsgZB1ZbDWD0kRmKV4s";
    return JSON.parse(dataStr).token;
}

async function isUrlSupported(url) {
    if (url.startsWith('file:///')) return true;

    let urlParts = await getSupportedUrlParts();
    return urlParts.find(part => url.includes(part)) != null
}

async function getSupportedUrlParts() {
    return await getOrCreateFromCacheAsync(
        key = 'recruserSupportedUrlParts',
        callback = async () => await fetch(`${getApiHost()}/parser/supported-urls`)
            .then(resp => resp.json()),
        minutes = 5);
}