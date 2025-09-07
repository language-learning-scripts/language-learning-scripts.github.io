function recordAudioFromStream(stream, stopButton) {
    return new Promise((resolve, reject) => {
	mediaRecorder = new MediaRecorder(stream);
	stopButton.onclick = () => {
	    console.log("stop button was pushed");
	    mediaRecorder.stop();
	};
	chunks = [];
	mediaRecorder.ondataavailable = e => {
	    if (e.data.size > 0) {
		chunks.push(e.data);
	    }
	};
	mediaRecorder.onstop = () => {
	    console.log("media stream stopped, trying to return it")
	    const blob = new Blob(chunks, { type: "audio/webm" });
	    resolve(blob);
	};
	mediaRecorder.start();
    })
}

class Recording {
    async start() {
	const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
	self.mediaRecorder = new MediaRecorder(stream);
	self.chunks = [];
	self.mediaRecorder.ondataavailable = e => {
	    if (e.data.size > 0) {
		self.chunks.push(e.data);
	    }
	};
	self.mediaRecorder.start();
    }

    stop() {
	return new Promise((resolve, reject) => {
	    self.mediaRecorder.onstop = (e) => {
		const webmData = new Blob(chunks, { type: "audio/webm" });
		blobToWav(webmData).then((wavData) => {
		    resolve(wavData)
		});
	    };

	    self.mediaRecorder.stop();
	    for (track of self.mediaRecorder.getAudio)
	});
    }

    cancel() {
	self.mediaRecorder.stop();
    }
}

async function blobToWav(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const numChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numChannels * 2;
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);

  // Write WAV header
  function writeString(offset, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  let offset = 0;
  writeString(offset, "RIFF"); offset += 4;
  view.setUint32(offset, 36 + length, true); offset += 4;
  writeString(offset, "WAVE"); offset += 4;
  writeString(offset, "fmt "); offset += 4;
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, 1, true); offset += 2;
  view.setUint16(offset, numChannels, true); offset += 2;
  view.setUint32(offset, audioBuffer.sampleRate, true); offset += 4;
  view.setUint32(offset, audioBuffer.sampleRate * numChannels * 2, true); offset += 4;
  view.setUint16(offset, numChannels * 2, true); offset += 2;
  view.setUint16(offset, 16, true); offset += 2;
  writeString(offset, "data"); offset += 4;
  view.setUint32(offset, length, true); offset += 4;

  // Interleave samples
  const channels = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }
  let pos = offset;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      pos += 2;
    }
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function playPCM(pcm, sampleRate = 24000) {
    const audioCtx = new AudioContext();

    // Convert Uint8Array → Float32Array (normalize to [-1, 1])
    const float32 = new Float32Array(pcm.length / 2);
    const dv = new DataView(pcm.buffer)
    for (let i = 0; i < float32.length; i++) {
	// Little-endian 16-bit PCM
	float32[i] = dv.getInt16(i * 2, true) / 0x8000;
    }

    // Create AudioBuffer
    const buffer = audioCtx.createBuffer(1, float32.length, sampleRate);
    buffer.getChannelData(0).set(float32);

    // Play it
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start();
    return new Promise((resolve, reject) => {
	source.onended = (e) => {
	    resolve();
	};
    })
}
