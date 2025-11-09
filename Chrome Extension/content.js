(function () {
    'use strict';

    let CAPTURE_STATIC_IMAGE = false;

    const DEBUG = true;

    const SERVER_URL = "http://localhost:3005";
    const LOOP_INTERVAL_MS = 10;
    const POLL_INTERVAL_MS = 10;
    let lastSentData = "";

    let activeRequests = 0;
    const MAX_REQUESTS = 5;
    let pendingData = null;

    let currentSongTitle = "";
    let newSongFrameCounter = 0;
    let capturedSongImage = null;

    const ANALYZED_FREQ_RANGE = [47, 94];
    const CONSOLE_SCALE_MAX = 100;

    let audioContext = null;
    let analyser = null;
    let audioSource = null;
    let connectedVideoElement = null;
    let fullFrequencyDataArray = null;
    let lowerBin = 0;
    let upperBin = 0;
    let currentBassIntensity = 0;
    let animationFrameId = null;

    const PATHS = {
        RUNNING_PAUSE_ICON: "M6.5 3A1.5 1.5 0 005 4.5v15A1.5 1.5 0 006.5 21h2a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 008.5 3h-2Zm9 0A1.5 1.5 0 0014 4.5v15a1.5 1.5 0 001.5 1.5h2a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0017.5 3h-2Z",
        RUNNING_PLAY_ICON: "M5 4.623V19.38a1.5 1.5 0 002.26 1.29L22 12 7.26 3.33A1.5 1.5 0 005 4.623Z",
        SHUFFLE_ON: "M16.293 1.293a1 1 0 00-.001 1.415L18.585 5H17.21a7 7 0 00-5.823 3.118L6.95 14.774A5 5 0 012.79 17H2a1 1 0 000 2h.79a7 7 0 005.822-3.117l4.438-6.656A5 5 0 0117.21 7h1.376l-2.293 2.293a1 1 0 001.414 1.414L22.414 6l-4.707-4.707a1 1 0 00-1.414 0ZM2.789 5H2a1 1 0 000 2h.79a5 5 0 014.159 2.227l.647.97 1.202-1.802-.185-.277A7 7 0 002.789 5Zm13.504 8.293a1 1 0 00-.001 1.414L18.585 17H17.21a5 5 0 01-4.16-2.226l-.648-.972-1.202 1.803.186.278A7 7 0 0017.21 19h1.376l-2.293 2.294-.068.076a1 1 0 001.406 1.406l.076-.07L22.414 18l-4.707-4.707a1 1 0 00-1.414 0Z",
        SHUFFLE_OFF: "M16.293 13.293a1 1 0 011.414 0L22.414 18l-4.707 4.707a1 1 0 01-1.414-1.413L18.586 19H17.21a7.001 7.001 0 01-5.824-3.117l-.186-.278 1.202-1.803.648.972A5.001 5.001 0 0017.21 17h1.375l-2.293-2.293a1 1 0 010-1.414Zm0-12a1 1 0 011.414 0L22.414 6l-4.707 4.707a1 1 0 01-1.414-1.414L18.586 7H17.21a5 5 0 00-4.16 2.227l-4.438 6.656A7 7 0 012.79 19H2a1 1 0 010-2h.79a5 5 0 004.16-2.226l4.437-6.656A7 7 0 0117.21 5h1.375l-2.293-2.292a1 1 0 010-1.415ZM3 10.001a2 2 0 110 4 2 2 0 010-4Zm-.21-5a7 7 0 015.823 3.117l.185.277-1.202 1.803-.647-.971A5 5 0 002.79 7H2a1 1 0 010-2h.79Z",
        REPEAT_ALL: "M21 10a1 1 0 011 1v4a5 5 0 01-5 5H5.414l1.293 1.293a1 1 0 11-1.414 1.414L1.586 19l3.707-3.707a1 1 0 111.414 1.414L5.414 18H17a3 3 0 003-3v-4a1 1 0 011-1Zm-3.707-8.707a1 1 0 011.414 0L22.414 5l-3.707 3.707a1 1 0 11-1.414-1.414L18.586 6H7a3 3 0 00-3 3v4a1 1 0 01-2 0V9a5 5 0 015-5h11.586l-1.293-1.293a1 1 0 010-1.414ZM12 10a2 2 0 110 4 2 2 0 010-4Z",
        REPEAT_OFF: "M17.293 1.293a1 1 0 000 1.415L18.586 4H7a5 5 0 00-5 5v4a1 1 0 102 0V9a3 3 0 013-3h11.586l-1.293 1.293a1 1 0 001.414 1.415L22.414 5l-3.707-3.707a1 1 0 00-1.414 0ZM21 10a1 1 0 00-1 1v4a3 3 0 01-3 3H5.414l1.293-1.292a1.001 1.001 0 00-1.414-1.415L1.586 19l3.707 3.707a1 1 0 101.414-1.413L5.414 20H17a5 5 0 005-5v-4a1 1 0 00-1-1Z",
        REPEAT_ONE: "M17.293 1.293a1 1 0 000 1.415L18.586 4H7a5 5 0 00-5 5v4a1 1 0 102 0V9a3 3 0 013-3h11.586l-1.293 1.293a1 1 0 001.414 1.415L22.414 5l-3.707-3.707a1 1 0 00-1.414 0ZM13 15V8h-2.5a1 1 0 000 2h.5v5a1 1 0 002 0Zm8-5a1 1 0 00-1 1v4a3 3 0 01-3 3H5.414l1.293-1.292a1.001 1.001 0 00-1.414-1.415L1.586 19l3.707 3.707a1 1 0 101.414-1.413L5.414 20H17a5 5 0 005-5v-4a1 1 0 00-1-1Z"
    };

    function getElementPath(selector) {
        const el = document.querySelector(selector);
        return el ? el.getAttribute('d') : null;
    }

    function getButtonStates() {
        let running = 2, shuffle = 2, repeat = 2;
        const playPausePath = getElementPath("#play-pause-button > #button > yt-icon > span > div > svg > path");
        if (playPausePath === PATHS.RUNNING_PAUSE_ICON) running = 1;
        else if (playPausePath === PATHS.RUNNING_PLAY_ICON) running = 0;

        const shufflePath = getElementPath(".shuffle.style-scope.ytmusic-player-bar > #button > yt-icon > span > div > svg > path");
        if (shufflePath === PATHS.SHUFFLE_ON) shuffle = 1;
        else if (shufflePath === PATHS.SHUFFLE_OFF) shuffle = 0;

        const repeatPath = getElementPath(".repeat.style-scope.ytmusic-player-bar > #button > yt-icon > span > div > svg > path");
        if (repeatPath === PATHS.REPEAT_ALL) repeat = 1;
        else if (repeatPath === PATHS.REPEAT_ONE) repeat = 3;
        else if (repeatPath === PATHS.REPEAT_OFF) repeat = 0;

        return { running, shuffle, repeat };
    }

    function analyzeFrequencyRange() {
        if (!analyser || (audioContext && audioContext.state === 'suspended')) {
            animationFrameId = requestAnimationFrame(analyzeFrequencyRange);
            return;
        }
        analyser.getByteFrequencyData(fullFrequencyDataArray);
        let totalLoudness = 0;
        for (let i = lowerBin; i <= upperBin; i++) {
            totalLoudness += fullFrequencyDataArray[i];
        }
        const rangeSize = (upperBin - lowerBin) + 1;
        const averageLoudness = rangeSize > 0 ? (totalLoudness / rangeSize) : 0;
        const scaledValue = (averageLoudness / 255) * CONSOLE_SCALE_MAX;
        currentBassIntensity = scaledValue;
        if (typeof analyzeFrequencyRange.lastBass !== "undefined") {
            if (Math.abs(currentBassIntensity - analyzeFrequencyRange.lastBass) < 0.0001) {
                currentBassIntensity = Math.max(0, currentBassIntensity - 0.01);
            }
        }
        analyzeFrequencyRange.lastBass = currentBassIntensity;
        animationFrameId = requestAnimationFrame(analyzeFrequencyRange);
    }

    function handlePlay() {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }

    function handlePause() {
        if (audioContext && audioContext.state === 'running') {
            audioContext.suspend();
            currentBassIntensity = 0;
        }
    }

    function initializeAudioAnalysis(videoElement) {
        if (audioSource) {
            audioSource.disconnect();
            audioSource = null;
        }
        try {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            audioSource = audioContext.createMediaElementSource(videoElement);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            audioSource.connect(analyser);
            analyser.connect(audioContext.destination);
            const frequencyBinCount = analyser.frequencyBinCount;
            const sampleRate = audioContext.sampleRate;
            const hzToBin = (hz) => Math.round(hz / (sampleRate / analyser.fftSize));
            lowerBin = hzToBin(ANALYZED_FREQ_RANGE[0]);
            upperBin = hzToBin(ANALYZED_FREQ_RANGE[1]);
            fullFrequencyDataArray = new Uint8Array(frequencyBinCount);
            videoElement.removeEventListener('playing', handlePlay);
            videoElement.removeEventListener('pause', handlePause);
            videoElement.addEventListener('playing', handlePlay);
            videoElement.addEventListener('pause', handlePause);
            if (!videoElement.paused) {
                handlePlay();
            } else {
                handlePause();
            }
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(analyzeFrequencyRange);
        } catch (e) {
            audioContext = null;
            analyser = null;
            audioSource = null;
            connectedVideoElement = null;
        }
    }

    function setupAudioAnalysis() {
        const videoElement = document.querySelector('video');
        if (videoElement && videoElement !== connectedVideoElement) {
            connectedVideoElement = videoElement;
            initializeAudioAnalysis(videoElement);
        } else if (!videoElement && connectedVideoElement) {
            connectedVideoElement = null;
        }
    }

    function blobToBase64(videoElement) {
        return new Promise((resolve, reject) => {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = videoElement.videoWidth;
                canvas.height = videoElement.videoHeight;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                const base64 = canvas.toDataURL("image/jpeg", 0.5);
                resolve(base64);
            } catch (e) {
                reject(e);
            }
        });
    }
	function trySendUpdate() {
		if (pendingData === null || activeRequests >= MAX_REQUESTS) {
			return;
		}

		const dataToSend = pendingData;
		lastSentData = dataToSend;
		pendingData = null;
		activeRequests++;

		fetch(`${SERVER_URL}/update`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: dataToSend,
		})
		.then(() => { activeRequests--; trySendUpdate(); })
		.catch(() => { lastSentData = ""; activeRequests--; trySendUpdate(); });
	}


    async function mainLoop() {
        setupAudioAnalysis();
        try {
            const titleEl = document.querySelector("#layout ytmusic-player-bar yt-formatted-string.title");
            const subtitleEl = document.querySelector("#layout ytmusic-player-bar .subtitle a");
            const timeEl = document.querySelector("#left-controls > span");

            if (!titleEl || !subtitleEl || !timeEl) return;

            const title = titleEl.textContent.trim();

            if (title && title !== currentSongTitle) {
                currentSongTitle = title;
                newSongFrameCounter = 0;
                capturedSongImage = null;
            }

            if (currentSongTitle) newSongFrameCounter++;

            let imageForPayload = null;
            if (CAPTURE_STATIC_IMAGE) {
                if (newSongFrameCounter === 5 && !capturedSongImage) {
                    const imageEl = document.querySelector("#thumbnail img");
                    let tempImage = null;
                    if (imageEl && imageEl.src && !imageEl.src.startsWith("data:image/gif")) {
                        tempImage = imageEl.src;
                    } else {
                        const videoPlayerEl = document.querySelector("#movie_player > div.html5-video-container > video");
                        if (videoPlayerEl && videoPlayerEl.src.startsWith("blob:")) {
                            try { tempImage = await blobToBase64(videoPlayerEl); } catch {}
                        }
                    }
                    if (tempImage) capturedSongImage = tempImage;
                }
                imageForPayload = capturedSongImage;
            } else {
                const imageEl = document.querySelector("#thumbnail img");
                let tempImage = null;
                if (imageEl && imageEl.src && !imageEl.src.startsWith("data:image/gif")) {
                    tempImage = imageEl.src;
                } else {
                    const videoPlayerEl = document.querySelector("#movie_player > div.html5-video-container > video");
                    if (videoPlayerEl && videoPlayerEl.src.startsWith("blob:")) {
                        try { tempImage = await blobToBase64(videoPlayerEl); } catch {}
                    }
                }
                imageForPayload = tempImage;
            }

            const buttonStates = getButtonStates();
            const payload = {
                title: title,
                subtitle: subtitleEl.textContent.trim(),
                time: timeEl.textContent.trim(),
                image: imageForPayload,
                ...buttonStates,
                bassIntensity: currentBassIntensity
            };

            const currentDataString = JSON.stringify(payload);

            if (currentDataString !== lastSentData) {
                pendingData = currentDataString;
                trySendUpdate();
            }
        } catch (e) {
        }
    }

	function pollForCommands() {
		fetch(`${SERVER_URL}/poll`, { method: "GET" })
			.then(response => response.json())
			.then(data => {
				if (data && data.action) {
					executeCommand(data);
				}
			})
			.catch(() => {})
			.finally(() => {
				setTimeout(pollForCommands, POLL_INTERVAL_MS);
			});
	}

    function executeCommand(data) {
        try {
            switch (data.action) {
                case 'playPause': document.getElementById('play-pause-button')?.click(); break;
                case 'next': document.querySelector('.next-button')?.click(); break;
                case 'prev': document.querySelector('.previous-button')?.click(); break;
                case 'toggleShuffle': document.querySelector('.shuffle.style-scope.ytmusic-player-bar')?.click(); break;
                case 'toggleRepeat': document.querySelector('.repeat.style-scope.ytmusic-player-bar')?.click(); break;
                case 'setStaticImage':
                    CAPTURE_STATIC_IMAGE = data.value;
                    currentSongTitle = "";
                    capturedSongImage = null;
                    break;
                case 'seek':
                    var videoElement = document.querySelector('video');
                    if (videoElement && typeof data.value === 'number' && !isNaN(videoElement.duration)) {
                        videoElement.currentTime = videoElement.duration * data.value;
                    }
                    break;
            }
        } catch (e) {
        }
    }

    setInterval(mainLoop, LOOP_INTERVAL_MS);
    pollForCommands();

})();