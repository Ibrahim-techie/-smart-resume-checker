from datetime import datetime, timezone
import os
import traceback

from bson import ObjectId
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

from db import get_db
from extractor import extract_text

load_dotenv()

app = Flask(__name__)
CORS(app)


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "AI Service running ✅",
        "version": "2.0.0",
        "services": ["text-extraction"],
    })


@app.route('/extract', methods=['POST'])
def extract():
    data = request.get_json(silent=True) or {}

    resume_id = data.get('resumeId')
    file_url = data.get('fileUrl')
    file_type = data.get('fileType')

    if not all([resume_id, file_url, file_type]):
        return jsonify({"error": "resumeId, fileUrl, and fileType are required"}), 400

    db = get_db()
    resumes = db['resumes']

    try:
        resumes.update_one(
            {"_id": ObjectId(resume_id)},
            {"$set": {
                "status": "processing",
                "analysisStartedAt": datetime.now(timezone.utc),
            }},
        )

        parsed_text = extract_text(file_url, file_type)

        if not parsed_text or len(parsed_text.strip()) < 50:
            raise ValueError("Extracted text is too short — file may be image-based or empty")

        resumes.update_one(
            {"_id": ObjectId(resume_id)},
            {"$set": {
                "parsedText": parsed_text,
                "status": "completed",
                "analysisCompletedAt": datetime.now(timezone.utc),
            }},
        )

        return jsonify({
            "success": True,
            "resumeId": resume_id,
            "charCount": len(parsed_text),
            "wordCount": len(parsed_text.split()),
            "preview": parsed_text[:300] + "..." if len(parsed_text) > 300 else parsed_text,
        })
    except Exception as error:
        resumes.update_one(
            {"_id": ObjectId(resume_id)},
            {"$set": {
                "status": "failed",
                "analysisCompletedAt": datetime.now(timezone.utc),
                "analysisResult": {"error": str(error)},
            }},
        )
        traceback.print_exc()
        return jsonify({"error": str(error)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)
