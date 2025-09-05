const foreignLanguageName = "Slovene";

function pick(array) {
    return array[Math.floor(Math.random() * array.length)];
}

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

// const apiKey = "AIzaSyAo2hHVQDkoV5xRDO_r4lY9CJnyET-iU8c";

const chatConnection = new ChatConnection();
activeRecording = null;
currentSentence = "";

async function generateSentence() {
    const testWord = pick(englishWordList);

    const testPhrasePrompt = `You are helping someone learn ${foreignLanguageName} by generating a simple sentence in English for them to translate into ${foreignLanguageName}. The sentence should contain the word or phrase "${testWord}". Respond with the English sentence and no other text.`

    const testPhrase = await chatConnection.simpleRequest(testPhrasePrompt);
    document.getElementById("question").innerHTML = testPhrase;
    const toggleRecordButton = document.getElementById("toggleRecording");
    toggleRecordButton.innerHTML = "Ready to speak";
    toggleRecordButton.onclick = (e) => {
	recordAnswer(testPhrase);
    };
    toggleRecordButton.disabled = false;
    const showAnswerButton = document.getElementById("showAnswer");
    showAnswerButton.onclick = (e) => {
	showAnswer(testPhrase);
    };
    showAnswerButton.disabled = false;
    document.getElementById("assessment").innerHTML = "";
}

async function recordAnswer(testPhrase) {
    const recordingButton = document.getElementById("toggleRecording");
    activeRecording = new Recording();
    await activeRecording.start();
    recordingButton.innerHTML = "Stop and check";
    recordingButton.onclick = async (e) => {
	recordingButton.disabled = true;
	const wavData = await activeRecording.stop();
	assess(testPhrase, wavData);
    };
    document.getElementById("showAnswer").onclick = (e) => {
	activeRecording.cancel();
	showAnswer(testPhrase);
    };
    document.getElementById("generateSentence").onclick = (e) => {
	activeRecording.cancel();
	showAnswer(testPhrase);
    }
}

async function streamToAssessment(stream) {
    answerText = "";
    answerElement = document.getElementById("assessment")
    for await (chunk of stream) {
	answerText += chunk;
	answerText = trimCodeblock(answerText);
	answerElement.innerHTML = answerText;
    }
}

function disableAllButtons() {
    for (button of document.getElementsByTagName("button")) {
	button.disabled = true;
    }    
}

async function assess(testPhrase, wavData) {
    disableAllButtons();
    const assessmentStream = await chatConnection.audioStreamRequest(
	`I'm learning ${foreignLanguageName}. This is my attempt to say '${testPhrase}' in ${foreignLanguageName}. How good is it? Format your answer as HTML.`,
	wavData,
	"audio/wav"
    );

    await streamToAssessment(assessmentStream);
    document.getElementById("generateSentence").disabled = false;
}

async function showAnswer(questionPhrase) {
    disableAllButtons();
    const answerStream = await chatConnection.streamRequest(
	`I'm having trouble translating the sentence ${questionPhrase} into ${foreignLanguageName}. Please help. Format your response as plain HTML.`
    );

    await streamToAssessment(answerStream);
    document.getElementById("generateSentence").disabled = false;
}
