var googleApiKey = "";
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
    keyEntry.value = googleApiKey;
    document.getElementById("modelEntry").value = model;
    document.getElementById("settingsOverlay").style.display = "block";
}

function loadSettings() {
    model = localStorage.getItem("cacophonyModel");
    googleApiKey = localStorage.getItem("googleApiKey");
    
    language = localStorage.getItem("cacophonyLanguage");
    if (! googleApiKey || ! language in supportedLanguages) {
	activateSettingsModal();
    }
}

function collectSettings() {
    googleApiKey = document.getElementById("apiKeyEntry").value;
    model = document.getElementById("modelEntry").value;
    newLanguage = document.getElementById("language").value;
    if (newLanguage != language) {
	vocab = [];
    }
    language = newLanguage;
    localStorage.setItem("googleApiKey", googleApiKey);
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
