function computeBottomMidpoint(elt) {
    const startMarker = document.createElement('span');
    elt.insertAdjacentElement('afterbegin', startMarker);
    const endMarker = document.createElement('span');
    elt.insertAdjacentElement('beforeend', endMarker);

    var result;
    if (endMarker.offsetTop === startMarker.offsetTop) {
	result = (startMarker.offsetLeft + endMarker.offsetLeft) / 2;
    } else {
	const textLeft = document.getElementById('annotationText').offsetLeft;
	result = (endMarker.offsetLeft + textLeft) / 2;
    }

    startMarker.remove();
    endMarker.remove();

    return result;
}

function computeTopMidpoint(elt) {
    const startMarker = document.createElement('span');
    elt.insertAdjacentElement('afterbegin', startMarker);
    const endMarker = document.createElement('span');
    elt.insertAdjacentElement('beforeend', endMarker);

    const textWidth = document.getElementById('annotationText').offsetWidth;

    var result;
    if (endMarker.offsetTop === startMarker.offsetTop) {
	result = (startMarker.offsetLeft + endMarker.offsetLeft) / 2;
    } else {
	result = Math.min(startMarker.offsetLeft + 50, textWidth);
    }

    startMarker.remove();
    endMarker.remove();

    return result;
}

function moveConnectorLandscape(idx) {
    connector = document.getElementById('connector');
    elt1 = document.getElementsByClassName('phrase')[idx];
    elt2 = document.getElementsByClassName('note')[idx];
    const midbottom = computeBottomMidpoint(elt1);
    pos1 = [midbottom, elt1.offsetTop + elt1.offsetHeight];
    pos2 = [elt2.offsetLeft,
	    Math.min(elt1.offsetTop + elt1.offsetHeight + 20,
		     elt2.offsetTop + elt2.offsetHeight)];
    curve = 'M ' + pos1[0] + ' ' + pos1[1] + ' ' +
	'T ' +
	pos1[0] + ' ' + (pos1[1] + 10) + ' ' +
	pos2[0] + ' ' + pos2[1];
    connector.setAttribute("d", curve);
    connector.setAttribute("stroke", elt1.style.backgroundColor);
    document.getElementById('overlay').style.height = '100%';
}

function moveConnectorPortrait(idx) {
    connector = document.getElementById('connector');
    elt1 = document.getElementsByClassName('phrase')[idx];
    elt2 = document.getElementsByClassName('note')[idx];
    const midbottom = computeBottomMidpoint(elt1);
    pos1 = [midbottom, elt1.offsetTop + elt1.offsetHeight];
    pos2 = [elt2.offsetLeft + elt2.offsetWidth / 2,
	    elt2.offsetTop];
    curve = 'M ' + pos1[0] + ' ' + pos1[1] + ' ' +
	'C ' +
	pos1[0] + ' ' + (pos1[1] + (pos2[1] - pos1[1]) / 4) + ' ' +
	pos2[0] + ' ' + (pos2[1] - (pos2[1] - pos1[1]) / 4) + ' ' +
	pos2[0] + ' ' + pos2[1];
    connector.setAttribute("d", curve);
    connector.setAttribute("stroke", elt1.style.backgroundColor);
}

function connectPositions(pos1, pos2, colour) {
    const connector = document.getElementById('connector');

    curve = 'M ' + pos1[0] + ' ' + pos1[1] + ' ' +
	'C ' +
	pos1[0] + ' ' + (pos1[1] + (pos2[1] - pos1[1]) / 4) + ' ' +
	pos2[0] + ' ' + (pos2[1] - (pos2[1] - pos1[1]) / 4) + ' ' +
	pos2[0] + ' ' + pos2[1];

    connector.setAttribute("d", curve);
    connector.setAttribute("stroke", colour);
    connector.setAttribute('display', 'inline');
}

