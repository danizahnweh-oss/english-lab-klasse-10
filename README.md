# English Lab · Klasse 10

Self-study English platform for September 29, 2026. Main corpus: 2021–2025, older PDFs are optional archive materials.

## Contents
- 75 adapted, individually answerable Use of English items, 15 for each year 2021–2025; aligned to supplied answer keys.
- 210 independent exercises (42 existing foundations + 168 new questions), 14 German grammar chapters, and explicit basic/application/transfer levels.
- 12-question independent diagnostic, balanced mixed practice, feedback, mistake practice and device-local progress. Topic and mixed practice exclude original test questions by default; original questions require choosing a year explicitly.
- Listening is assessed exclusively within the original online tests. No separate listening practice or listening assignments in the preparation plan; legacy listening links explain this and point to the exam library. Free listening answers use manual self-assessment.
- Preparation contains grammar only. Mediation remains within the complete original exams, with no separate writing workspace or writing plan entry. Previously saved drafts remain in the progress export. Plan entries retain their original storage indices.
- Original PDFs, audio, 60-minute practice timer and manually entered scores.

## Running
Serve `dist/` using any static HTTP server. No build, framework, database, external font, analytics or API key required. JavaScript is needed for interactive practice. Hash routes work on static hosts.

## Data
Responses and drafts are saved in this browser's localStorage (`english-lab-v1`). Nothing is synced to a teacher or another device. The interface discloses this and offers text exports and a confirmed reset. Hosting providers process ordinary requests for the site and static assets.

## Sources and provenance
The PDFs and MP3s in `dist/material/` were supplied by the teacher. Original material retains its source credits. The interactive grammar sentences are shortened/adapted from the tests and clearly marked; additional exercises and grammar explanations are newly authored. Complete original context and grading rules remain in the PDFs.

2018 has no supplied solutions or audio. No 2020 material was supplied. The two 2024 Textprod PDFs are variants of the same summer writing task, one including a rubric. Summer writing tasks are retained as source files but are not offered in the learning interface.

## Deployment
`.openai/hosting.json` identifies the Sites project. GitHub Actions publishes the `dist/` directory to GitHub Pages. No secrets or learner information are part of the repository.

## Validation limits
Syntax, content references, answer evaluation, persistence, navigation, writing tools and timer state are checked programmatically. No browser visual QA was requested. Optional WebMCP registration uses the native API when present; availability is not required for students to use the site.

## Complete online original tests (2021–2025)
All five September tests have complete editable online answer sheets with the original listening tasks and multiple-choice options, full Use of English texts and original correction/gap/select formats, and original mediation source texts. Original 2025 picture options are rendered directly from the provided PDF. Formatting of tables and line breaks is adapted for mobile use.

Each answer sheet saves locally, resumes, exports as text, and has its own optional 60-minute timer. Submitting locks answers and reveals results. Grammar and closed-choice listening are checked automatically against the official keys. Open listening responses and writing receive explicit manual self-assessment controls; the total remains incomplete until these have been assessed. Editing again clears self-assessment and keeps the written responses. This is practice, not a secure assessment or teacher submission service.

## Independent practice content
The 168 additional questions live in `content/new-exercises.json`, with supplemental rules in `content/grammar-additions.json`. Run `python3 content/build-training.py` to regenerate `dist/training-data.js`. Existing IDs and original test data stay unchanged. Every topic has 15 independent questions: 7 foundation, 4 application and 4 transfer. Topic rounds contain up to 12 questions; mixed rounds contain 12 distinct topics. Selection prioritises unseen questions, then unresolved mistakes, then known questions. No claim of unlimited generated exercises is made.
