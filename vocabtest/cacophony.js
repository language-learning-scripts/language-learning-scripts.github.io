function pick(array) {
    return array[Math.floor(Math.random() * array.length)];
}

class Status {
    constructor() {
	this.active = false;
	this.timeoutId = null;
    }

    updateStatus(msg) {
	if (this.active) {
	    clearTimeout(this.timeoutId);
	}
	this.active = true;
	const statusDiv = document.getElementById("status");
	statusDiv.innerHTML = msg;
	statusDiv.style.display = "inline";
	setTimeout(() => {this.clearStatus();}, 2000);
    }

    pinStatus(msg) {
	this.active = true;
	const statusDiv = document.getElementById("status");
	statusDiv.innerHTML = msg;
	statusDiv.style.display = "inline";	
    }

    clearStatus() {
	if (this.active) {
	    clearTimeout(this.timeoutId);
	}
	this.active = false;
	const statusDiv = document.getElementById("status");
	statusDiv.innerHTML = "";
	statusDiv.style.display = "none";
    }
}

const status = new Status();

function trimCodeblock(str) {
    if (str.substring(0, 8) == "```html\n") {
	str = str.substring(8);
    }
    if (str.length > 12 && str.substring(str.length - 4, str.length) == "```\n") {
	str = str.substring(0, str.length - 4);
    } else if (str.length > 11 && str.substring(str.length - 3, str.length) == "```") {
	str = str.substring(0, str.length - 3);
    }

    return str;
}

foreignWordlist = ["meza", "dan"]

const chatConnection = new ChatConnection();
const ttsConnection = new TTSConnection();

var pcmData = null;

async function generateForeignSentence() {
    document.getElementById("listenAssess").innerHTML = "";
    document.getElementById("answerInput").value = "";
    await ensureVocabLoaded();
    const entry = pick(vocab);
    const testPhrasePrompt = `You are helping someone learn ${languageName()} by generating a simple sentence in ${languageName()} for them to translate. The sentence should contain the following word or phrase from their vocabulary list: "${entry["foreign"]}" ("${entry["english"]}"). Respond with the ${languageName()} sentence and no other text.`

    status.pinStatus("Generating sentence...");
    const testSentence = await chatConnection.simpleRequest(testPhrasePrompt);

    status.pinStatus("Converting sentence to audio...");
    pcmData = await ttsConnection.generateAudio("Read the following Slovene sentence slowly and clearly, for someone who is still learning Slovene", testSentence);
    status.updateStatus("Playing sentence...");

    await playPCM(pcmData);

    const repeatButton = document.getElementById("repeatQuestion");
    repeatButton.onclick = (e) => {
	playPCM(pcmData);
    };
    repeatButton.disabled = false;

    const tryAnswerButton = document.getElementById("tryAnswer");
    tryAnswerButton.onclick = (e) => {
	listenAssess(testSentence, document.getElementById("answerInput").value);
    };
    tryAnswerButton.disabled = false;
    document.getElementById("answerInputForm").onsubmit = (e) => {
	listenAssess(testSentence, document.getElementById("answerInput").value);
	e.preventDefault();
    };

    const showAnswerButton = document.getElementById("listenShowAnswer");
    showAnswerButton.onclick = (e) => {
	listenShowAnswer(testSentence);
    };
    showAnswerButton.disabled = false;
}

async function streamToElement(stream, answerElement) {
    answerText = "";
    for await (chunk of stream) {
	answerText += chunk;
//	answerText = trimCodeblock(answerText);
	answerElement.innerHTML = marked.parse(answerText);
    }
}

function disableListenButtons() {
    for (id of ["tryAnswer", "repeatQuestion", "generateForeignSentence", "listenShowAnswer"]) {
	document.getElementById(id).disabled = true;
    }
}

function disableSpeakButtons() {
    for (id of ["toggleRecording", "generateEnglishSentence", "speakShowAnswer"]) {
	document.getElementById(id).disabled = true;
    }
}

