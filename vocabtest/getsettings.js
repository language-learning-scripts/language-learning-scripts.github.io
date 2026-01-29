var googleApiKey = "";
var genModel = "gemini-2.5-flash";
var assessModel = "gemini-3-flash-preview";
var language = "slovene";
var vocab = []

const supportedLanguages = {
    "slovene": {
	"language_name": "Slovene",
	"vocab_file": "vocab_sl.json",
	"ttsLanguageCode": "sl-SI",
	"male_voices": [
	    "sl-SI-Chirp3-HD-Achird",
	    "sl-SI-Chirp3-HD-Algenib",
	    "sl-SI-Chirp3-HD-Algieba",
	    "sl-SI-Chirp3-HD-Alnilam",
	    "sl-SI-Chirp3-HD-Charon",
	    "sl-SI-Chirp3-HD-Enceladus",
	    "sl-SI-Chirp3-HD-Fenrir",
	    "sl-SI-Chirp3-HD-Iapetus",
	    "sl-SI-Chirp3-HD-Orus",
	    "sl-SI-Chirp3-HD-Puck",
	    "sl-SI-Chirp3-HD-Rasalgethi",
	    "sl-SI-Chirp3-HD-Sadachbia",
	    "sl-SI-Chirp3-HD-Sadaltager",
	    "sl-SI-Chirp3-HD-Schedar",
	    "sl-SI-Chirp3-HD-Umbriel",
	    "sl-SI-Chirp3-HD-Zubenelgenubi"
	],
	"female_voices": [
	    "sl-SI-Chirp3-HD-Achernar",
	    "sl-SI-Chirp3-HD-Aoede",
	    "sl-SI-Chirp3-HD-Autonoe",
	    "sl-SI-Chirp3-HD-Callirrhoe",
	    "sl-SI-Chirp3-HD-Despina",
	    "sl-SI-Chirp3-HD-Erinome",
	    "sl-SI-Chirp3-HD-Gacrux",
	    "sl-SI-Chirp3-HD-Kore",
	    "sl-SI-Chirp3-HD-Laomedeia",
	    "sl-SI-Chirp3-HD-Leda",
	    "sl-SI-Chirp3-HD-Pulcherrima",
	    "sl-SI-Chirp3-HD-Sulafat",
	    "sl-SI-Chirp3-HD-Vindemiatrix",
	    "sl-SI-Chirp3-HD-Zephyr"
	]
    }
}

function activateSettingsModal() {
    keyEntry = document.getElementById("apiKeyEntry");
    keyEntry.value = googleApiKey;
    document.getElementById("settingsOverlay").style.display = "block";
}

function loadSettings() {
    googleApiKey = localStorage.getItem("googleApiKey");
    
    language = localStorage.getItem("cacophonyLanguage");
    if (! googleApiKey || ! language in supportedLanguages) {
	activateSettingsModal();
    }
}

function collectSettings() {
    googleApiKey = document.getElementById("apiKeyEntry").value;
    newLanguage = document.getElementById("language").value;
    if (newLanguage != language) {
	vocab = [];
    }
    language = newLanguage;
    localStorage.setItem("googleApiKey", googleApiKey);
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
