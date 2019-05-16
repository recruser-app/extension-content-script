let recruserSaveBlock = document.getElementById('saveCv-step');
let recruserSaveBtn = document.getElementById('recruser-save-btn');
let recruserMultipleProfilesFoundText = document.getElementById('recruser-multiple-users-in-db');
let recruserFoundUserInDbText = document.getElementById('recruser-user-in-db');
let recruserAddCvToAnotherVacancyBtn = document.getElementById('recruser-select-another-vacancy-btn');

let recruserSelectVacancyBlock = document.getElementById('recruser-selectVacancy-step');
let recruserSelectVacancyAutocomplete = document.getElementById('recruser-selectVacancy-autocomplete');
let recruserSelectVacancyNextStep = document.getElementById('recruser-selectVacancy-next-step');
let selectVacancyValidationEl = document.getElementById('recruser-selectVacancy-validation');

let recruserSelectStepBlock = document.getElementById('recruser-selectStep-step');
let recruserSelectStepAutocomplete = document.getElementById('recruser-selectStep-autocomplete');
let recruserSelectStepNextStep = document.getElementById('recruser-selectStep-next-step');
let selectStepValidationEl = document.getElementById('recruser-selectStep-validation');

let recruserDoneBlock = document.getElementById('recruser-done-step');

let recruserProfileLink = document.getElementById('recruser-profile-link');

(async () => {
    initSteps();
    setUserIfTestingEnvironment();
    await setStep(window.RecruserParseCvIfNotExistInDbStep);
})();

function initSteps() {
    window.RecruserParseCvIfNotExistInDbStep = 'Parse';
    window.RecruserSelectVacancyStep = 'SelectVacancy';
    window.RecruserSelectStepStep = 'SelectStep';
    window.RecruserDoneStep = 'Done';
}

async function setStep(name) {
    window.recruserStep = name;
    await ManageMarkup(window.recruserStep);
}

async function ManageMarkup(step) {
    console.log(step);
    switch (step) {
        case window.RecruserParseCvIfNotExistInDbStep: {
            await setupParseCvStep();
            break;
        }
        case window.RecruserSelectVacancyStep: {
            await SetupSelectVacancyStep();
            break;
        }
        case window.RecruserSelectStepStep: {
            await setupSelectStepStep();
            break;
        }
        case window.RecruserDoneStep: {
            setupDoneStep();
            break;
        }
    }
}

async function setupParseCvStep() {
    let possibleCvIds = await getPossibleCvIdsByFullNameOrSoruceUrlInDb();
    recruserSaveBlock.style.display = 'block';

    if (possibleCvIds.length == 0) {
        recruserSaveBtn.style.display = 'block';
        recruserSaveBtn.onclick = (e) => {
            e.preventDefault();
            parseCvAndSetCvId();
            setStep(window.RecruserSelectVacancyStep);
        };
    } else if (possibleCvIds.length == 1) {
        recruserFoundUserInDbText.style.display = 'block';
        recruserAddCvToAnotherVacancyBtn.onclick = (e) => {
            e.preventDefault();
            window.recruserCvId = possibleCvIds[0];
            setStep(window.RecruserSelectVacancyStep);
        };
        recruserProfileLink.setAttribute('href', `https://account.recruser.com/cv-list/${window.recruserCvId}`);
        recruserProfileLink.setAttribute('target', '_blank');
    } else {
        recruserMultipleProfilesFoundText.style.display = 'block';
        recruserProfileLink.setAttribute('href', `https://account.recruser.com/cv-list?ids=${possibleCvIds}`);
        recruserProfileLink.setAttribute('target', '_blank');
    }
}
async function parseCvAndSetCvId() {
    window.recruserCvIsParsing = true;
    window.recruserCvId = await parseAndSaveCv();
    window.recruserCvIsParsing = false;
}

async function SetupSelectVacancyStep() {
    recruserSaveBlock.style.display = 'none';
    recruserSelectVacancyBlock.style.display = 'block';

    window.recruserLastVacancy = getFromLocalStorage('recruserLastVacancy');
    if (window.recruserLastVacancy) {
        recruserSelectVacancyAutocomplete.value = window.recruserLastVacancy.title;
    }

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
        selectVacancyValidationEl.style.display = 'none';
    };
    recruserSelectVacancyNextStep.onclick = async (e) => {
        e.preventDefault();
        let input = recruserSelectVacancyAutocomplete.value;
        if (!input.length) { // skip vacancy select
            window.recruserCandidateId = await saveCandidate(window.recruserCvId, null);
            setStep(window.RecruserDoneStep);
            return;
        }

        let vacancies = await fetchVacancies(input);
        if (vacancies.length == 1 && vacancies[0].title == input && vacancies[0].stepSystemId) {
            let targetVacancy = await fetchVacancyById(vacancies[0].id);

            if (await doesCvAlreadyAttachedToVacancy(window.recruserCvId, targetVacancy.id)) {
                selectVacancyValidationEl.style.display = 'block';
                selectVacancyValidationEl.innerText = 'CV already there';
            } else {
                setStep(window.RecruserSelectStepStep);
                setToLocalStorage('recruserLastVacancy', targetVacancy);
                window.recruserLastVacancy = targetVacancy;
                window.recruserCandidateId = await saveCandidate(window.recruserCvId, window.recruserLastVacancy.id);
            }
        }
        else {
            selectVacancyValidationEl.style.display = 'block';
            selectVacancyValidationEl.innerText = 'No such vacancy';
        }
    };
}