async function listenAssess(testSentence, userAnswer) {
    disableListenButtons();
    const prompt = `I'm learning ${languageName()}. I listened to the phrase "${testSentence}" and my attempt to translate it was "${userAnswer}". How did I do?`;
    const assessStream = await chatConnection.streamRequest(prompt);
    await streamToElement(assessStream, document.getElementById("listenAssess"));
    document.getElementById("generateForeignSentence").disabled = false;
}

async function listenShowAnswer(testSentence) {
    disableListenButtons();
    const answerStream = await chatConnection.streamRequest(
	`I'm having trouble translating the ${languageName()} sentence "${testSentence}" into English. Please explain how to translate it.`
    );
    await streamToElement(answerStream, document.getElementById("listenAssess"));
    document.getElementById("generateForeignSentence").disabled = false;
}

async function generateEnglishSentence() {
    await ensureVocabLoaded();
    const entry = pick(vocab);

    const testPhrasePrompt = `You are helping someone learn ${languageName()} by generating a simple sentence in English for them to translate into ${languageName()}. The sentence should test their knowledge of the following word or phrase from their vocabulary list: "${entry["foreign"]}" ("${entry["english"]}"). Respond with the English sentence and no other text.`

    status.updateStatus("Requesting sentence...")
    const testPhrase = await chatConnection.simpleRequest(testPhrasePrompt);
    document.getElementById("question").innerHTML = testPhrase;
    const toggleRecordButton = document.getElementById("toggleRecording");
    toggleRecordButton.innerHTML = "Ready to speak";
    toggleRecordButton.onclick = (e) => {
	recordAnswer(testPhrase);
    };
    toggleRecordButton.disabled = false;
    const showAnswerButton = document.getElementById("speakShowAnswer");
    showAnswerButton.onclick = (e) => {
	speakShowAnswer(testPhrase);
    };
    showAnswerButton.disabled = false;
    document.getElementById("speakAssess").innerHTML = "";
}

async function recordAnswer(testPhrase) {
    const recordingButton = document.getElementById("toggleRecording");
    activeRecording = new Recording();
    await activeRecording.start();
    recordingButton.innerHTML = "Stop and check";
    recordingButton.onclick = async (e) => {
	recordingButton.disabled = true;
	const wavData = await activeRecording.stop();
	speakAssess(testPhrase, wavData);
    };
    document.getElementById("speakShowAnswer").onclick = (e) => {
	activeRecording.cancel();
	speakShowAnswer(testPhrase);
    };
    document.getElementById("generateEnglishSentence").onclick = (e) => {
	activeRecording.cancel();
	generateEnglishSentence();
    }
}

async function speakAssess(testPhrase, wavData) {
    disableSpeakButtons();
    const assessmentStream = await chatConnection.audioStreamRequest(
	`I'm learning ${languageName()}. This is my attempt to say '${testPhrase}' in ${languageName()}. How did I do? Say what you understood of my answer and point out any mistakes you noticed.`,
	wavData,
	"audio/wav"
    );

    await streamToElement(assessmentStream, document.getElementById("speakAssess"));
    document.getElementById("generateEnglishSentence").disabled = false;
}

async function speakShowAnswer(questionPhrase) {
    disableSpeakButtons();
    const answerStream = await chatConnection.streamRequest(
	`I'm having trouble translating the sentence ${questionPhrase} into ${languageName()}. Please explain how to translate it.`
    );

    await streamToElement(answerStream, document.getElementById("speakAssess"));
    document.getElementById("generateEnglishSentence").disabled = false;
}

function listenMode() {
    document.getElementById("speakPanel").style.display = "none";
    document.getElementById("listenPanel").style.display = "flex";
    document.getElementById("listenTitle").className = "active";
    document.getElementById("speakTitle").className = "inactive";
}

function speakMode() {
    document.getElementById("listenPanel").style.display = "none";
    document.getElementById("speakPanel").style.display = "flex";
    document.getElementById("listenTitle").className = "inactive";
    document.getElementById("speakTitle").className = "active";
}

window.onerror = (msg, src, line, col, error) => {
    status.clearStatus();
    alert(msg);
}

window.onunhandledrejection = (ev) => {
    status.clearStatus();
    alert(ev.reason);
}
