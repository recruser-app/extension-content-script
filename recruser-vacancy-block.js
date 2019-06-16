let recruserVacancyOpenedBlock = document.getElementById('recruser-vacancy-opened');
let recruserVacancyClosedBlock = document.getElementById('recruser-vacancy-closed');
let recruserShowBtn = document.getElementById('recruser-set-block-vacancy-show-btn');
let recruserHideBtns = document.getElementsByClassName('recruser-hide');

let recruserSetBlockVacancyViewBlock = document.getElementById('recruser-set-block-vacancy-view');
let recruserSetBlockVacancyEditBlock = document.getElementById('recruser-set-block-vacancy-edit');
let recruserSetBlockVacancyEditBtn = document.getElementById('recruser-set-block-vacancy-edit-btn');
let recruserSetBlockVacancyExitBtn = document.getElementById('recruser-set-block-vacancy-exit-btn');

let recruserSetBlockVacancyAutocomplete = document.getElementById('recruser-set-block-vacancy-autocomplete');
let recruserSetVlockVacancySubmitBtn = document.getElementById('recruser-set-block-vacancy-submit');
let recruserSetBlockVacancyValidation = document.getElementById('recruser-set-block-vacancy-validation');

let recruserBlockVacancyTitle = document.getElementById('recruser-block-vacancy-title');
let recruserBlockVacancyDescription = document.getElementById('recruser-block-vacancy-description-content');

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
Array.from(recruserHideBtns).forEach(btn => {
    btn.onclick = async (e) => {
        e.preventDefault();
        hideVacancyBlock();
        setBlockVacancyVisibility(false);
    }
})

recruserSetBlockVacancyEditBtn.onclick = (e) => {
    e.preventDefault();
    setVacancyEditMode();
}
recruserSetBlockVacancyExitBtn.onclick = (e) => {
    e.preventDefault();
    setVacancyViewMode();
}

async function setAutocompleteVacancyListByInput(autocomplete, input, maxItems) {
    let foundVacancies = await fetchVacancies(input, maxItems);
    window.recruserAutocompleteVacancyList = foundVacancies;
    autocomplete.list = (window.recruserAutocompleteVacancyList).map(v => ({
        label: getFormattedVacancyName(v),
        value: v.title
    }));
}
function getFormattedVacancyName(vac) {
    return `${vac.title} (${vac.companyName})`;
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
        recruserVacancyOpenedBlock.style.height = `${blockVacancy.bLockHeight}px`;
        setVacancyBlockText(blockVacancy);
    } else {
        await setVacancyEditMode(showExitBtn = false);
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
    console.log('input', input)
    console.log('window.recruserAutocompleteVacancyList', window.recruserAutocompleteVacancyList)
    let matchedVacancy = window.recruserAutocompleteVacancyList.find(v => v.title.toLowerCase() == input.toLowerCase());
    if (matchedVacancy) {
        let fullVacancyInfo = await fetchVacancyById(matchedVacancy.id);
        setVacancyBlockText(fullVacancyInfo);
        setVacancyViewMode();
        setBlockVacancy(matchedVacancy.id);
    }
    else {
        recruserSetBlockVacancyValidation.style.display = 'block';
        recruserSetBlockVacancyValidation.innerText = 'No such vacancy';
    }
}

async function setVacancyBlockText(vacancy) {
    recruserBlockVacancyTitle.innerHTML = formatVacancyTitle(vacancy);
    recruserBlockVacancyDescription.innerHTML = vacancy.description;
}

function formatVacancyTitle(vacancy) {
    const maxLength = 30;
    let vacancyTitle = vacancy.title.length > maxLength ? `${vacancy.title.substr(0, maxLength)}...` : vacancy.title;
    let companyName = vacancy.companyName.length > maxLength ? `${vacancy.companyName.substr(0, maxLength)}...` : vacancy.companyName;
    return `<span title='${vacancy.title}'>${vacancyTitle}</span> 
            <br>
            <span title='${vacancy.companyName}'>(${companyName})</span>`;
}

function newFunction(vacancy) {
    return vacancy.title;
}

function setVacancyViewMode() {
    Array.from(recruserHideBtns).forEach(btn => {
        btn.style.display = 'inline-block';
    });
    recruserSetBlockVacancyEditBlock.style.display = 'none';
    recruserSetBlockVacancyViewBlock.style.display = 'block';
}
async function setVacancyEditMode(showExitBtn = true) {
    setupAutocomplete();
    Array.from(recruserHideBtns).forEach(btn => {
        btn.style.display = 'none';
    });
    recruserSetBlockVacancyEditBlock.style.display = 'grid';
    recruserSetBlockVacancyViewBlock.style.display = 'none';
    if (showExitBtn) {
        recruserSetBlockVacancyExitBtn.style.display = 'inline-block';
    } else {
        recruserSetBlockVacancyExitBtn.style.display = 'none';
    }
}

async function setupAutocomplete() {
    recruserSetBlockVacancyAutocomplete.value = '';
    let maxAutocompleteItems = 3
    let autocomplete = new Awesomplete(recruserSetBlockVacancyAutocomplete, {
        minChars: 0, maxItems: maxAutocompleteItems, sort: false
    });
    await setAutocompleteVacancyListByInput(autocomplete, null, maxAutocompleteItems);
    autocomplete.evaluate();

    recruserSetBlockVacancyAutocomplete.oninput = async () => {
        let input = recruserSetBlockVacancyAutocomplete.value;
        await setAutocompleteVacancyListByInput(autocomplete, input, maxAutocompleteItems);
        recruserSetBlockVacancyValidation.style.display = 'none';
    }
}
