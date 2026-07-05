import { useState, useRef, useCallback, useEffect } from 'react';
// --- MODIFIED --- Import from the correct community plugin package
import { VoiceRecorder } from 'capacitor-voice-recorder';

// --- This visualizer function is for the stylish, blended audio graph ---
const visualizer = (stream, canvasRef) => {
  if (!stream || !canvasRef.current) return;

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);

  analyser.fftSize = 256;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const canvas = canvasRef.current;
  const canvasCtx = canvas.getContext('2d');
  let animationFrameId;

  const drawRoundedBar = (x, y, w, h, r) => {
      canvasCtx.beginPath();
      canvasCtx.moveTo(x + r, y);
      canvasCtx.lineTo(x + w - r, y);
      canvasCtx.quadraticCurveTo(x + w, y, x + w, y + r);
      canvasCtx.lineTo(x + w, y + h);
      canvasCtx.lineTo(x, y + h);
      canvasCtx.lineTo(x, y + r);
      canvasCtx.quadraticCurveTo(x, y, x + r, y);
      canvasCtx.closePath();
      canvasCtx.fill();
  };

  const draw = () => {
    animationFrameId = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);

    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = canvas.width / (bufferLength * 1.5);
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] * 0.75;

      const gradient = canvasCtx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
      gradient.addColorStop(0, '#a855f7');
      gradient.addColorStop(0.7, '#ec4899');
      gradient.addColorStop(1, '#ec4899');
      canvasCtx.fillStyle = gradient;

      drawRoundedBar(x, canvas.height - barHeight, barWidth, barHeight, 4);

      x += barWidth + 4;
    }
  };

  draw();

  return () => {
    cancelAnimationFrame(animationFrameId);
    source.disconnect();
    if (audioContext.state !== 'closed') {
      audioContext.close();
    }
  };
};


export const useVoiceRecorder = (canvasRef) => {
  const [status, setStatus] = useState('idle');
  const [mediaBlobUrl, setMediaBlobUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  // This function now uses the correct Capacitor plugin for permissions
  const startRecording = useCallback(async () => {
    try {
      // 1. Check for native permission first
      const permissionResult = await VoiceRecorder.requestAudioRecordingPermission();
      if (!permissionResult.value) {
        alert('Microphone permission is required to record audio. Please grant it in your app settings.');
        return;
      }
      
      // 2. If permission is granted, proceed with web API logic
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        setStatus('recording');
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
        mediaRecorderRef.current.ondataavailable = event => {
          audioChunksRef.current.push(event.data);
        };
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setAudioBlob(blob);
          setMediaBlobUrl(url);
          setStatus('stopped');
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        };
        mediaRecorderRef.current.start();
      }
    } catch (err) {
      console.error("Error starting recording:", err);
      alert("Could not start recording. Please ensure your microphone is available.");
      setStatus('idle');
    }
  }, []);

  useEffect(() => {
    let stopVisualizer;
    if (status === 'recording' && streamRef.current && canvasRef.current) {
      stopVisualizer = visualizer(streamRef.current, canvasRef);
    }
    return () => {
      if (stopVisualizer) {
        stopVisualizer();
      }
    };
  }, [status, canvasRef]);


  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, [status]);

  const clearBlobUrl = useCallback(() => {
    if (mediaBlobUrl) {
      URL.revokeObjectURL(mediaBlobUrl);
    }
    setMediaBlobUrl(null);
    setAudioBlob(null);
    setStatus('idle');
  }, [mediaBlobUrl]);

  return { status, startRecording, stopRecording, clearBlobUrl, mediaBlobUrl, audioBlob };
};