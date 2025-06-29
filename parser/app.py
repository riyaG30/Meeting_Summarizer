from flask import Flask, request, jsonify
from speaker_name_detection import detect_names_and_intents

app = Flask(__name__)

@app.route('/map-speakers', methods=['POST'])
def map_speakers():
    utterances = request.get_json()
    if not utterances:
        return jsonify({"error": "No input provided"}), 400
    name_map = detect_names_and_intents(utterances)
    return jsonify(name_map)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8001)
