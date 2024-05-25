import { useState } from 'react';
import { transcribeAudio } from '../utils/api';

const AudioRecorder = () => {
  const [recording, setRecording] = useState(false);

  const submitAudio = async (audio: any) => {
    console.log(`transcribing audio:`);
    console.log(audio);
    const res = await transcribeAudio(audio)
      .then(({ data }) => {
        console.log(data)
      })
      .catch((err) => {
        console.log(err)
      })
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        audioBitsPerSecond: 12800,
      });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = event => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const audioURL = URL.createObjectURL(blob);
        console.log("Recorded audio URL:", audioURL);
        const audio = new Audio(audioURL);
        audio.play();
        const formData = new FormData();
        formData.append('audio', blob);
        fetch(`${process.env.REACT_APP_API_HOST}/api/thread/transcribeAudio`, {
            method: 'POST',
            body: formData,
          }).then(data => {
            console.log('Upload successful:', data);
          })
          .catch(error => {
            console.error('Error uploading audio:', error);
          });
      };

      mediaRecorder.start();

      setTimeout(() => {
        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());
        setRecording(false);
      }, 5000);

      setRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  return (
    <div>
      <button onClick={startRecording} disabled={recording}>
        {recording ? 'Recording...' : 'Start Recording'}
      </button>
    </div>
  );
};

export default AudioRecorder;