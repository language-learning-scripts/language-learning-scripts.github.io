var apiKey = "";
var model = "gemini-2.0-flash";
var language = "";

const supportedLanguages = {
    "slovene": {
	"language_name": "Slovene",
    }
}

function activateSettingsModal() {
    keyEntry = document.getElementById("apiKeyEntry");
    keyEntry.value = apiKey;
    document.getElementById("modelEntry").value = model;
    document.getElementById("settingsOverlay").style.display = "block";
}

function loadSettings() {
    model = localStorage.getItem("model");
    apiKey = localStorage.getItem("apiKey");
    language = localStorage.getItem("language");
    if (! apiKey || ! language in supportedLanguages) {
	activateSettingsModal();
    }
}

function collectSettings() {
    apiKey = document.getElementById("apiKeyEntry").value;
    model = document.getElementById("modelEntry").value;
    newLanguage = document.getElementById("language").value;
    language = newLanguage;
    localStorage.setItem("apiKey", apiKey);
    localStorage.setItem("model", model);
    localStorage.setItem("language", language);
    document.getElementById("settingsOverlay").style.display = "none";
}
