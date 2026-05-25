const { GoogleGenerativeAI } = require('@google/generative-ai');
const Resume = require('../models/Resume');

if (!process.env.GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY not set');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const genericPhrases = [
  'add more keywords',
  'add missing sections',
  'use action verbs',
  'quantify your achievements',
];
const flashModels = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash'];

const buildPrompt = (resume, jdContext) => {
  const breakdown = resume.analysisResult?.breakdown || {};
  const strengths = resume.analysisResult?.summary?.strengths || [];
  const improvements = resume.analysisResult?.summary?.improvements || [];
  const contact = breakdown.contact;
  const sections = breakdown.sections;
  const content = breakdown.content;
  const keywords = breakdown.keywords;

  let prompt = `You are a professional resume coach reviewing a resume for a job seeker.

RESUME ANALYSIS DATA:
- Overall ATS Score: ${resume.atsScore}/100
- Contact Info Score: ${contact?.score ?? '?'}/${contact?.max ?? 15}
- Section Completeness: ${sections?.score ?? '?'}/${sections?.max ?? 25}
  - Found sections: ${sections?.found_sections?.join(', ') || 'none'}
  - Missing sections: ${sections?.missing_sections?.join(', ') || 'none'}
- Content Quality: ${content?.score ?? '?'}/${content?.max ?? 25}
  - Word count: ${content?.details?.word_count ?? '?'} words
  - Action verbs found: ${content?.details?.action_verb_count ?? 0}
  - Quantified achievements: ${content?.details?.quantified_achievements ?? 0}
- Keywords detected (${keywords?.keyword_count ?? 0}): ${keywords?.found_keywords?.slice(0, 10).join(', ') || 'none'}

CURRENT RULE-BASED IMPROVEMENTS ALREADY SHOWN:
${improvements.map((item) => `- ${item}`).join('\n') || 'None'}

CURRENT STRENGTHS:
${strengths.map((item) => `- ${item}`).join('\n') || 'None'}
`;

  if (jdContext) {
    prompt += `
JOB DESCRIPTION CONTEXT:
The candidate is targeting: "${jdContext.jdTitle}"
JD Match Score: ${jdContext.matchScore}%
Missing keywords for this role: ${jdContext.missingKeywords?.slice(0, 8).join(', ') || 'none'}
`;
  }

  prompt += `
YOUR TASK:
Generate exactly 5 specific, actionable resume improvement tips.

RULES:
1. Do NOT repeat the rule-based improvements already listed above
2. Go beyond generic advice and be specific to the data provided
3. Each tip must be concrete and immediately actionable
4. Keep each tip to 1-2 sentences maximum
5. Focus on storytelling, achievement framing, industry-specific language, and resume psychology
6. DO NOT include numbering, bullet points, or dashes in your response
7. Return ONLY the 5 tips, one per line, nothing else
`;

  return prompt;
};

const parseSuggestions = (responseText) => (
  responseText
    .split('\n')
    .map((line) => line.trim().replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, ''))
    .filter((line) => line.length > 10)
    .filter((line) => {
      const lower = line.toLowerCase();
      return !genericPhrases.some((phrase) => lower.includes(phrase));
    })
    .slice(0, 5)
);

const generateWithFlashModel = async (prompt) => {
  let lastError;

  for (const modelName of flashModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return { responseText: result.response.text(), modelName };
    } catch (error) {
      lastError = error;
      if (!error.message?.includes('not found') && !error.message?.includes('404')) {
        throw error;
      }
    }
  }

  throw lastError;
};

const getSuggestions = async (req, res) => {
  const { resumeId, jdMatchId } = req.body;

  if (!resumeId) {
    return res.status(400).json({ message: 'resumeId is required' });
  }

  try {
    const resume = await Resume.findById(resumeId);

    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (resume.status !== 'completed' || resume.atsScore === null) {
      return res.status(400).json({
        message: 'Resume must be fully analyzed before getting AI suggestions.',
      });
    }

    const cacheAge = 24 * 60 * 60 * 1000;
    if (
      resume.geminiSuggestions !== null &&
      resume.lastSuggestedAt &&
      Date.now() - new Date(resume.lastSuggestedAt).getTime() < cacheAge
    ) {
      return res.json({
        suggestions: resume.geminiSuggestions,
        cached: true,
        cachedAt: resume.lastSuggestedAt,
      });
    }

    let jdContext = null;
    if (jdMatchId) {
      const JDMatch = require('../models/JDMatch');
      const match = await JDMatch.findById(jdMatchId).select('user jdTitle matchScore missingKeywords');
      if (match && match.user?.toString() === req.user._id.toString()) {
        jdContext = {
          jdTitle: match.jdTitle,
          matchScore: match.matchScore,
          missingKeywords: match.missingKeywords,
        };
      }
    }

    const { responseText, modelName } = await generateWithFlashModel(buildPrompt(resume, jdContext));
    const suggestions = parseSuggestions(responseText);

    resume.geminiSuggestions = suggestions;
    resume.lastSuggestedAt = new Date();
    await resume.save();

    res.json({
      suggestions,
      cached: false,
      generatedAt: resume.lastSuggestedAt,
      model: modelName,
    });
  } catch (error) {
    if (error.message?.includes('quota') || error.message?.includes('429')) {
      return res.status(429).json({
        message: 'AI quota limit reached. Please try again in a minute.',
      });
    }

    console.error('Gemini error:', error.message);
    res.status(500).json({ message: 'AI suggestion generation failed. Try again.' });
  }
};

const clearSuggestions = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.resumeId);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    resume.geminiSuggestions = null;
    resume.lastSuggestedAt = null;
    await resume.save();

    res.json({ message: 'Suggestions cleared. You can regenerate.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSuggestions, clearSuggestions };
