var googleApiKey = "";
var model = "gemini-2.0-flash";
var language = "";

const supportedLanguages = {
    "slovene": {
	"language_name": "Slovene",
    }
}

function activateSettingsModal() {
    keyEntry = document.getElementById("apiKeyEntry");
    keyEntry.value = googleApiKey;
    document.getElementById("modelEntry").value = model;
    document.getElementById("settingsOverlay").style.display = "block";
}

function loadSettings() {
    model = localStorage.getItem("model");
    googleApiKey = localStorage.getItem("googleApiKey");
    language = localStorage.getItem("language");
    if (! googleApiKey || ! language in supportedLanguages) {
	activateSettingsModal();
    }
}

function collectSettings() {
    googleApiKey = document.getElementById("apiKeyEntry").value;
    model = document.getElementById("modelEntry").value;
    newLanguage = document.getElementById("language").value;
    language = newLanguage;
    localStorage.setItem("googleApiKey", googleApiKey);
    localStorage.setItem("model", model);
    localStorage.setItem("language", language);
    document.getElementById("settingsOverlay").style.display = "none";
}
