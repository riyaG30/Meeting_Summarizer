import sys
import json
import spacy
import re
from transformers import pipeline
from rapidfuzz import process, fuzz
from metaphone import doublemetaphone


# Load NLP models
nlp = spacy.load("en_core_web_sm")
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

# Constants
KNOWN_NAMES = ["Shamith", "Palak", "Chirag", "Lia", "Riya", "Vijay", "Ashna", "Thanuja","Diya"]
INTENTS = [
    "asking who should speak next",
    "introducing oneself",
    "general statement"
]
ASKING_CUES = [
    "what about you", "your turn", "go ahead", "let's hear from", "next up is",
    "i'll pass it to", "moving on to", "over to you", "how's it going",
    "can you update us", "we haven't heard from", "continuing with",
    "let's go with", "let's go ahead with", "we'll start with", "starting with",
    "first up is", "begin with", "kicking off with"
]

def get_phonetic_match(name_candidate, known_names):
    candidate_key = doublemetaphone(name_candidate)[0]
    for name in known_names:
        if doublemetaphone(name)[0] == candidate_key:
            return name
    return None


# Helper: Fuzzy match name
def get_closest_name(name_candidate, known_names=KNOWN_NAMES, threshold=70):
    if not name_candidate:
        return None

    # Fuzzy match first
    match = process.extractOne(name_candidate, known_names, scorer=fuzz.partial_ratio)
    if match and match[1] >= threshold:
        return match[0]

    # If fuzzy match fails, try phonetic match
    return get_phonetic_match(name_candidate, known_names)



# Detect name using SpaCy or fallback regex
def extract_person_name(text):
    doc = nlp(text)
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            matched = get_closest_name(ent.text)
            if matched:
                return matched

    # Fallback regex-based patterns
    patterns = [
        r"with\s+([A-Z][a-z]+)",
        r"go ahead with\s+([A-Z][a-z]+)",
        r"let's go with\s+([A-Z][a-z]+)",
        r"start with\s+([A-Z][a-z]+)",
        r"proceed with\s+([A-Z][a-z]+)",
        r"ahead with\s+([A-Z][a-z]+)",
        r"update us,?\s+([A-Z][a-z]+)"
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            name_candidate = match.group(1).strip()
            return get_closest_name(name_candidate)
    return None


# Core name mapping function
def detect_names_and_intents(utterances):
    speaker_name_map = {}
    previous_speaker = None

    for i, utt in enumerate(utterances):
        curr_speaker = utt["speaker"]
        text = utt["text"]

        # 1. Priority: self-introduction
        if curr_speaker not in speaker_name_map:
            for name in KNOWN_NAMES:
                if re.search(rf"\b(my name is|i'?m|i am|myself)\s+{name}\b", text, re.IGNORECASE):
                    speaker_name_map[curr_speaker] = name
                    break

        # 2. Fuzzy matching self-intro
        if curr_speaker not in speaker_name_map:
            intro_match = re.search(r"\b(my name is|i'?m|i am|myself)\s+([A-Z][a-z]+)\b", text, re.IGNORECASE)
            if intro_match:
                candidate = intro_match.group(2)
                fuzzy_name = get_closest_name(candidate)
                if fuzzy_name:
                    speaker_name_map[curr_speaker] = fuzzy_name

         # 3. Intent classification: is this speaker asking someone else to go next?
        classification = classifier(text, INTENTS, multi_label=False)
        top_intent = classification["labels"][0]
        if top_intent == "asking who should speak next":
            invited_name = extract_person_name(text)
            if invited_name:
                for j in range(i + 1, len(utterances)):
                    potential_speaker = utterances[j]["speaker"]
                    if speaker_name_map.get(potential_speaker) == invited_name:
                        break  # Already mapped correctly
                    if potential_speaker not in speaker_name_map:
                        # Heuristic: if the utterance is short (<= 2 sentences), it might be mislabeled
                        if len(utterances[j]["text"].split('.')) <= 2:
                            speaker_name_map[potential_speaker] = invited_name
                            break


        # 4. Fallback from previous utterance
        if curr_speaker not in speaker_name_map and previous_speaker != curr_speaker and i > 0:
            prev_text = utterances[i - 1]["text"]
            name_mentions = re.findall(r'\b[A-Z][a-z]{2,}\b', prev_text)
            for candidate in name_mentions:
                fuzzy_name = get_closest_name(candidate)
                if fuzzy_name:
                    speaker_name_map[curr_speaker] = fuzzy_name
                    break

        previous_speaker = curr_speaker

    return speaker_name_map

# Entrypoint
def main():
    if len(sys.argv) > 1:
        with open(sys.argv[1], "r") as f:
            utterances = json.load(f)
    else:
        utterances = json.load(sys.stdin)

    name_map = detect_names_and_intents(utterances)
    print(json.dumps(name_map))
