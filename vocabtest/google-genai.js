function jsonListTransformer() {
    return new TransformStream({
	transform(chunk, controller) {
	    hopefullyValidJSON = "[" + chunk.toString().slice(1);
	    if (hopefullyValidJSON.charAt(hopefullyValidJSON.length - 1) != "]") {
		hopefullyValidJSON += "]";
	    }
	    try {
		const list = JSON.parse(hopefullyValidJSON);
		for (elt of list) {
		    controller.enqueue(elt.candidates[0].content.parts[0].text);
		}
	    } catch(error) {
		console.log(`Could not parse ${hopefullyValidJSON} as valid JSON. Skipping.`)
	    }
	}
    });
}

function getUrl(model, request) {
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:${request}?key=${googleApiKey}`;
}

function dictIsEmpty(dict) {
    for (const prop in dict) {
	return false;
    }
    return true;
}

async function genericGoogleRequest(model, endpoint, contentParts, config) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${endpoint}?key=${googleApiKey}`;

    var request = {
	"contents": [{
	    "parts": contentParts
	}],
	"model": model
    };
    if (! dictIsEmpty(config)) {
	request["generationConfig"] = config;
    }
    
    const response = await fetch(url, {
	method: "POST",
	headers: {
	    "Content-Type": "application/json"
	},
	body: JSON.stringify(request)
    });

    if (! response.ok) {
	body = await response.json();
	console.log(body);
	alert(`Google request failed: ${body.error.message}`);
	throw Error(`Google request failed: ${body.error.message}`);
    }

    return response;
}


class TTSConnection {
    constructor() {
	this.model = "gemini-2.5-flash-preview-tts";
    }

    async generateAudio(prompt) {
	const response = await genericGoogleRequest(this.model, "generateContent", [{"text": prompt}], {
	    "responseModalities": ["AUDIO"],
	    "speechConfig": {
		"voiceConfig": {
		    "prebuiltVoiceConfig": {
			"voiceName": "Kore"
		    }
		}
	    }
	});
	// const response = await fetch(getUrl(this.model, "generateContent"), {
	//     method: "POST",
	//     headers: {
	// 	"Content-Type": "application/json"
	//     },
	//     body: JSON.stringify({
	// 	"contents": [{
	// 	    "parts": [{
	// 		"text": prompt
	// 	    }]
	// 	}],
	// 	"generationConfig": {
	// 	    "responseModalities": ["AUDIO"],
	// 	    "speechConfig": {
	// 		"voiceConfig": {
	// 		    "prebuiltVoiceConfig": {
	// 			"voiceName": "Kore"
	// 		    }
	// 		}
	// 	    }
	// 	},
	// 	"model": this.model
	//     })
	// });

	const responseData = await response.json();
	const base64Audio = responseData.candidates[0].content.parts[0].inlineData.data;
	const audioData = Uint8Array.fromBase64(base64Audio);

	return audioData;
    }
}

class ChatConnection {
    constructor() {
	this.model = "gemini-2.0-flash";
	this.systemPrompt = "Format your answer as HTML."
    }

    // getUrl(request) {
    // 	return `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:${request}?key=${googleApiKey}`;
    // }


    async simpleRequest(prompt) {
	const response = await genericGoogleRequest(this.model, "generateContent", [{"text": prompt}], {});
	// const response = await fetch(getUrl(this.model, "generateContent"), {
	//     method: "POST",
	//     headers: {
	// 	"Content-Type": "application/json"
	//     },
	//     body: JSON.stringify({
	// 	"contents": [{
	// 	    "parts": [{"text": prompt}]
	// 	}]
	//     })
	// });
	// if (! response.ok) {
	//     alert(`Simple request failed: ${response.statusText}`);
	//     return null;
	// }
	const response_data = await response.json();
	return response_data.candidates[0].content.parts[0].text;
    }

    async streamRequest(prompt) {
	const response = await genericGoogleRequest(this.model, "streamGenerateContent", [{"text": prompt}], {});
	// const response = await fetch(getUrl(this.model, "streamGenerateContent"), {
	//     method: "POST",
	//     headers: {
	// 	"Content-Type": "application/json"
	//     },
	//     body: JSON.stringify({
	// 	"contents": [{
	// 	    "parts": [{"text": prompt}]
	// 	}]
	//     })
	// });
	// if (! response.ok) {
	//     alert(`Stream request failed: ${response.statusText}`);
	//     return null;
	// }

	return response.body
	  .pipeThrough(new TextDecoderStream())
	  .pipeThrough(jsonListTransformer());
    }

    async uploadData(data, filename, mimeType) {
	const response = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${googleApiKey}`, {
	    method: "POST",
	    headers: {
		"X-Goog-Upload-Protocol": "resumable",
		"X-Goog-Upload-Command": "start",
		"X-Goog-Upload-Header-Content-Length": data.size,
		"X-Goog-Upload.Header-Content-Type": mimeType,
		"Content-Type": "application/json"
	    },
	    body: JSON.stringify({
		"file": {
		    "display_name": filename
		}
	    })
	});
	if (! response.ok) {
	    alert(`Upload request failed: ${response.statusText}`);
	    return null;
	}

	const uploadUrl = response.headers.get("X-Goog-Upload-Url");

	const response2 = await fetch(uploadUrl, {
	    method: "POST",
	    headers: {
		"Content-Length": data.size,
		"X-Goog-Upload-Offset": 0,
		"X-Goog-Upload-Command": "upload, finalize"
	    },
	    body: data
	});

	const responseData = await response2.json();
	return {
	    "file_uri": responseData.file.uri,
	    "mime_type": responseData.file.mimeType
	};
    }

    async audioStreamRequest(prompt, audioData, mimeType) {
	const fileData = await this.uploadData(audioData, "audio", mimeType);
	const response = await genericGoogleRequest(this.model, "streamGenerateContent", [{"text": prompt}, {"file_data": fileData}], {});
	// const response = await fetch(getUrl(this.model, "streamGenerateContent"), {
	//     method: "POST",
	//     headers: {
	// 	"Content-Type": "application/json"
	//     },
	//     body: JSON.stringify({
	// 	"contents": [{
	// 	    "parts": [
	// 		{
	// 		    "text": prompt,
	// 		},
	// 		{
	// 		    "file_data": fileData
	// 		}
	// 	    ]
	// 	}]
	//     })
	// });
	// if (! response.ok) {
	//     alert(`Audio request failed: ${response.statusText}`);
	//     return null;
	// }

	return response.body
	  .pipeThrough(new TextDecoderStream())
	  .pipeThrough(jsonListTransformer());
    }
}
