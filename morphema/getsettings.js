var apiKey = ''
var model = 'gpt-4o-mini'

function activateSettingsModal() {
    keyEntry = document.getElementById('apiKeyEntry');
    keyEntry.value = apiKey;
    document.getElementById('modelEntry').value = model;
     document.getElementById('settingsOverlay').style.display = 'block';
}

function loadSettings() {
    model = localStorage.getItem('model');
    apiKey = localStorage.getItem('apiKey');
    if (! apiKey) {
	document.getElementById('settingsOverlay').style.display = 'block';
    }
}

function collectSettings() {
    apiKey = document.getElementById('apiKeyEntry').value;
    model = document.getElementById('modelEntry').value
    localStorage.setItem('apiKey', apiKey);
    localStorage.setItem('model', model);
    document.getElementById('settingsOverlay').style.display = 'none';
}
