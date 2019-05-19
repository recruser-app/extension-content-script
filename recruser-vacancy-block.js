let recruserVacancyOpenedBlock = document.getElementById('recruser-vacancy-opened');
let recruserVacancyClosedBlock = document.getElementById('recruser-vacancy-closed');
let recruserShowBtn = document.getElementById('recruser-set-block-vacancy-show-btn');
let recruserHideBtn = document.getElementById('recruser-set-block-vacancy-hide-btn');

let recruserSetBlockVacancyViewBlock = document.getElementById('recruser-set-block-vacancy-view');
let recruserSetBlockVacancyEditBlock = document.getElementById('recruser-set-block-vacancy-edit');
let recruserSetBlockVacancyEditBtn = document.getElementById('recruser-set-block-vacancy-edit-btn');
let recruserSetBlockVacancyExitBtn = document.getElementById('recruser-set-block-vacancy-exit-btn');

let recruserSetBlockVacancyAutocomplete = document.getElementById('recruser-set-block-vacancy-autocomplete');
let recruserSetVlockVacancySubmitBtn = document.getElementById('recruser-set-block-vacancy-submit');
let recruserSetBlockVacancyValidation = document.getElementById('recruser-set-block-vacancy-validation');

let recruserBlockVacancyTitle = document.getElementById('recruser-block-vacancy-title');
let recruserBlockVacancyDescription = document.getElementById('recruser-block-vacancy-description');

(async () => {
    let isVacancyBlockVisible = await getBlockVacancyVisibility();
    if (isVacancyBlockVisible) {
        showVacancyBlock();
    } else {
        hideVacancyBlock();
    }
})();

recruserShowBtn.onclick = async (e) => {
    e.preventDefault();
    showVacancyBlock();
    setBlockVacancyVisibility(true);
}
recruserHideBtn.onclick = async (e) => {
    e.preventDefault();
    hideVacancyBlock();
    setBlockVacancyVisibility(false);
}

recruserSetBlockVacancyEditBtn.onclick = (e) => {
    e.preventDefault();
    setVacancyEditMode();
}
recruserSetBlockVacancyExitBtn.onclick = (e) => {
    e.preventDefault();
    setVacancyViewMode();
}

let autocomplete = new Awesomplete(recruserSetBlockVacancyAutocomplete, {
    minChars: 1, maxItems: 3, sort: false
});
recruserSetBlockVacancyAutocomplete.oninput = async () => {
    let input = recruserSetBlockVacancyAutocomplete.value;
    autocomplete.list = (await fetchVacancies(input)).map(v => v.title);
    recruserSetBlockVacancyValidation.style.display = 'none';
}
recruserSetVlockVacancySubmitBtn.onclick = async (e) => {
    e.preventDefault();
    await trySetVacancy();
}
recruserSetBlockVacancyAutocomplete.addEventListener("keyup", async (e) => {
    if (e.keyCode === 13) { //"Enter"
        e.preventDefault();
        await trySetVacancy();
    }
});

new ResizeObserver(async () => {
    console.log(recruserVacancyOpenedBlock.style.height);
    setBlockVacancyHeight(recruserVacancyOpenedBlock.style.height)
}).observe(recruserVacancyOpenedBlock);

async function showVacancyBlock() {
    let blockVacancy = await getBlockVacancy();
    if (blockVacancy) {
        setVacancyBlockText(blockVacancy);
    } else {
        setVacancyEditMode(showExitBtn = false);
    }
    recruserVacancyOpenedBlock.style.display = 'block';
    recruserVacancyClosedBlock.style.display = 'none';
}
async function hideVacancyBlock() {
    recruserVacancyOpenedBlock.style.display = 'none';
    recruserVacancyClosedBlock.style.display = 'block';
}


async function trySetVacancy() {
    let input = recruserSetBlockVacancyAutocomplete.value;
    let matchedVacancy = await getMatchedVacancyFor(input);
    if (matchedVacancy) {
        setVacancyBlockText(matchedVacancy);
        setVacancyViewMode();
        setBlockVacancy(matchedVacancy.id);
    }
    else {
        recruserSetBlockVacancyValidation.style.display = 'block';
        recruserSetBlockVacancyValidation.innerText = 'No such vacancy';
    }
}

function setVacancyBlockText(vacancy) {
    recruserVacancyOpenedBlock.style.height = `${vacancy.bLockHeight}px`;

    recruserBlockVacancyTitle.textContent = vacancy ? `${vacancy.title} (${vacancy.companyName})` : '';
    recruserBlockVacancyDescription.innerHTML = vacancy ? vacancy.description : '';
}

function setVacancyViewMode() {
    recruserSetBlockVacancyEditBlock.style.display = 'none';
    recruserSetBlockVacancyViewBlock.style.display = 'block';
}
function setVacancyEditMode(showExitBtn = true) {
    recruserSetBlockVacancyEditBlock.style.display = 'block';
    recruserSetBlockVacancyViewBlock.style.display = 'none';
    if (showExitBtn) {
        recruserSetBlockVacancyExitBtn.style.display = 'block';
    } else {
        recruserSetBlockVacancyExitBtn.style.display = 'none';
    }
}

