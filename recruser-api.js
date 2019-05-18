
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

async function getMatchedVacancyFor(text) {
    return await fetch(`${getApiHost()}/vacancies/name/${encodeURIComponent(text)}`, {
        method: 'GET',
        headers: getHeaders()
    }).then(resp => resp.status == 200 ? resp.json() : null);
}
async function fetchVacancies(text, count, includeDescription = false) {
    let url = `${getApiHost()}/vacancies?`;
    url = `${url}count=${count}`;
    url = `${url}&includeDescription=${includeDescription}`;
    if (text) url = `${url}&vacancyTitle=${encodeURIComponent(text)}`;
    return fetch(url, {
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

async function doesCvAlreadyAttachedToVacancy(cvId, vacancyId) {
    return fetch(`${getApiHost()}/cvs/${cvId}/vacancy/${vacancyId}`, {
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

async function getBlockVacancy() {
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