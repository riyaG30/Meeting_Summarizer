import React, { useState } from "react";
import { TextArea, Button, DatePicker, DatePickerInput } from "@carbon/react";
import { Add } from "@carbon/icons-react";
import { wxai } from "./api/scrum";
import * as pdfjsLib from "pdfjs-dist";
import { useParsed } from "../../context/ParsedContext";
import mammoth from "mammoth";
import "./Upload.scss";
import { GlobalWorkerOptions } from "pdfjs-dist/build/pdf";

import Loading from "../Loading/Loading";

import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function cleanAndParseStandupText(rawText) {
  rawText = rawText.replace(/’/g, "'").replace(/“|”/g, '"');
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const items = [];
  let currentUser = null;
  let completed_tasks = null;
  let todo_tasks = null;
  let blockers = null;

  const commitCurrent = () => {
    if (
      !currentUser ||
      completed_tasks === null ||
      todo_tasks === null ||
      blockers === null
    ) {
      throw new Error(`Missing field(s) for user: ${currentUser || "Unknown"}`);
    }
    items.push({
      user: currentUser,
      completed_tasks: completed_tasks.trim(),
      todo_tasks: todo_tasks.trim(),
      blockers: blockers.trim() || "None",
    });
  };

  const yesterdayRegex = /^yesterday['’]s work:/i;
  const todayRegex = /^today['’]s plan:/i;
  const blockersRegex = /^blockers:/i;

  for (let line of lines) {
    if (
      !yesterdayRegex.test(line) &&
      !todayRegex.test(line) &&
      !blockersRegex.test(line)
    ) {
      if (currentUser !== null) commitCurrent();
      currentUser = line;
      completed_tasks = null;
      todo_tasks = null;
      blockers = null;
    } else if (yesterdayRegex.test(line)) {
      completed_tasks = line.replace(yesterdayRegex, "").trim();
    } else if (todayRegex.test(line)) {
      todo_tasks = line.replace(todayRegex, "").trim();
    } else if (blockersRegex.test(line)) {
      blockers = line.replace(blockersRegex, "").trim();
    } else {
      throw new Error(`Unexpected line format: "${line}"`);
    }
  }

  if (currentUser !== null) commitCurrent();
  return { items };
}

const Upload = () => {
  const [transcriptText, setTranscriptText] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const { setParsedData, setIsProcessing } = useParsed();
  const [isTranscribing, setIsTranscribing] = useState(false);

  const [transcript, setTranscript] = useState([]);

  //const {token, setToken}=useContext(AuthContext);
  //console.log(token);

  const extractTextFromPDF = async (file) => {
    setIsProcessingFile(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const typedArray = new Uint8Array(reader.result);
      const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item) => item.str).join(" ") + "\n";
      }
      setTranscriptText(text);
      setIsProcessingFile(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const extractTextFromDoc = async (file) => {
    setIsProcessingFile(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const arrayBuffer = reader.result;
      const result = await mammoth.extractRawText({ arrayBuffer });
      setTranscriptText(result.value.trim());
      setIsProcessingFile(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleTranscriptChange = (event) => {
    setPastedText(event.target.value);
    setTranscriptText(event.target.value);
  };

  const handleDateChange = (selectedDates) => {
    setSelectedDate(selectedDates[0]);
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    setUploadedFiles(files);
    setTranscriptText("");
    setUploadedFiles(files);
    setTranscriptText("");
  
    await processFiles(files);
  
  };

  const videoUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setTranscript([]);
    setTranscriptText("");
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("video", file);

      const uploadRes = await fetch("http://localhost:5002/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      const { transcriptId } = await uploadRes.json();
      if (!transcriptId) throw new Error("Transcript ID missing");

      let result,
        attempts = 0,
        maxAttempts = 100;
      do {
        await new Promise((r) => setTimeout(r, 5000));
        const res = await fetch(
          `http://localhost:5002/transcript/${transcriptId}`
        );
        if (!res.ok) throw new Error("Failed to fetch transcript");
        result = await res.json();
        attempts++;
        if (attempts > maxAttempts) throw new Error("Transcription timed out");
      } while (result.status !== "completed");

      const utterances = result.utterances || [];
      setTranscript(utterances);
      const formatted = utterances
        .map((item) => `${item.speaker}:${item.text}`)
        .join(" ");
      setTranscriptText(formatted);
       setIsTranscribing(false);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const processFiles = async (files) => {
    setIsProcessing(true);
    try {
      for (const file of files) {
        const ext = file.name.split(".").pop().toLowerCase();
        if (["pdf", "txt", "docx", "vtt"].includes(ext)) {
          await extractTranscript(file, ext);
        } else if (["mp4", "mov", "mkv"].includes(ext)) {
          await videoUpload(file);
        }
      }
    } catch (err) {
      console.error("Error during processing", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const extractTranscript = async (file, ext) => {
    try {
      if (ext === "pdf") {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const typedarray = new Uint8Array(e.target.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            fullText += text.items.map((item) => item.str).join(" ") + "\n";
          }
          setTranscriptText((prev) => prev + "\n" + fullText);
        };
        reader.readAsArrayBuffer(file);
      } else if (ext === "docx") {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const result = await mammoth.extractRawText({
            arrayBuffer: e.target.result,
          });
          setTranscriptText((prev) => prev + "\n" + result.value);
        };
        reader.readAsArrayBuffer(file);
      } else if (ext === "txt") {
        const reader = new FileReader();
        reader.onload = (e) =>
          setTranscriptText((prev) => prev + "\n" + e.target.result);
        reader.readAsText(file);
      } else if (ext === "vtt") {
        const reader = new FileReader();
        reader.onload = (e) => {
          const lines = e.target.result.split("\n");
          const text = lines
            .filter((line) => !line.match(/^[0-9]+$|^([0-9]{2}):([0-9]{2})/))
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
          setTranscriptText((prev) => prev + "\n" + text);
        };
        reader.readAsText(file);
         setIsTranscribing(false);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to extract transcript");
    }
  };

  const handleAddFile = () => {
    document.getElementById("file-upload-input").click();
  };

  const handleSubmit = async () => {

   
    setIsProcessing(true); // This was missing due to nesting bug
    try {
      if (!selectedDate || !transcriptText.trim()) {
  alert("Please provide a date and transcript");
  setIsProcessing(false); //  Add this!
  setLoading(false);
  return;
}


      const result = await wxai(transcriptText);
      const parsed = cleanAndParseStandupText(result.output);
      setParsedData(parsed);

      const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0"); // months are 0-based
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const formattedDate = formatDate(selectedDate);

      

      const payload = {
        date: formattedDate,
        items: parsed.items,
      };

    const token=localStorage.getItem("token");
    const response = await fetch("http://localhost:4000/api/summaries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });


      // alert("Summary submitted successfully!");
    } catch (error) {
      console.error("Submit error:", error);
      alert("Error: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="upload-transcript">
      <div className="upload-transcript__header">
        <h2 className="upload-transcript_title">Upload Transcript</h2>

        <p className="upload-transcript_subtitle">
          (Either paste or upload the transcript)
        </p>
      </div>

      <div className="upload-transcript__date-section">
        <label className="custom-date-label">
          Select Stand up Date
          <span className="label-star">*</span>
        </label>
        <DatePicker
          datePickerType="single"
          onChange={handleDateChange}
          value={selectedDate}
        >
          <DatePickerInput
            placeholder="dd/mm/yyyy"
            id="date-picker-input"
            size="md"
          />
        </DatePicker>
      </div>

      <div className="upload-transcript__content">
        <div className="upload-transcript__paste-section">
          <label className="upload-transcript__label">
            Paste the Transcript :
          </label>
          <TextArea
            id="transcript-textarea"
            value={pastedText}
            onChange={handleTranscriptChange}
            rows={12}
            className="upload-transcript__textarea"
          />
        </div>

        <div className="upload-transcript__upload-section">
          <label className="upload-transcript__label">
            Upload Transcript file :
          </label>
          <div className="upload-transcript__file-area">
            <p className="upload-transcript__file-info">
              only pdf, doc or mp4 formats are supported
            </p>
            <input
              type="file"
              id="file-upload-input"
              accept=".pdf,.doc,.docx,.mp4"
              multiple
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
            <Button
              kind="primary"
              renderIcon={Add}
              onClick={handleAddFile}
              className="upload-transcript__add-button"
            >
              Add File
            </Button>
            {uploadedFiles.length > 0 && (
              <div className="upload-transcript__file-list">
                {uploadedFiles.map((file, index) => (
                  <p key={index} className="upload-transcript__file-name">
                    {file.name}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="upload-transcript__submit-section">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
  {isTranscribing && (
    <Loading text="Transcribing..." />
  )}
          <Button
            kind="primary"
            size="lg"
            onClick={handleSubmit}
            className="upload-transcript__submit-button"
            disabled={!selectedDate || !transcriptText.trim()}
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};
export default Upload;
