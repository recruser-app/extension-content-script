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
let recruserSelectStepCommentInput = document.getElementById('recruser-step-comment');
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
        recruserSaveBtn.onclick = async (e) => {
            e.preventDefault();
            setStep(window.RecruserSelectVacancyStep);
            await parseCvAndSetCvId();
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

    // window.recruserLastVacancy = await getLastSelectedVacancy();
    // if (window.recruserLastVacancy) {
    //     recruserSelectVacancyAutocomplete.value = window.recruserLastVacancy.title;
    // }

    //https://leaverou.github.io/awesomplete/#advanced-examples
    let maxItems = 5
    let autocomplete = new Awesomplete(recruserSelectVacancyAutocomplete, { minChars: 0, maxItems: maxItems, sort: false });
    window.recruserFilteredVacancies = await fetchVacancies(null, maxItems);
    autocomplete.list = window.recruserFilteredVacancies.map(v => getFormattedVacancyName(v));
    autocomplete.evaluate();

    recruserSelectVacancyAutocomplete.oninput = async () => {
        selectVacancyValidationEl.style.display = 'none';

        let input = recruserSelectVacancyAutocomplete.value;
        window.recruserFilteredVacancies = await fetchVacancies(input, maxItems);
        autocomplete.list = window.recruserFilteredVacancies.map(v => getFormattedVacancyName(v));
    };
    recruserSelectVacancyNextStep.onclick = async (e) => {
        e.preventDefault();
        await trySelectVacancy();
    };
    recruserSelectVacancyAutocomplete.addEventListener("keyup", async (e) => {
        if (e.keyCode === 13) { //"Enter"
            e.preventDefault();
            await trySelectVacancy();
        }
    });
}
async function trySelectVacancy() {
    let input = recruserSelectVacancyAutocomplete.value;
    if (!input.length) { // skip vacancy select
        window.recruserCandidateId = await saveCandidate(window.recruserCvId, null);
        setStep(window.RecruserDoneStep);
        return;
    }
    let matchedVacancy = findMatchedVacancyFromLastFiltered(input);
    if (matchedVacancy) {
        if (await doesCvAlreadyAttachedToVacancy(window.recruserCvId, matchedVacancy.id)) {
            selectVacancyValidationEl.style.display = 'block';
            selectVacancyValidationEl.innerText = 'CV already there';
        } else {
            window.recruserLastVacancy = matchedVacancy;
            setStep(window.RecruserSelectStepStep);
            setLastSelectedVacancy(matchedVacancy.id);
            window.recruserCandidateId = await saveCandidate(window.recruserCvId, window.recruserLastVacancy.id);
        }
    }
    else {
        selectVacancyValidationEl.style.display = 'block';
        selectVacancyValidationEl.innerText = 'No such vacancy';
    }
}
function findMatchedVacancyFromLastFiltered(input) {
    for (let i = 0; i < window.recruserFilteredVacancies.length; i++) {
        let vac = window.recruserFilteredVacancies[i];
        let title = getFormattedVacancyName(vac);
        if (input.toLowerCase() == title.toLowerCase()) {
            return vac;
        }
    }
    return null;
}
function getFormattedVacancyName(vac) {
    return `${vac.title} (${vac.companyName})`;
}

async function setupSelectStepStep() {
    if (!window.recruserLastVacancy.stepSystemId) {
        setStep(window.RecruserDoneStep);
    }

    recruserSelectVacancyBlock.style.display = 'none';
    recruserSelectStepBlock.style.display = 'block';

    window.recruserStepSystem = await fetchSteps(window.recruserLastVacancy.stepSystemId, window.recruserLastVacancy.recruiterRelation);
    let stepTitles = window.recruserStepSystem.steps
        .filter(s => s.canUse == true)
        .sort((a, b) => a.order > b.order)
        .map(s => s.title);

    let autocomplete = new Awesomplete(recruserSelectStepAutocomplete, { minChars: 0, maxItems: stepTitles.length, sort: false });
    autocomplete.list = stepTitles;
    autocomplete.evaluate();

    recruserSelectStepAutocomplete.oninput = () => {
        selectStepValidationEl.style.display = 'none';
    };
    recruserSelectStepAutocomplete.addEventListener("keyup", async (e) => {
        if (e.keyCode === 13) { //"Enter"
            e.preventDefault();
            await trySelectStep();
        }
    });
    recruserSelectStepCommentInput.addEventListener("keyup", async (e) => {
        if (e.keyCode === 13) { //"Enter"
            e.preventDefault();
            await trySelectStep();
        }
    });
    recruserSelectStepNextStep.onclick = async (e) => {
        e.preventDefault();
        await trySelectStep();
    };
}
async function trySelectStep() {
    let input = recruserSelectStepAutocomplete.value;
    if (!input.length) { // skip step 
        setStep(window.RecruserDoneStep);
        //TODO: save to google sheet if spreadSheetUrl present
        return;
    }

    let possibleSteps = window.recruserStepSystem.steps.filter(s => s.title.toLowerCase() == input.toLowerCase());
    if (possibleSteps.length == 1) {
        window.recruserSelectedStepId = possibleSteps[0].id;

        setStep(window.RecruserDoneStep);
        let comment = recruserSelectStepCommentInput.value;
        await saveCandidateStep(window.recruserCandidateId, window.recruserSelectedStepId, comment)
        //TODO: save to google sheet if spreadSheetUrl present
    }
    else {
        selectStepValidationEl.style.display = 'block';
        selectStepValidationEl.innerHTML = 'No such step';
    }
}

function setupDoneStep() {
    recruserSelectVacancyBlock.style.display = 'none';
    recruserSelectStepBlock.style.display = 'none';
    recruserDoneBlock.style.display = 'block';
}
