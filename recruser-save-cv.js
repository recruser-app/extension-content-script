let recruserSaveBlock = document.getElementById('saveCv-step');

let recruserAddExistingCvToVacancyBtn = document.getElementById('recruser-found-add-candidate-anyway');

let recruserSelectVacancyBlock = document.getElementById('recruser-selectVacancy-step');
let recruserSelectVacancyAutocomplete = document.getElementById('recruser-selectVacancy-autocomplete');
let recruserSelectVacancyNextStep = document.getElementById('recruser-selectVacancy-next-step');
let selectVacancyValidationEl = document.getElementById('recruser-selectVacancy-validation');
let recruserFoundCandidateValidationEl = document.getElementById('recruser-found-candidate');

let recruserSelectStepBlock = document.getElementById('recruser-selectStep-step');
let recruserSelectStepAutocomplete = document.getElementById('recruser-selectStep-autocomplete');
let recruserSelectStepCommentInput = document.getElementById('recruser-step-comment');
let recruserSelectStepNextStep = document.getElementById('recruser-selectStep-next-step');
let selectStepValidationEl = document.getElementById('recruser-selectStep-validation');

let recruserDoneBlock = document.getElementById('recruser-done-step');

(async () => {
    initSteps();
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
    //Если я хочу добавить кандидата на вакансию, но оказывается, что он уже там есть - также помечается как добавленый мною
    let similarCvs = await getSimilarCvsInRecruiterDb();
    recruserSaveBlock.style.display = 'block';

    if (similarCvs.length == 0) {
        let recruserSaveBtn = document.getElementById('recruser-save-btn');
        recruserSaveBtn.style.display = 'block';
        recruserSaveBtn.onclick = async (e) => {
            e.preventDefault();
            setStep(window.RecruserSelectVacancyStep);
            window.recruserCvId = await parseAndSaveCv();
        };
    } else {
        document.getElementById('recruser-similar-block').style.display = 'block';
        document.getElementById('recruser-select-found-cv-btn').onclick = (e) => {
            e.preventDefault();
            toggleCvViewer(isShown = false);
            window.recruserCvId = similarCvs[getCurrentCvIndex()].id;
            setStep(window.RecruserSelectVacancyStep);
        };
        document.getElementById('recruser-use-new-cv-btn').onclick = async () => {
            toggleCvViewer(isShown = false);
            setStep(window.RecruserSelectVacancyStep);
            window.recruserCvId = await parseAndSaveCv();
        };
        setCvViewerToggling();
        setCvViewer(similarCvs);
    }
}

async function SetupSelectVacancyStep() {
    recruserSaveBlock.style.display = 'none';
    recruserSelectVacancyBlock.style.display = 'block';

    let maxItems = 5
    let autocomplete = new Awesomplete(recruserSelectVacancyAutocomplete, { minChars: 0, maxItems: maxItems, sort: false });
    await setAutocompleteVacancyListByInput(autocomplete, null, maxItems);
    autocomplete.evaluate();

    recruserSelectVacancyAutocomplete.oninput = async () => {
        selectVacancyValidationEl.style.display = 'none';
        recruserFoundCandidateValidationEl.style.display = 'none';

        let input = recruserSelectVacancyAutocomplete.value;
        await setAutocompleteVacancyListByInput(autocomplete, input, maxItems);
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
async function setAutocompleteVacancyListByInput(autocomplete, input, maxItems) {
    let foundVacancies = await fetchVacancies(input, maxItems);
    let availableVacancies = foundVacancies.filter(v => isVacancyAvailable(v));
    window.recruserAutocompleteVacancyList = availableVacancies;
    autocomplete.list = (window.recruserAutocompleteVacancyList).map(v => ({
        label: getFormattedVacancyName(v),
        value: v.title
    }));
}
function isVacancyAvailable(vacancy) {
    let isVacancyActive = vacancy.status == 1;
    let isVacancyOnHold = vacancy.status == 2;
    return isVacancyActive || isVacancyOnHold;
}

async function trySelectVacancy() {
    if (!window.recruserCvId) return;

    let input = recruserSelectVacancyAutocomplete.value;
    if (!input.length) {
        // skip vacancy select
        setStep(window.RecruserDoneStep);
        return;
    }
    let matchedVacancy = window.recruserAutocompleteVacancyList.find(v => v.title.toLowerCase() == input.toLowerCase());
    if (matchedVacancy) {
        let similarCvsInVacancy = await getSimilarCvsInVacancy(matchedVacancy.id);
        if (similarCvsInVacancy.length == 0) {
            window.recruserLastVacancy = matchedVacancy;
            setStep(window.RecruserSelectStepStep);
            window.recruserCandidateId = await saveCandidate(window.recruserCvId, matchedVacancy.id);
        } else {
            recruserFoundCandidateValidationEl.style.display = 'block';

            document.getElementById('recruser-similar-block').style.display = 'block';
            setCvViewerToggling();
            setCvViewer(similarCvsInVacancy, showSelectBtn = false);
            toggleCvViewer(isShown = true);

            document.getElementById('recruser-found-add-candidate-anyway').onclick = (e) => {
                e.preventDefault();
                toggleCvViewer(isShown = false);
                window.recruserCvId = similarCvs[getCurrentCvIndex()].id;
                setStep(window.RecruserSelectVacancyStep);
            };
        }
    }
    else {
        selectVacancyValidationEl.style.display = 'block';
        selectVacancyValidationEl.innerText = 'No such vacancy';
    }
}
function getFormattedVacancyName(vac) {
    return `${vac.title} (${vac.companyName})`;
}

async function setupSelectStepStep() {
    if (!window.recruserLastVacancy.hasSteps) {
        setStep(window.RecruserDoneStep);
    }

    recruserSelectVacancyBlock.style.display = 'none';
    recruserSelectStepBlock.style.display = 'block';

    window.recruserVacancySteps = await fetchVacancySteps(window.recruserLastVacancy.id);
    let stepTitles = window.recruserVacancySteps
        .filter(s => s.canUse == true)
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

    let possibleStep = window.recruserVacancySteps.find(s => s.title.toLowerCase() == input.toLowerCase());
    if (possibleStep) {
        window.recruserSelectedStepId = possibleStep.id;

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


function setCvViewerToggling() {
    document.getElementById('recruser-show-cv-viewer-block-btn1').onclick = () => {
        setCvViewerVisibility(isShown = true);
    };

    let showCvViewBlockBtn = document.getElementById('recruser-show-cv-viewer-block-btn2');
    showCvViewBlockBtn.onclick = () => {
        setCvViewerVisibility(isShown = true);
    };

    let hideCvViewBlockBtn = document.getElementById('recruser-hide-cv-viewer-block-btn');
    hideCvViewBlockBtn.onclick = () => {
        setCvViewerVisibility(isShown = false);
    };

    function setCvViewerVisibility(isShown) {
        showCvViewBlockBtn.style.display = isShown ? 'none' : 'inline';
        hideCvViewBlockBtn.style.display = isShown ? 'inline' : 'none';
        toggleCvViewer(isShown = isShown);
    }

    setCvViewerVisibility(isShown = true);
}


function setCvViewer(cvList, showSelectBtn = true) {
    console.log(showSelectBtn);
    document.getElementById('recruser-select-found-cv-btn').style.display = showSelectBtn ? 'block' : 'none';

    window.recruserSimilarCvs = cvList;
    document.getElementById('recruser-cv-total').textContent = cvList.length;
    document.getElementById('recruser-cv-current').textContent = getCurrentCvIndex() + 1;

    let openCv = window.recruserSimilarCvs[getCurrentCvIndex()];
    console.log(openCv);
    if (openCv.photoUrl)
        document.getElementById('recruser-cv-photo').setAttribute('src', openCv.photoUrl);
    document.getElementById('recruser-cv-name').textContent = openCv.fullName;
    document.getElementById('recruser-cv-position').textContent = openCv.position;
    if (openCv.birthDate) {
        let age = new Date().getFullYear() - new Date(openCv.birthDate).getFullYear();
        document.getElementById('recruser-cv-age').textContent = `Age: ${age} years`;
    }
    if (openCv.sourceUrls) {
        let html = '';
        openCv.sourceUrls.forEach(url => {
            html += `<br>${getSiteUrlMarkup(url)}`;
        });
        document.getElementById('recruser-cv-sources').innerHTML = `Sources: ${html}`;
    }
    if (openCv.contacts) {
        let html = '';
        openCv.contacts.forEach(contact => {
            if (contact.type == 4)
                html += `<br>${getContactNameForType(contact.type)}: ${getSiteUrlMarkup(contact.value)}`;
            else
                html += `<br>${getContactNameForType(contact.type)}: ${contact.value}`;
        });
        document.getElementById('recruser-cv-contacts').innerHTML = html;
    }
    if (openCv.experiences) {
        let html = '';
        openCv.experiences.forEach((exp, index, items) => {
            html += `
            <div class="recruser-cv-experience-item">
                <div>
                    <span>${exp.companyName},</span><br>
                    <i>${exp.position}</i>
                </div>
                <div style="display:${exp.startDate ? 'display' : 'none'}">
                    ${formatDate(exp.startDate)} - ${formatDate(exp.endDate)}
                </div>
            </div>
            `;
            if (index < items.length - 1)
                html += '<hr class="light-hr">';
        });
        document.getElementById('recruser-cv-experiences').innerHTML = html;
    }

    document.getElementById('recruser-cv-viewer-next').onclick = () => {
        updateCurrentCvIndex(delta = 1, cvList.length);
        setCvViewer(cvList);
    };
    document.getElementById('recruser-cv-viewer-prev').onclick = () => {
        updateCurrentCvIndex(delta = -1, cvList.length);
        setCvViewer(cvList);
    };
}

function formatDate(dateStr) {
    let date = new Date(dateStr);

    let month = date.getMonth();
    let monthStr = month >= 10 ? month : `0${month}`;

    return `${monthStr}.${date.getFullYear()}`;
}
function getSiteUrlMarkup(url) {
    let site = getSiteNameFromUrl(url);
    return `<a target="_blank" href="${url}">${site}</a>`
}
function getSiteNameFromUrl(url) {
    let site = url.replace('https://', '');
    site = site.replace('file:///', '');
    return site.substring(0, site.indexOf('/'));
}
function getContactNameForType(type) {
    if (type == 1) return 'Phone';
    if (type == 2) return 'Email';
    if (type == 3) return 'Skype';
    if (type == 4) return 'Link';
}
function getCurrentCvIndex() {
    return window.recruserCurrentCvIndex ? window.recruserCurrentCvIndex : 0;
}
function updateCurrentCvIndex(delta, total) {
    let newValue = getCurrentCvIndex() + delta;
    if (newValue < 0 || newValue >= total)
        return;
    window.recruserCurrentCvIndex = newValue;
}
function toggleCvViewer(isShown) {
    let cvViewBlock = document.getElementById('recruser-cv-viewer');
    cvViewBlock.style.display = isShown ? 'block' : 'none';
}