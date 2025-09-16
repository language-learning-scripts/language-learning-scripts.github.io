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

class LineTransformer extends TransformStream {
    constructor() {
	super({
	    transform: (chunk, controller) => {
		this.buffer += chunk;
		const lines = this.buffer.split(/\r\n|\r|\n/);
		for (const l of lines.slice(0, -1)) {
		    controller.enqueue(l);
		}

		this.buffer = lines[lines.length - 1];
	    }
	});
	this.buffer = "";
    }
}

class EventTransformer extends TransformStream {
    constructor() {
	super({
	    transform: (chunk, controller) => {
		if (chunk.length == 0) {
		    controller.enqueue({
			eventName: this.eventName,
			data: this.data
		    });
		    this.data = "";
		    this.eventName = "";
		} else if (chunk.startsWith("event:")) {
		    this.eventName = chunk.match(/event: ?(.*)/)[1];
		} else if (chunk.startsWith("data:")) {
		    this.data += chunk.match(/data: ?(.*)/)[1];
		}
	    }
	});
	this.eventName = "";
	this.data = "";
    }
}

class DeltaTransformer extends TransformStream {
    constructor() {
	super({
	    transform(chunk, controller) {
		if (chunk.data == "[DONE]") {
		    controller.terminate()
		} else {
		    const decodedMessage = JSON.parse(chunk.data);
		    if (decodedMessage.object == "chat.completion.chunk") {
			controller.enqueue(decodedMessage.choices[0].delta.content);
			
		    }
		}
	    }
	}) 
   }
}

class TTSConnection {
    constructor() {
	this.model = "gpt-4o-mini-tts";
	this.apiKey = openaiApiKey;
    }

    async generateAudio(prompt, text) {
	const response = await fetch("https://api.openai.com/v1/audio/speech", {
	    method: "POST",
	    headers: {
		"Content-Type": "application/json"
	    },
	    body: JSON.stringify({
		"input": text,
		"voice": "coral",
		"instructions": prompt,
		"model": this.model,
		"response_format": "pcm"
	    })
	});

	const responseData = await response.json();
	const base64Audio = responseData.candidates[0].content.parts[0].inlineData.data;
	const audioData = Uint8Array.fromBase64(base64Audio);

	return audioData;
    }
}

class ChatConnection {
    constructor() {
	this.model = "gpt-4.1-nano";
	this.audioModel = "gpt-4o-mini-audio-preview";
	this.apiKey = openaiApiKey;
    }

    requestOpenAICompletion(request) {
	return fetch("https://api.openai.com/v1/chat/completions", {
	    method: "POST",
	    headers: {
		"Content-Type": "application/json",
		"Authorization": `Bearer ${this.apiKey}`		
	    },
	    body: JSON.stringify(request)
	})
    }

    // getUrl(request) {
    // 	return `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:${request}?key=${googleApiKey}`;
    // }

    async simpleRequest(prompt, temperature=1.0) {
	const response = await this.requestOpenAICompletion({
	    "model": this.model,
	    "messages": [{
		"content": prompt,
		"role": "user"
	    }],
	    "temperature": temperature
	});
	    
	const responseData = await response.json();
	return responseData.choices[0].message.content;
    }

    async streamRequest(prompt, temperature=1.0) {
	const response = await this.requestOpenAICompletion({
	    "model": this.model,
	    "messages": [{
		"content": prompt,
		"role": "user"
	    }],
	    "temperature": temperature,
	    "stream": true
	});
	return response.body
	    .pipeThrough(new TextDecoderStream())
	    .pipeThrough(new LineTransformer())
	    .pipeThrough(new EventTransformer())
	    .pipeThrough(new DeltaTransformer());
    }

    async formatAudioMessage(prompt, wavData) {
	const buff = await wavData.arrayBuffer();
	const audioBytes = new Uint8Array(buff);
	return [{
	    "role": "user",
	    "content": [
		{
		    "type": "text",
		    "text": prompt
		},
		{
		    "type": "input_audio",
		    "input_audio": {
			"format": "wav",
			"data": audioBytes.toBase64()
		    }
		}
	    ]
	}];
    }

    async audioStreamRequest(prompt, audioData, mimeType) {
	const audioMessage = await this.formatAudioMessage(prompt, audioData);
	const response = await this.requestOpenAICompletion({
	    "model": this.audioModel,
	    "messages": audioMessage,
	    "stream": true
	});
	return response.body
	    .pipeThrough(new TextDecoderStream())
	    .pipeThrough(new LineTransformer())
	    .pipeThrough(new EventTransformer())
	    .pipeThrough(new DeltaTransformer());
    }
}
