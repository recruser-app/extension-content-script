
async function getSimilarCvsInRecruiterDb() {
    return await fetch(`${getApiHost()}/cvs/similar`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            url: location.href,
            html: document.body.innerHTML
        })
    }).then(resp => resp.json());
}
async function getSimilarCvsInVacancy(vacancyId) {
    return await fetch(`${getApiHost()}/cvs/similar?vacancyId=${vacancyId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            url: location.href,
            html: document.body.innerHTML
        })
    }).then(resp => resp.json());
}

async function parseAndSaveCv() {
    return await fetch(`${getApiHost()}/cvs`, {
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

async function fetchVacancies(text, count) {
    let url = `${getApiHost()}/vacancies?`;
    url = `${url}count=${count}`;
    if (text) url = `${url}&vacancyTitle=${encodeURIComponent(text)}`;
    return fetch(url, {
        method: 'GET',
        headers: getHeaders()
    }).then(resp => resp.json());
}
async function fetchVacancyById(vacancyId) {
    return fetch(`${getApiHost()}/vacancies/${vacancyId}`, {
        method: 'GET',
        headers: getHeaders()
    }).then(resp => resp.json());
}

async function fetchVacancySteps(vacancyId) {
    return fetch(`${getApiHost()}/vacancies/${vacancyId}/steps`, {
        method: 'GET',
        headers: getHeaders()
    }).then(resp => resp.json());
}

async function getLastSelectedVacancy() {
    return await fetch(`${getApiHost()}/settings/recruiter/last-selected-vacancy`, {
        method: 'GET',
        headers: getHeaders()
    }).then(resp => resp.status == 200 ? resp.json() : null);
}
async function setLastSelectedVacancy(vacancyId) {
    fetch(`${getApiHost()}/settings/recruiter/last-selected-vacancy/${vacancyId}`, {
        method: 'PUT',
        headers: getHeaders()
    });
}

async function getBlockVacancyInfo() {
    return await fetch(`${getApiHost()}/settings/recruiter/block-vacancy`, {
        method: 'GET',
        headers: getHeaders()
    }).then(resp => resp.status == 200 ? resp.json() : null);
}
async function setBlockVacancy(vacancyId) {
    return await fetch(`${getApiHost()}/settings/recruiter/block-vacancy/${vacancyId}`, {
        method: 'PUT',
        headers: getHeaders()
    });
}

async function getBlockVacancyVisibility() {
    return await fetch(`${getApiHost()}/settings/recruiter/block-vacancy-visibility`, {
        method: 'GET',
        headers: getHeaders()
    }).then(resp => resp.json());
}
async function setBlockVacancyVisibility(isVisible) {
    return await fetch(`${getApiHost()}/settings/recruiter/block-vacancy-visibility/${isVisible}`, {
        method: 'PUT',
        headers: getHeaders()
    });
}

async function setBlockVacancyHeight(height) {
    if (height) {
        return await fetch(`${getApiHost()}/settings/recruiter/block-vacancy-height/${height}`, {
            method: 'PUT',
            headers: getHeaders()
        });
    }
}