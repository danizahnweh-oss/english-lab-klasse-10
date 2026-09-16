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
js='// Authored independent practice. Original test data and old exercise IDs stay unchanged.\n'
js+='for (const q of window.LAB_DATA.questions) { if (!q.year) { q.level = "basic"; q.independent = true; } }\n'
js+='window.LAB_DATA.questions.push(...'+json.dumps(questions,ensure_ascii=False,separators=(',',':'))+');\n'
js+='window.LAB_DATA.plan[0] = ["16.09.","Lernstand entdecken","Zwölf eigenständige Fragen zeigen dir, welche Regeln du wiederholen solltest.","diagnostic",15];\n'
js+='window.LAB_DATA.plan[5] = ["21.09.","Wissen in neuen Situationen anwenden","Eine gemischte Runde mit neuen Aufgaben, danach Fehler verstehen.","mixed",20];\n'
js+='window.LAB_DATA.plan[8] = ["24.09.","Noch eine gemischte Übungsrunde","Neue Sätze zu zwölf Themen. Bisher unbearbeitete Aufgaben kommen zuerst.","mixed",20];\n'
js+='window.LAB_DATA.plan[3] = ["19.09.","Modalverben sicher verwenden","Pflicht, Erlaubnis und Vermutung mit neuen Grammatikaufgaben üben.","topic:modals",20];\n'
js+='window.LAB_DATA.plan[9] = ["25.09.","Grammatik festigen","Eine gemischte Runde mit eigenständigen Aufgaben vor der Generalprobe.","mixed",20];\n'
additions=json.loads((root/'content/grammar-additions.json').read_text())
js+='for (const [id, forms] of Object.entries('+json.dumps(additions,ensure_ascii=False,separators=(',',':'))+')) { window.LAB_DATA.grammar.find(t=>t.id===id).forms.push(...forms); }\n'
(root/'dist/training-data.js').write_text(js)
print(f'Built {len(questions)} new exercises; 210 independent exercises including existing foundations.')
