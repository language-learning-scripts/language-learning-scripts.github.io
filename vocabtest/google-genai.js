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

class TTSConnection {
    constructor(apiKey) {
	this.model = model;
    }
}

class ChatConnection {
    constructor() {
	this.model = "gemini-2.0-flash";
	this.systemPrompt = "Format your answer as HTML."
    }

    getUrl(request) {
	return `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:${request}?key=${googleApiKey}`;
    }

    async simpleRequest(prompt) {
	const response = await fetch(this.getUrl("generateContent"), {
	    method: "POST",
	    headers: {
		"Content-Type": "application/json"
	    },
	    body: JSON.stringify({
		"contents": [{
		    "parts": [{"text": prompt}]
		}]
	    })
	});
	const response_data = await response.json();
	return response_data.candidates[0].content.parts[0].text;
    }

    async streamRequest(prompt) {
	const response = await fetch(this.getUrl("streamGenerateContent"), {
	    method: "POST",
	    headers: {
		"Content-Type": "application/json"
	    },
	    body: JSON.stringify({
		"contents": [{
		    "parts": [{"text": prompt}]
		}]
	    })
	});
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
	const response = await fetch(this.getUrl("streamGenerateContent"), {
	    method: "POST",
	    headers: {
		"Content-Type": "application/json"
	    },
	    body: JSON.stringify({
		"contents": [{
		    "parts": [
			{
			    "text": prompt,			
			},
			{
			    "file_data": fileData
			}
		    ]
		}]
	    })
	});
	return response.body
	  .pipeThrough(new TextDecoderStream())
	  .pipeThrough(jsonListTransformer());
    }
}