function positionNote(note, phrase) {
    const annotationWin = document.getElementById('annotationWindow');
    const annotationText = document.getElementById('annotationText')
    const lineHeight = parseInt(getComputedStyle(annotationText).lineHeight);

    if (phrase.offsetTop * 2 < annotationWin.offsetHeight) {
	// Note goes below phrase
	phraseBottom = phrase.offsetTop + phrase.offsetHeight;
	const noteTop =  phraseBottom + lineHeight * 5;
	note.style.top = noteTop + 'px';
    } else {
	// Note goes above phrase
	const noteTop = phrase.offsetTop - 10 * lineHeight;

	note.style.top = noteTop + 'px';
    }
    note.style.left = Math.floor(phrase.offsetLeft * 2 / 3) + 'px';
}

function connectPhraseNote(idx) {
    const phrase = document.getElementsByClassName('phrase')[idx];
    const note = document.getElementsByClassName('note')[idx];

    if (note.offsetTop > phrase.offsetTop) {
	phraseMidBottom = computeBottomMidpoint(phrase);
	connectPositions(
	    [phraseMidBottom, phrase.offsetTop + phrase.offsetHeight],
	    [note.offsetLeft + note.offsetWidth / 2, note.offsetTop],
	    darkPalette[idx % darkPalette.length]);
    } else {
	phraseMidTop = computeTopMidpoint(phrase);
	connectPositions(
	    [phraseMidTop, phrase.offsetTop],
	    [note.offsetLeft + note.offsetWidth / 2, note.offsetTop + note.offsetHeight],
	    darkPalette[idx % darkPalette.length]);
    }
}

var activePhrase = -1;
var phraseSetByUser = false;
var latched = false;

function deactivatePhrase() {
    if (activePhrase != -1) {
	previousAnnotation = document.getElementsByClassName('note')[activePhrase];
	previousAnnotation.style.display = "none";
	previousPhrase = document.getElementsByClassName('phrase')[activePhrase];
	previousPhrase.style.outlineStyle = '';
	document.getElementById('connector').setAttribute('display', 'none');
	activePhrase = -1;
	latched = false;
	phraseSetByUser = false;
    }
}

function switchActivePhrase(idx) {
    deactivatePhrase();

    newAnnotation = document.getElementsByClassName('note')[idx];
    newAnnotation.style.display = 'block';
    newPhrase = document.getElementsByClassName('phrase')[idx];
    newPhrase.style.outlineStyle = 'solid';
    newPhrase.style.outlineWidth = 'thin';
    connectPhraseNote(idx);
    activePhrase = idx;
}

const palette = [
  '#FFB3BA', // Pastel Pink
  '#FFDFBA', // Pastel Orange
  '#FFFFBA', // Pastel Yellow
  '#BAFFC9', // Pastel Green
  '#BAE1FF', // Pastel Blue
  '#FFC3A0', // Pastel Peach
  '#D5AAFF', // Pastel Lavender
  '#FF677D', // Pastel Coral
  '#D4A5A5', // Pastel Rose
  '#C3BDDB'  // Pastel Indigo
];

const darkPalette = [
  '#6e4b4e',
  '#402c15',
  '#363616',
  '#223325',
  '#142430',
  '#3d3028',
  '#1f1826',
  '#361318',
  '#423030',
  '#2a2833'
];

var insidePhrase = false;
var insideNote = false;
var currentIdx = -1;

function addToCurrentPhrase(str) {
    const currentPhrase = document.getElementsByClassName('phrase')[currentIdx];
    currentPhrase.insertAdjacentText('beforeend', str);
}

function addToCurrentNote(str) {
    const currentNote = document.getElementsByClassName('note')[currentIdx];
    currentNote.insertAdjacentText('beforeend', str);
    if (activePhrase === currentIdx) {
	connectPhraseNote(currentIdx);
    }
}

function addToText(str) {
    str = str.replace('\*', '*');
    document.getElementById('annotationText').insertAdjacentText('beforeend', str);
}

function createNewPhrase() {
    currentIdx += 1;
    var newPhrase = document.createElement('span');
    newPhrase.className = 'phrase';
    newPhrase.style.backgroundColor = palette[currentIdx % palette.length];
    newPhrase.style.outlineColor = darkPalette[currentIdx % darkPalette.length];
    document.getElementById('annotationText').insertAdjacentElement('beforeend', newPhrase);
}

