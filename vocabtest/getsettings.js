var openaiApiKey = "";
var model = "gpt-4o-mini";
var language = "";
var vocab = []

const supportedLanguages = {
    "slovene": {
	"language_name": "Slovene",
	"vocab_file": "vocab_sl.json"
    }
}

function activateSettingsModal() {
    keyEntry = document.getElementById("apiKeyEntry");
    keyEntry.value = openaiApiKey;
    document.getElementById("modelEntry").value = model;
    document.getElementById("settingsOverlay").style.display = "block";
}

function loadSettings() {
    model = localStorage.getItem("cacophonyModel");
    openaiApiKey = localStorage.getItem("openaiApiKey");
    language = localStorage.getItem("cacophonyLanguage");
    if (! openaiApiKey || ! language in supportedLanguages) {
	activateSettingsModal();
    }
}

function collectSettings() {
    openaiApiKey = document.getElementById("apiKeyEntry").value;
    model = document.getElementById("modelEntry").value;
    newLanguage = document.getElementById("language").value;
    if (newLanguage != language) {
	vocab = [];
    }
    language = newLanguage;
    localStorage.setItem("openaiApiKey", openaiApiKey);
    localStorage.setItem("cacophonyModel", model);
    localStorage.setItem("cacophonyLanguage", language);
    document.getElementById("settingsOverlay").style.display = "none";
}

function languageName() {
    return supportedLanguages[language]["language_name"];
}

async function ensureVocabLoaded() {
    if (vocab.length == 0) {
	const response = await fetch(supportedLanguages[language]["vocab_file"]);
	vocab = await response.json();
    }
}
