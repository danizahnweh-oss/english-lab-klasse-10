"""Build the independent exercise bank without modifying the supplied original tests."""
import json
from pathlib import Path
root=Path(__file__).resolve().parent.parent
bank=json.loads((root/'content/new-exercises.json').read_text())
questions=[]
for topic,rows in bank.items():
 assert len(rows)==12,(topic,len(rows))
 for i,(prompt,answers,explanation) in enumerate(rows,1):
  level='basic' if i<=4 else 'apply' if i<=8 else 'transfer'
  questions.append(dict(id=f'n-{topic}-{i:02}',topic=topic,prompt=prompt,answers=list(dict.fromkeys(answers.split('|'))),explanation=explanation,source='Neue Übung · '+{'basic':'Grundlagen','apply':'Anwenden','transfer':'Transfer'}[level],year=0,level=level,independent=True,instruction='Löse die Aufgabe wie angegeben. Trage nur die gesuchte Antwort ein.'))
assert len(questions)==168
variations=json.loads((root/'content/varied-exercises.json').read_text())
assert set(variations)==set(bank)
for topic, formats in variations.items():
 for kind, row in formats.items():
  common=dict(id=f'v-{topic}-{kind}',topic=topic,type=kind,year=0,independent=True,source='Neue Übung · '+('Anwenden' if kind=='choice' else 'Transfer'),level='apply' if kind=='choice' else 'transfer')
  if kind=='choice':
   prompt,options,answer,explanation=row
   assert len(set(options))==len(options) and options.count(answer)==1
   common.update(prompt=prompt,options=options,answers=[answer],explanation=explanation,instruction='Wähle die passende Antwort aus.')
  elif kind=='order':
   parts,explanation=row
   common.update(prompt=f'Bilde einen korrekten Satz. Beginne mit „{parts[0]}“.',parts=parts,answers=[' '.join(parts)],explanation=explanation,instruction='Setze die Bausteine durch Antippen oder Anklicken zusammen. Ein erneuter Klick legt einen Baustein zurück.')
  else:
   assert kind=='error'
   parts,answer,corrected,explanation=row
   assert parts.count(answer)==1
   common.update(prompt=' '.join(parts),parts=parts,answers=[answer],correctedSentence=corrected,explanation=explanation,instruction='Genau ein Baustein enthält einen Grammatikfehler. Wähle ihn aus. Nach dem Prüfen siehst du den korrigierten Satz.')
  questions.append(common)
assert len(questions)==210
js='// Authored independent practice. Original test data and old exercise IDs stay unchanged.\n'
js+='for (const q of window.LAB_DATA.questions) { if (!q.year) { q.level = "basic"; q.independent = true; } }\n'
js+='window.LAB_DATA.questions.push(...'+json.dumps(questions,ensure_ascii=False,separators=(',',':'))+');\n'
js+=r'''
// Existing authored selection questions become native choices; answer keys and IDs remain stable.
for (const q of window.LAB_DATA.questions.filter(q=>!q.year)) {
 q.type ??= 'input';
 if(q.type !== 'input') continue;
 const norm=s=>s.trim().replace(/[‘’]/g,"'").toLowerCase();
 for(const match of q.prompt.matchAll(/\(([^()]* \/ [^()]*)\)/g)) {
  const options=match[1].split(' / ').map(s=>s.trim());
  if(options.length<2||options.filter(s=>q.answers.some(a=>norm(a)===norm(s))).length!==1) continue;
  q.type='choice';q.options=options;q.prompt=q.prompt.replace(match[0],'').replace(/\s+([.?!])/g,'$1').trim();
  q.instruction='Wähle die passende Antwort aus.';break;
 }
 if(q.id==='n-relatives-10'||q.id==='n-relatives-11') {
  q.type='choice';q.options=['yes','no'];q.instruction='Kann das Relativpronomen entfallen? Wähle yes oder no.';
 }
}
'''
js+='window.LAB_DATA.plan[0] = ["16.09.","Lernstand entdecken","Zwölf eigenständige Fragen zeigen dir, welche Regeln du wiederholen solltest.","diagnostic",15];\n'
js+='window.LAB_DATA.plan[5] = ["21.09.","Wissen in neuen Situationen anwenden","Eine gemischte Runde mit neuen Aufgaben, danach Fehler verstehen.","mixed",20];\n'
js+='window.LAB_DATA.plan[8] = ["24.09.","Noch eine gemischte Übungsrunde","Neue Sätze zu zwölf Themen. Bisher unbearbeitete Aufgaben kommen zuerst.","mixed",20];\n'
js+='window.LAB_DATA.plan[3] = ["19.09.","Modalverben sicher verwenden","Pflicht, Erlaubnis und Vermutung mit neuen Grammatikaufgaben üben.","topic:modals",20];\n'
js+='window.LAB_DATA.plan[9] = ["25.09.","Grammatik festigen","Eine gemischte Runde mit eigenständigen Aufgaben vor der Generalprobe.","mixed",20];\n'
additions=json.loads((root/'content/grammar-additions.json').read_text())
js+='for (const [id, forms] of Object.entries('+json.dumps(additions,ensure_ascii=False,separators=(',',':'))+')) { window.LAB_DATA.grammar.find(t=>t.id===id).forms.push(...forms); }\n'
(root/'dist/training-data.js').write_text(js)
print(f'Built {len(questions)} new exercises; 252 independent exercises including existing foundations and four exercise formats.')