async function setupSelectStepStep() {
    if (!window.recruserLastVacancy.stepSystemId) {
        setStep(window.RecruserSelectStepStep);
    }

    recruserSelectVacancyBlock.style.display = 'none';
    recruserSelectStepBlock.style.display = 'block';

    let autocomplete = new Awesomplete(recruserSelectStepAutocomplete, {
        minChars: 0,
        maxItems: 15,
        sort: (a, b) => a.order > b.order
    });
    fetchSteps(window.recruserLastVacancy.stepSystemId, window.recruserLastVacancy.recruiterRelation).then(stepsystem => {
        window.recruserStepSystem = stepsystem;
        autocomplete.list = stepsystem.steps.filter(s => s.canUse == true).map(s => s.title);
    });

    recruserSelectStepNextStep.oninput = () => {
        selectStepValidationEl.style.display = 'none';
    };
    recruserSelectStepNextStep.onclick = async (e) => {
        e.preventDefault();
        let input = recruserSelectStepAutocomplete.value;
        if (!input.length) { // skip step select
            setStep(window.RecruserDoneStep);
            //TODO: save to google sheet if spreadSheetUrl present
            return;
        }

        let possibleSteps = window.recruserStepSystem.steps.filter(s => s.title == input);
        if (possibleSteps.length == 1) {
            let targetStep = possibleSteps[0];
            window.recruserSelectedStepId = targetStep.id;

            setStep(window.RecruserDoneStep);
            let comment = document.getElementById('recruser-step-comment').value;
            await saveCandidateStep(window.recruserCandidateId, window.recruserSelectedStepId, comment)
            //TODO: save to google sheet if spreadSheetUrl present
        }
        else {
            selectStepValidationEl.style.display = 'block';
            selectStepValidationEl.innerHTML = 'No such step';
        }
    };
}

function setupDoneStep() {
    recruserSelectVacancyBlock.style.display = 'none';
    recruserSelectStepBlock.style.display = 'none';
    recruserDoneBlock.style.display = 'block';
}

/// HTTP CALLS

async function getPossibleCvIdsByFullNameOrSoruceUrlInDb() {
    return await fetch(`${getApiHost()}/parser/cv/existence-check`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            url: location.href,
            html: document.body.innerHTML
        })
    }).then(resp => resp.json());
}

async function parseAndSaveCv() {
    return await fetch(`${getApiHost()}/cv/from-page`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            url: location.href,
            html: document.body.innerHTML
        })
    }).then(resp => resp.json());
}

async function saveCandidate(cvId, vacancyId) {
    return await fetch(`${getApiHost()}/candidates`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            cvId: cvId,
            vacancyId: vacancyId
        })
    }).then(resp => resp.json());
}

async function saveCandidateStep(candidateId, stepId, comment) {
    return await fetch(`${getApiHost()}/candidates/${candidateId}/step-transactions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            newStepId: stepId,
            comment: comment
        })
    }).then(resp => resp.json());
}

async function fetchVacancies(text) {
    return fetch(`${getApiHost()}/vacancies?count=5&vacancyTitle=${text}`, {
        method: 'GET',
        headers: getHeaders()
    }).then(resp => resp.json());
}

async function fetchSteps(stepSystemId, relation) {
    return fetch(`${getApiHost()}/step-systems/${stepSystemId}?relation=${relation}`, {
        method: 'GET',
        headers: getHeaders()
    }).then(resp => resp.json());
}

async function fetchVacancyById(id) {
    return fetch(`${getApiHost()}/vacancies/${id}`, {
        method: 'GET',
        headers: getHeaders()
    }).then(resp => resp.json());
}

async function doesCvAlreadyAttachedToVacancy(cvId, vacancyId) {
    return fetch(`${getApiHost()}/cvs/${cvId}/vacancy/${vacancyId}`, {
        method: 'GET',
        headers: getHeaders()
    }).then(resp => resp.json());
}

//// SHARED

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