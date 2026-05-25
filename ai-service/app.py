from datetime import datetime, timezone
import os
import traceback

from bson import ObjectId
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

from db import get_db
from extractor import extract_text
from matcher import match_resume_to_jd
from scorer import score_resume

load_dotenv()

app = Flask(__name__)
CORS(app)


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "AI Service running ✅",
        "version": "2.0.0",
        "services": ["text-extraction", "ats-scoring", "jd-matching"],
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

        scoring_result = score_resume(parsed_text)
        ats_score = scoring_result['atsScore']

        resumes.update_one(
            {"_id": ObjectId(resume_id)},
            {"$set": {
                "parsedText": parsed_text,
                "atsScore": ats_score,
                "analysisResult": scoring_result,
                "status": "completed",
                "analysisCompletedAt": datetime.now(timezone.utc),
            }},
        )

        return jsonify({
            "success": True,
            "resumeId": resume_id,
            "atsScore": ats_score,
            "charCount": len(parsed_text),
            "wordCount": len(parsed_text.split()),
            "strengths": scoring_result['summary']['strengths'],
            "improvements": scoring_result['summary']['improvements'],
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


@app.route('/match', methods=['POST'])
def match():
    data = request.get_json(silent=True) or {}
    resume_id = data.get('resumeId')
    jd_text = data.get('jdText', '').strip()
    jd_title = data.get('jdTitle', 'Untitled Position').strip() or 'Untitled Position'

    if not resume_id or not jd_text:
        return jsonify({"error": "resumeId and jdText are required"}), 400

    if len(jd_text) < 50:
        return jsonify({"error": "Job description is too short. Please paste the full JD."}), 400

    db = get_db()
    resumes = db['resumes']

    try:
        resume_doc = resumes.find_one({"_id": ObjectId(resume_id)})

        if not resume_doc:
            return jsonify({"error": "Resume not found"}), 404

        parsed_text = resume_doc.get('parsedText', '')
        if not parsed_text or len(parsed_text) < 50:
            return jsonify({
                "error": "Resume text not extracted yet. Please wait for extraction to complete."
            }), 400

        result = match_resume_to_jd(parsed_text, jd_text, jd_title)

        return jsonify({
            "success": True,
            "resumeId": resume_id,
            "jdTitle": jd_title,
            "matchScore": result['matchScore'],
            "matchedKeywords": result['matchedKeywords'],
            "missingKeywords": result['missingKeywords'],
            "matchedTech": result['matchedTech'],
            "missingTech": result['missingTech'],
            "matchedSoft": result['matchedSoft'],
            "missingSoft": result['missingSoft'],
            "suggestions": result['suggestions'],
            "jdKeywords": result['jdKeywords'],
        })
    except Exception as error:
        traceback.print_exc()
        return jsonify({"error": str(error)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)