function makeDraggable(elt, moveCallback) {
    var startX = 0;
    var endX = 0;
    var startTop = 0;
    var startLeft = 0;

    elt.onpointerdown = startDrag;

    function startDrag(e) {
	e.preventDefault();
	startX = e.clientX;
	startY = e.clientY;
	startTop = elt.offsetTop;
	startLeft = elt.offsetLeft;
	document.onpointerup = endDrag;
	document.onpointermove = doDrag;
    }

    function doDrag(e) {
	const shiftX = e.clientX - startX;
	const shiftY = e.clientY - startY;

	elt.style.left = (startLeft + shiftX) + 'px';
	elt.style.top = (startTop + shiftY) + 'px';
	moveCallback();
    }

    function endDrag(e) {
	document.onpointerup = null;
	document.onpointermove = null;
    }
}

function createNewNote() {
    var newNote = document.createElement('div');
    newNote.className = 'note';
    newNote.style.backgroundColor = palette[currentIdx % palette.length];
    newNote.style.outlineColor = darkPalette[currentIdx % darkPalette.length];
    const lastPhrase = document.getElementsByClassName('phrase')[currentIdx];
    positionNote(newNote, lastPhrase);
    const thisIdx = currentIdx;
    makeDraggable(newNote, (e) => {connectPhraseNote(thisIdx)});
    newNote.addEventListener('click', (e) => {
	e.stopPropagation();
    })
    document.getElementById('annotationWindow').insertAdjacentElement('beforeend', newNote);
    const phrase = document.getElementsByClassName('phrase')[thisIdx];

    phrase.addEventListener('click', (e) => {
	e.stopPropagation();
	if (latched && activePhrase === thisIdx) {
	    latched = false;
	    phrase.style.outlineWidth = 'thin';
	} else {
	    switchActivePhrase(thisIdx);
	    phraseSetByUser = true;
	    latched = true;
	    phrase.style.outlineWidth = 'medium'
	}
    });
    phrase.addEventListener('mouseover', () => {
	if (! latched) {
	    switchActivePhrase(thisIdx);
	    phraseSetByUser = true;
	}
    });
    phrase.addEventListener('mouseout', () => {
	if (! latched) {
	    deactivatePhrase();
	}
    });

    if (! phraseSetByUser) {
	switchActivePhrase(currentIdx);
    }
}

function addInputChunk(chunk) {
    if (chunk === undefined || chunk.length === 0) {
	return;
    }

    if (insidePhrase) {
	const firstAst = chunk.indexOf('*');
	if (firstAst === -1) {
	    addToCurrentPhrase(chunk);
	    chunk = '';
	} else {
	    addToCurrentPhrase(chunk.substring(0, firstAst));
	    insidePhrase = false;
	    chunk = chunk.substring(firstAst + 1);
	}

	if (chunk.length === 0) {
	    return;
	}
    }

    if (insideNote) {
	const firstCloseAngle = chunk.indexOf('>');
	if (firstCloseAngle === -1) {
	    addToCurrentNote(chunk);
	    chunk = '';
	} else {
	    addToCurrentNote(chunk.substring(0, firstCloseAngle));
	    insideNote = false;
	    chunk = chunk.substring(firstCloseAngle + 1);
	}

	if (chunk.length === 0) {
	    return;
	}
    }

    const firstAst = chunk.indexOf('*');
    const firstOpenAngle = chunk.indexOf('<');

    if (! (firstAst === -1)) {
	if (firstOpenAngle === -1 || firstOpenAngle > firstAst) {
	    addToText(chunk.substring(0, firstAst));
	    createNewPhrase();
	    insidePhrase = true;
	    addInputChunk(chunk.substring(firstAst + 1));
	    return;
	}
    }

    if (! (firstOpenAngle === -1)) {
	addToText(chunk.substring(0, firstOpenAngle));
	createNewNote();
	insideNote = true;
	addInputChunk(chunk.substring(firstOpenAngle + 1));
	return;
    }

    addToText(chunk);
}

