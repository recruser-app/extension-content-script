let mainContainer = document.getElementById('recruser-save-cv-block');

let recruserSaveBlock = document.getElementById('saveCv-step');

let recruserAddExistingCvToVacancyBtn = document.getElementById('recruser-found-add-candidate-anyway');

let recruserSelectVacancyBlock = document.getElementById('recruser-selectVacancy-step');
let recruserSelectVacancyAutocomplete = document.getElementById('recruser-selectVacancy-autocomplete');
let recruserSelectVacancyNextStep = document.getElementById('recruser-selectVacancy-next-step');

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
        setupCvViewerBlock(similarCvs, showSelectBtn = true, isShown = false);

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
        document.getElementById('recruser-vacancy-not-found').style.display = 'none';
        document.getElementById('recruser-found-candidate').style.display = 'none';
        toggleCvViewer(isShown = false);

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
function getFormattedVacancyName(vac) {
    return `${vac.title} (${vac.companyName})`;
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
            await addCandidateAndMoveToNextStep(matchedVacancy);
        } else {
            document.getElementById('recruser-found-candidate').style.display = 'block';
            setupCvViewerBlock(similarCvsInVacancy, showSelectBtn = false, isShown = true);

            document.getElementById('recruser-found-add-candidate-anyway').onclick = async (e) => {
                e.preventDefault();
                await addCandidateAndMoveToNextStep(matchedVacancy);
                toggleCvViewer(isShown = false);
            };
        }
    }
    else {
        document.getElementById('recruser-vacancy-not-found').style.display = 'block';
    }
}

async function addCandidateAndMoveToNextStep(matchedVacancy) {
    window.recruserLastVacancy = matchedVacancy;
    setStep(window.RecruserSelectStepStep);
    window.recruserCandidateId = await saveCandidate(window.recruserCvId, matchedVacancy.id);
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

let cvViewerBlock = document.getElementById('recruser-cv-viewer');
function setupCvViewerBlock(similarCvsInVacancy, showSelectBtn, isShown) {
    if (cvViewerBlock) cvViewerBlock.remove();
    mainContainer.append(cvViewerBlock);

    setCvViewerToggling();
    fillDataIntoCvViewer(similarCvsInVacancy, showSelectBtn);
    toggleCvViewer(isShown);
}
function fillDataIntoCvViewer(cvList, showSelectBtn = true) {
    document.getElementById('recruser-select-found-cv-btn').style.display = showSelectBtn ? 'block' : 'none';

    window.recruserSimilarCvs = cvList;
    document.getElementById('recruser-cv-total').textContent = cvList.length;
    document.getElementById('recruser-cv-current').textContent = getCurrentCvIndex() + 1;

    let currentCv = window.recruserSimilarCvs[getCurrentCvIndex()];
    console.log(currentCv);
    if (currentCv.photoUrl)
        document.getElementById('recruser-cv-photo').setAttribute('src', currentCv.photoUrl);
    document.getElementById('recruser-cv-name').textContent = currentCv.fullName;
    document.getElementById('recruser-cv-position').textContent = currentCv.position;
    if (currentCv.birthDate) {
        let age = new Date().getFullYear() - new Date(currentCv.birthDate).getFullYear();
        document.getElementById('recruser-cv-age').textContent = `Age: ${age} years`;
    }
    if (currentCv.sourceUrls) {
        let html = 'Sources: ';
        currentCv.sourceUrls.forEach((url, index) => {
            if (index > 1) html += ', '
            html += `${getSiteUrlMarkup(url)}`;
        });
        document.getElementById('recruser-cv-sources').innerHTML = html;
    }
    if (currentCv.lastTransaction) {
        document.getElementById('recruser-cv-last-action').innerHTML = `
        <b>${getRecruiterName(currentCv)}</b> 
        ${constructStepText(currentCv.lastTransaction.newStepTitle)} 
        <b>${currentCv.lastTransaction.madeTimeAgo}</b> 
        in vacancy <b>"${currentCv.lastTransaction.vacancyTitle}"</b> 
        (${currentCv.lastTransaction.companyName})
        `;
    }
    if (currentCv.contacts) {
        let html = '<b>Contacts: </b>';
        if (currentCv.contacts.length) {
            currentCv.contacts.forEach((contact, index) => {
                if (index > 0) html += ', ';
                if (contact.type == 4)
                    html += `${getContactNameForType(contact.type)}: ${getSiteUrlMarkup(contact.value)}`;
                else
                    html += `${getContactNameForType(contact.type)}: ${contact.value}`;
            });
        } else {
            html += '<i>no contacts</i>';
        }
        document.getElementById('recruser-cv-contacts').innerHTML = html;
    }
    if (currentCv.experiences) {
        let html = '';
        currentCv.experiences.forEach((exp, index, items) => {
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
        fillDataIntoCvViewer(cvList);
    };
    document.getElementById('recruser-cv-viewer-prev').onclick = () => {
        updateCurrentCvIndex(delta = -1, cvList.length);
        fillDataIntoCvViewer(cvList);
    };
}

function constructStepText(stepTitle) {
    return stepTitle ? `moved this candidate to "<b>${stepTitle}</b>" step` : 'added this candidate';
}
function getRecruiterName(openCv) {
    if (getUserName() == openCv.lastTransaction.recruiterName)
        return 'You';
    return openCv.lastTransaction.recruiterName;
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


let showCvViewBlockBtn = document.getElementById('recruser-show-cv-viewer-block-btn2');
let hideCvViewBlockBtn = document.getElementById('recruser-hide-cv-viewer-block-btn');
function setCvViewerToggling() {
    document.getElementById('recruser-show-cv-viewer-block-btn1').onclick = () => {
        setCvViewerVisibility(isShown = true);
    };

    showCvViewBlockBtn.onclick = () => {
        setCvViewerVisibility(isShown = true);
    };

    hideCvViewBlockBtn.onclick = () => {
        setCvViewerVisibility(isShown = false);
    };
}
function setCvViewerVisibility(isShown) {
    showCvViewBlockBtn.style.display = isShown ? 'none' : 'inline';
    hideCvViewBlockBtn.style.display = isShown ? 'inline' : 'none';
    toggleCvViewer(isShown);
}
function toggleCvViewer(isShown) {
    cvViewerBlock.style.display = isShown ? 'block' : 'none';
}