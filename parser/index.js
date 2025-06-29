const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { execFile } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
require('dotenv').config();

const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 5002;
app.use(cors());
app.use(express.json());
const upload = multer({ dest: 'uploads/' });
const ASSEMBLYAI_KEY = process.env.ASSEMBLYAI_API_KEY;
const transcriptionStore = {};
function extractAudio(videoPath, audioOutputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .on('end', () => resolve(audioOutputPath))
      .on('error', reject)
      .save(audioOutputPath);
  });
}
async function uploadAudioToAssemblyAI(audioPath) {
  const audioStream = fs.createReadStream(audioPath);
  const res = await axios.post('https://api.assemblyai.com/v2/upload', audioStream, {
    headers: {
      authorization: ASSEMBLYAI_KEY,
      'transfer-encoding': 'chunked',
    },
  });
  return res.data.upload_url;
}
async function requestTranscription(audioUrl) {
  const res = await axios.post(
    'https://api.assemblyai.com/v2/transcript',
    {
      audio_url: audioUrl,
      speaker_labels: true,
    },
    {
      headers: { authorization: ASSEMBLYAI_KEY },
    }
  );
  return res.data.id;
}
async function getTranscription(id) {
  const res = await axios.get(`https://api.assemblyai.com/v2/transcript/${id}`, {
    headers: { authorization: ASSEMBLYAI_KEY },
  });
  return res.data;
}
app.post('/upload', upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No video file uploaded' });
  const videoPath = req.file.path;
  const audioPath = path.join('uploads', `${req.file.filename}.mp3`);
  try {
    await extractAudio(videoPath, audioPath);
    const audioUrl = await uploadAudioToAssemblyAI(audioPath);
    const transcriptId = await requestTranscription(audioUrl);
    transcriptionStore[transcriptId] = { videoPath, audioPath };
    res.json({ transcriptId });
  } catch (error) {
    console.error('Error processing video:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});
app.get('/transcript/:id', async (req, res) => {
  const { id } = req.params;
  if (!id || id === 'undefined') {
    return res.status(400).json({ error: 'Invalid or missing transcript ID' });
  }
  try {
    const transcription = await getTranscription(id);
    if (transcription.status !== 'completed') {
      return res.json({ status: transcription.status });
    }
    const mappedUtterances = transcription.utterances;
    const tempUttFile = path.join(__dirname, `tmp_${id}.json`);
    fs.writeFileSync(tempUttFile, JSON.stringify(mappedUtterances), 'utf8');
    execFile("python3", ["speaker_name_detection.py", tempUttFile], (error, stdout, stderr) => {
      fs.unlinkSync(tempUttFile);
      if (error) {
        console.error("Python NLP script error:", stderr);
        return res.json({ status: 'completed', utterances: mappedUtterances });
      }
      let nameMap = {};
      try {
        nameMap = JSON.parse(stdout);
      } catch (parseErr) {
        console.error("Failed to parse NLP output:", parseErr);
      }
      const finalUtterances = mappedUtterances.map(utt => ({
        ...utt,
        speaker: nameMap[utt.speaker] || utt.speaker,
      }));
      res.json({ status: 'completed', utterances: finalUtterances });
    });
  } catch (error) {
    console.error('Error retrieving transcription:', error);
    res.status(500).json({ error: 'Failed to get transcription' });
  }
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});