function clearAll() {
    document.getElementById('annotationText').replaceChildren();
    for (note of Array.from(document.getElementsByClassName('note'))) {
	note.remove();
    }
    activePhrase = -1;
    currentIdx = -1;
}

async function* getLines(stream) {
    curr = '';
    for await (chunk of stream) {
	chunk = curr + chunk;
	lines = chunk.split(/\r\n|\r|\n/);
	for (let i = 0; i < lines.length - 1; i ++) {
	    yield lines[i];
	}
	curr = lines[lines.length - 1];
    }
}

async function* getDeltas(stream) {
    currentEvent = '';

    for await (line of getLines(stream)) {
	if (line === '') {
	    if (currentEvent === '[DONE]') {
		break;
	    }
	    data = JSON.parse(currentEvent);
	    content = data['choices'][0]['delta']["content"];
	    if (content) {
		yield content;
	    }
	    currentEvent = '';
	} else {
	    currentEvent += line.match(/data: ?(.*)/)[1];
	}
    }
}

async function writeDeltas(stream) {
    for await (delta of getDeltas(stream)) {
	addInputChunk(delta);
    }
}

async function openAITextRequest(text) {
    const request = await fetch('https://api.openai.com/v1/chat/completions', {
	method: 'POST',
	headers: {
	    "Content-Type": "application/json",
	    "Authorization": "Bearer " + apiKey
	},
	body: JSON.stringify({
	    model: "gpt-4o-mini",
	    messages: [{
		"role": "system",
		"content": systemPrompt
	    }, {
		"role": "user",
		"content": text
	    }],
	    stream: true
	})
    });

    const stream = request.body.pipeThrough(new TextDecoderStream());

    writeDeltas(stream);
}

async function annotateClipboard() {
    text = await navigator.clipboard.readText();
    clearAll();
    openAITextRequest(text);
}

function downsampleFile(file) {
    return new Promise((resolve, reject) => {
	const hiddenImage = document.getElementById('hiddenImage');
	const hiddenCanvas = document.getElementById('hiddenCanvas');
	const fileReader = new FileReader();
	fileReader.onload = (e) => {
	    hiddenImage.src = e.target.result;
	};

	hiddenImage.onload = (e) => {
	    const h = hiddenImage.naturalHeight;
	    const w = hiddenImage.naturalWidth;
	    ctx = hiddenCanvas.getContext('2d');
	    if (h <= w) {
		const newWidth = w * 512 / h;
		hiddenCanvas.width = newWidth;
		hiddenCanvas.height = 512;
		ctx.drawImage(hiddenImage, 0, 0, newWidth, 512);
	    } else {
		const newHeight = h * 512 / w;
		hiddenCanvas.width = 512;
		hiddenCanvas.height = newHeight;
		ctx.drawImage(hiddenImage, 0, 0, 512, newHeight);
	    }
	    resolve(hiddenCanvas.toDataURL('image/jpeg'));
	};
	fileReader.readAsDataURL(file);
    });
}

async function annotateImage(file) {
    clearAll();
    downsampledString = await downsampleFile(file);

    const request = await fetch('https://api.openai.com/v1/chat/completions', {
	method: 'POST',
	headers: {
	    "Content-Type": "application/json",
	    "Authorization": "Bearer " + apiKey
	},
	body: JSON.stringify({
	    model: model,
	    messages: [{
		"role": "system",
		"content": systemPrompt
	    }, {
		"role": "user",
		"content": [{
		    "type": "image_url",
		    "image_url": {
			"url": downsampledString
		    }
		}]
	    }],
	    stream: true
	})
    });

    const stream = request.body.pipeThrough(new TextDecoderStream());
    writeDeltas(stream);
}

window.addEventListener('resize', () => {
    const phrases = document.getElementsByClassName('phrase');
    const notes = document.getElementsByClassName('note');
    for (i = 0; i < phrases.length; i ++) {
	positionNote(notes[i], phrases[i]);
    }

    if (activePhrase != -1) {
	connectPhraseNote(activePhrase);
    }
})
