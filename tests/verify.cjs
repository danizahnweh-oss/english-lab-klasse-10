const {JSDOM}=require('jsdom');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const base=path.resolve(__dirname,'../dist');
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const data=fs.readFileSync(path.join(base,'data.js'),'utf8')+'\n'+fs.readFileSync(path.join(base,'training-data.js'),'utf8');
const app=fs.readFileSync(path.join(base,'exams-data.js'),'utf8')+'\n'+fs.readFileSync(path.join(base,'online-exams.js'),'utf8')+'\n'+fs.readFileSync(path.join(base,'app.js'),'utf8');
let tools={};
function load(storage){const dom=new JSDOM(html,{url:'https://example.org/',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;w.scrollTo=()=>{};w.matchMedia=()=>({matches:true});w.HTMLElement.prototype.scrollIntoView=()=>{};w.confirm=()=>true;w.document.modelContext={registerTool(t){tools[t.name]=t;}};if(storage)w.localStorage.setItem('english-lab-v1',storage);w.eval(data);w.eval(app+'\nwindow.testEval=(expression)=>eval(expression);');return dom;}
let dom=load(),w=dom.window;const ev=s=>w.testEval(s);const tick=()=>new Promise(r=>setTimeout(r,20));
function route(hash){w.location.hash=hash;ev('render(false)');}
(async()=>{
const D=w.LAB_DATA;
assert.equal(D.questions.length,327);assert.equal(D.grammar.length,14);
assert.equal(new Set(D.questions.map(q=>q.id)).size,327);
for(const y of [2021,2022,2023,2024,2025])assert.equal(D.questions.filter(q=>q.year===y).length,15);
for(const q of D.questions){assert(D.grammar.some(t=>t.id===q.topic));assert(q.explanation.length>10);for(const answer of q.answers)assert(ev(`matchAnswer(D.questions.find(q=>q.id===${JSON.stringify(q.id)}),${JSON.stringify(answer)})`));}
assert(ev("!matchAnswer(D.questions.find(q=>q.id==='o2022-1'),'british')"));
assert(ev("matchAnswer(D.questions.find(q=>q.id==='o2025-15'),\"scientists'\")"));
assert(ev("!matchAnswer(D.questions.find(q=>q.id==='o2025-15'),\"scientist's\")"));
for(const hash of ['home','practice','grammar',...D.grammar.map(t=>'grammar/'+t.id),'listening/2021','listening/2022','listening/2023','listening/2024','listening/2025','writing/2021','writing/2022','writing/2023','writing/2024','writing/2025','writing/extra2024','writing/extra2025','exams/2025','exam/2021','exam/2022','exam/2023','exam/2024','exam/2025','progress']){
route(hash);assert(w.document.querySelector('main h1'),hash+' has h1');assert(!w.document.querySelector('main').innerHTML.includes('undefined'),hash+' no undefined');
const ids=[...w.document.querySelectorAll('[id]')].map(x=>x.id);assert.equal(new Set(ids).size,ids.length,hash+' unique ids');
for(const el of w.document.querySelectorAll('input:not([type=checkbox]),select,textarea'))assert(el.closest('label')||el.getAttribute('aria-label')||w.document.querySelector(`label[for="${el.id}"]`),hash+' labelled '+el.id);
for(const a of w.document.querySelectorAll('a[href^="material/"],audio[src^="material/"]')){const f=decodeURIComponent((a.getAttribute('href')||a.getAttribute('src')).split('#')[0]);assert(fs.existsSync(path.join(base,f)),f);}
}
// Independent practice must never leak an original test item into default rounds.
assert.equal(D.questions.filter(q=>!q.year).length,252);
for(const t of D.grammar){
 assert.equal(D.questions.filter(q=>!q.year&&q.topic===t.id).length,18);
 for(const [level,count] of [['basic',7],['apply',5],['transfer',6],['new',12]]){
  const set=ev(`questionSet('topic',${JSON.stringify(t.id)},${JSON.stringify(level)})`);
  assert.equal(set.length,count);assert(set.every(q=>!q.year));
  if(level!=='new')assert(set.every(q=>q.level===level));
 }
}
assert(ev("questionSet('diagnostic').every(q=>q.independent&&q.id.startsWith('n-'))"));
for(let i=0;i<20;i++){const set=ev("questionSet('mixed')");assert.equal(set.length,12);assert.equal(new Set(set.map(q=>q.topic)).size,12);assert(set.every(q=>!q.year));}
const oldAnswers=ev('JSON.stringify(state.answers)');
ev("for(const q of D.questions.filter(q=>!q.year&&q.topic==='basics'))state.answers[q.id]={correct:true};state.answers['n-basics-01']={correct:false};delete state.answers['n-basics-02'];");
const preferred=ev("questionSet('topic','basics')");assert.equal(preferred[0].id,'n-basics-02');assert.equal(preferred[1].id,'n-basics-01');
ev('state.answers='+oldAnswers);
route('practice');assert.equal(w.document.querySelector('#practice-level').value,'new');assert(w.document.querySelector('main').textContent.includes('252 eigenständige Übungen'));
// Exercise every new question's visible renderer and answer feedback.
for(const q of D.questions.filter(q=>q.id.startsWith('n-'))){
 ev(`state.session={kind:'topic',ids:[${JSON.stringify(q.id)}],index:0,responses:{}}`);route('quiz');assert(w.document.querySelector('main').textContent.includes('neu entwickelt'));
 assert(w.document.querySelector('#answer-form'));assert(w.document.querySelector(q.type==='choice'?'[data-exercise-option]':'#answer'));
}
ev('state.session=null');
route('home');const check=w.document.querySelector('[data-plan="0"]');check.checked=true;check.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(w.document.querySelector('#plan-count').textContent,'1 / 12 Einheiten');
ev("startSession('diagnostic')");await tick();assert.equal(ev('state.session.ids.length'),12);
let inp=w.document.querySelector('#answer');inp.value='my unsent answer';inp.dispatchEvent(new w.Event('input',{bubbles:true}));route('grammar/tenses');route('quiz');assert.equal(w.document.querySelector('#answer').value,'my unsent answer');
ev("checkAnswer('wrong')");assert.equal(ev('stats().attempted'),1);assert.equal(ev('stats().correct'),0);ev("checkAnswer('had already left')");assert.equal(ev('state.answers[state.session.ids[0]].attempts'),1,'no repeat scoring');assert.equal(ev("questionSet('mistakes').length"),1);
ev('state.session.index++;render(false)');ev("checkAnswer('had told')");assert.equal(ev('stats().correct'),1);
ev("startSession('mistakes')");await tick();ev("checkAnswer('had already left')");assert.equal(ev("questionSet('mistakes').length"),0);assert.equal(ev('stats().attempted'),2,'distinct questions only');
for(const id of ['2021','2025','extra2024','extra2025']){route('writing/'+id);assert(!w.document.querySelector('#writing-text'));assert(w.document.querySelector('a[href="#exams"]'));}
route('home');assert.equal(w.document.querySelectorAll('.plan-row').length,12);assert(!w.document.querySelector('[data-plan="6"]'));assert(!w.document.querySelector('a[href^="#writing"]'));
ev('state.plan[6]=true;state.plan[7]=true');route('home');assert.equal(w.document.querySelector('#plan-count').textContent,'2 / 12 Einheiten');assert(w.document.querySelector('[data-plan="7"]').checked);
route('exams');assert(!w.document.querySelector('a[href^="#writing"],a[href*="Textprod"],a[href*="Loes_2"]'));
ev("state.drafts['2025:text']='A pyramid for the future.'");
for(const y of [2021,2022,2023,2024,2025]){route('listening/'+y);assert(!w.document.querySelector('audio,[data-listen],[data-exam-listen]'));assert(w.document.querySelector('a[href="#exams"]'));}
assert(!w.document.querySelector('[data-nav="listening"]'));
assert(D.plan.every(p=>!p[3].startsWith('listening')));
ev("state.scores={'2025:listening':'15','2025:grammar':'15','2025:writing':'20'}");assert(ev('scoreText(2025)').includes('50 von 50'));ev("state.scores['2025:grammar']='16'");assert(ev('scoreText(2025)').includes('gültige'));ev("state.scores['2025:grammar']=''");assert(ev('scoreText(2025)').includes('alle drei'));
ev("state.timer={running:true,deadline:Date.now()+90000}");assert.equal(ev('timerSeconds()'),90);ev('toggleTimer()');assert.equal(ev('state.timer.running'),false);assert.equal(ev('timerSeconds()'),90);
let before=ev('JSON.stringify(state)');assert.throws(()=>tools.start_grammar_practice.execute({topic:'INVALID'}));assert.equal(ev('JSON.stringify(state)'),before);const res=tools.start_grammar_practice.execute({topic:'passive'});await tick();assert.equal(res.topic,'passive');assert(w.document.querySelector('form#answer-form'));assert(ev('state.session.ids.every(id=>D.questions.find(q=>q.id===id).topic==="passive")'));
ev('save()');const saved=w.localStorage.getItem('english-lab-v1');dom.window.close();dom=load(saved);w=dom.window;assert.equal(ev("state.drafts['2025:text']"),'A pyramid for the future.');
// Complete all five original exams through their shared state and visible evaluation.
for(const y of [2021,2022,2023,2024,2025]){
 route('exam/'+y);
 const gcount=w.document.querySelectorAll('[data-exam-grammar]').length;
 assert.equal(gcount,15,'15 original grammar fields for '+y);
 const e=ev(`EX[${y}]`);
 assert.equal(e.listening.flatMap(g=>g.items).reduce((n,i)=>n+i.points,0),15);
 for(const passage of e.passages){const matches=[...passage.text.matchAll(/\{\{(\d+)\|[^}]+\}\}/g)];assert(matches.length>0,'original text has numbered input locations');}
 const input=w.document.querySelector('[data-exam-listen]');
 input.value='my saved answer';input.dispatchEvent(new w.Event('input',{bubbles:true}));
 route('home');route('exam/'+y);assert.equal(w.document.querySelector('[data-exam-listen]').value,'my saved answer');
 ev(`(()=>{const s=examState(${y});for(const g of EX[${y}].grammar)s.grammar[g.id]=g.answers[0];for(const group of EX[${y}].listening)for(const i of group.items){if(i.type==='choice')s.listening[i.id]=[...i.correct];else{s.listening[i.id]=i.key;s.self['l:'+i.id]=1;}}s.writing='A full test draft.';s.self.content=4;s.self.language=6;})()`);
 assert.equal(ev(`examScore(${y}).total`),50,'full correct score');
 ev(`examState(${y}).grammar['1']='wrong'`);assert.equal(ev(`examScore(${y}).grammar`),14);
 route('exam/'+y);w.document.querySelector(`[data-action="exam-submit:${y}"]`).click();
 assert.equal(ev(`examState(${y}).submitted`),true);assert(w.document.querySelector('#exam-results'));
 assert(w.document.querySelector('#exam-writing-text').disabled,'submitted writing locked');
 assert(w.document.querySelector('[data-exam-grammar]').disabled,'submitted grammar locked');
 assert(w.document.querySelectorAll('[data-exam-self]').length>2,'manual grading available');
 assert(w.document.querySelector('#exam-results').textContent.includes('49'));
 w.document.querySelector(`[data-action="exam-edit:${y}"]`).click();
 assert(!w.document.querySelector('#exam-writing-text').disabled);assert.equal(ev(`examScore(${y}).total`),null);
 const box=w.document.querySelector('[data-exam-correct]');
 if(box){box.checked=true;box.dispatchEvent(new w.Event('change',{bubbles:true}));const key=box.dataset.examCorrect;assert.equal(ev(`examState(${y}).grammar['${key}']`),'✓');assert(w.document.getElementById('eg-'+key).disabled);box.checked=false;box.dispatchEvent(new w.Event('change',{bubbles:true}));assert(!w.document.getElementById('eg-'+key).disabled);}
 const audio=w.document.querySelector('audio');w.document.querySelector(`[data-action="exam-timer:${y}"]`).click();assert.strictEqual(w.document.querySelector('audio'),audio,'timer must not recreate audio');assert(ev(`examState(${y}).timer.running`));w.document.querySelector(`[data-action="exam-timer:${y}"]`).click();assert(!ev(`examState(${y}).timer.running`));
}
// Incomplete work has no misleading complete score.
assert.equal(ev('examScore(2025).total'),null);
// Saved original exam answers survive a fresh application load.
ev('save()');const savedExams=w.localStorage.getItem('english-lab-v1');dom.window.close();dom=load(savedExams);w=dom.window;route('exam/2025');assert.equal(w.document.querySelector('#exam-writing-text').value,'A full test draft.');
// Exercise the actual controls, including wrong attempts, retries, reload and rule lookup.
const click=selector=>{const el=w.document.querySelector(selector);assert(el,selector);el.click();};
const submit=()=>w.document.querySelector('#answer-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
const openQuestion=id=>{ev(`state.session={kind:'topic',ids:[${JSON.stringify(id)}],index:0,responses:{}}`);route('quiz');};
const choiceQ=w.LAB_DATA.questions.find(q=>q.type==='choice');
openQuestion(choiceQ.id);submit();assert(!ev(`state.session.responses['${choiceQ.id}']`));
let incorrect=[...w.document.querySelectorAll('[data-exercise-option]')].find(el=>!ev(`matchAnswer(D.questions.find(q=>q.id==='${choiceQ.id}'),${JSON.stringify(el.value)})`));incorrect.click();submit();assert(!ev(`state.answers['${choiceQ.id}'].correct`));
openQuestion(choiceQ.id);let right=[...w.document.querySelectorAll('[data-exercise-option]')].find(el=>ev(`matchAnswer(D.questions.find(q=>q.id==='${choiceQ.id}'),${JSON.stringify(el.value)})`));right.click();route('grammar/tenses');route('quiz');assert(w.document.querySelector('[data-exercise-option]:checked'));
const choiceSaved=w.localStorage.getItem('english-lab-v1');dom.window.close();dom=load(choiceSaved);w=dom.window;route('quiz');assert(w.document.querySelector('[data-exercise-option]:checked'));submit();assert(ev(`state.answers['${choiceQ.id}'].correct`));assert(w.document.querySelector('[data-exercise-option]').disabled);
const orderQ=w.LAB_DATA.questions.find(q=>q.type==='order');openQuestion(orderQ.id);click('[data-action="puzzle-add:0"]');submit();assert(!ev(`state.session.responses['${orderQ.id}']`));route('grammar/tenses');route('quiz');assert.equal(ev('state.session.exerciseUI[state.session.ids[0]].picked.length'),1);
const puzzleSaved=w.localStorage.getItem('english-lab-v1');dom.window.close();dom=load(puzzleSaved);w=dom.window;route('quiz');assert.equal(w.document.querySelectorAll('.puzzle-answer button').length,1);click('[data-action="puzzle-remove:0"]');assert.equal(w.document.querySelectorAll('.puzzle-answer button').length,0);click('[data-action="puzzle-add:0"]');click('[data-action="puzzle-clear"]');assert.equal(ev('state.session.exerciseUI[state.session.ids[0]].picked.length'),0);
for(let i=orderQ.parts.length-1;i>=0;i--)click(`[data-action="puzzle-add:${i}"]`);submit();assert(!ev(`state.answers['${orderQ.id}'].correct`));
for(const q of w.LAB_DATA.questions.filter(q=>q.type==='order')){openQuestion(q.id);for(let i=0;i<q.parts.length;i++)click(`[data-action="puzzle-add:${i}"]`);submit();assert(ev(`state.answers['${q.id}'].correct`),q.id);const before=ev('JSON.stringify(state.session)');ev("exerciseAction('puzzle-clear')");assert.equal(ev('JSON.stringify(state.session)'),before);}
for(const q of w.LAB_DATA.questions.filter(q=>q.type==='error')){openQuestion(q.id);const index=q.parts.indexOf(q.answers[0]);assert(index>=0);click(`[data-action="error-pick:${(index+1)%q.parts.length}"]`);submit();assert(!ev(`state.answers['${q.id}'].correct`));openQuestion(q.id);click(`[data-action="error-pick:${index}"]`);route('grammar/'+q.topic);route('quiz');assert.equal(w.document.querySelector('[aria-pressed="true"]').textContent,q.answers[0]);submit();assert(ev(`state.answers['${q.id}'].correct`));assert(w.document.querySelector('#answer-feedback').textContent.includes(q.correctedSentence));ev('state.session.index++;render(false)');assert(w.document.querySelector('main').textContent.includes(q.correctedSentence));}
for(const q of w.LAB_DATA.questions.filter(q=>q.type==='choice')){
 assert.equal(q.options.filter(a=>ev(`matchAnswer(D.questions.find(q=>q.id==='${q.id}'),${JSON.stringify(a)})`)).length,1,q.id);
 openQuestion(q.id);const correct=[...w.document.querySelectorAll('[data-exercise-option]')].find(el=>ev(`matchAnswer(D.questions.find(q=>q.id==='${q.id}'),${JSON.stringify(el.value)})`));assert(correct,q.id);correct.click();submit();assert(ev(`state.answers['${q.id}'].correct`));
}
for(const kind of ['input','choice','order','error']){ev(`startSession('format','${kind}');render(false)`);assert.equal(ev('state.session.ids.length'),12);assert(ev(`state.session.ids.every(id=>{const q=D.questions.find(q=>q.id===id);return !q.year&&q.type==='${kind}';})`));}
ev('state=defaults()');
for(const t of w.LAB_DATA.grammar){const qs=ev(`questionSet('topic','${t.id}')`);assert.equal(new Set(qs.map(q=>q.type)).size,4,t.id+' has all formats');}
assert(w.LAB_DATA.questions.filter(q=>q.year).every(q=>!q.type),'original training keeps the original answer format');
console.log('PASS: all native choice controls, 14 sentence puzzles, 14 error hunts, per-topic variety, saved selections, wrong answers, retries, locked feedback and format filters.');
console.log('PASS: 327 answer keys; 252 independent exercises; 168 new question renderings; independent diagnostic, level filters, balanced selection and prioritisation; labels, local links, diagnostic, feedback, duplicate prevention, retries, draft persistence, exam-only listening, scores, timer and optional WebMCP contract in emulated DOM.');
console.log('Note: emulated DOM checks are not native WebMCP validation or browser visual QA.');
dom.window.close();
})().catch(e=>{console.error(e);dom.window.close();process.exit(1)});
