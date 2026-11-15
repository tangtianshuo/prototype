# -*- coding: utf-8 -*-
from pathlib import Path
import json
R=Path(__file__).parent
cats=[('fire','消防','Fire protection','Engineered for prevention. Ready for protection.','从火灾探测到自动灭火，为建筑提供完整消防产品选择。',[('sprinklers','自动喷淋','Sprinkler systems'),('extinguishers','灭火设备','Fire extinguishers'),('detection','火灾探测','Fire detection'),('hoses','消防水带与配件','Hoses & accessories')]),('security','安防','Security','A clearer view. A safer environment.','以视频监控、门禁和智能感知，守护每一处重要空间。',[('cameras','视频监控','Video surveillance'),('access','门禁控制','Access control'),('alarms','入侵报警','Intrusion alarms'),('sensors','智能感知','Smart sensors')]),('rescue','救援','Rescue & response','Prepared for the moments that matter.','面向现场救援、个人防护与紧急疏散的专业装备。',[('protection','个人防护','Personal protection'),('tools','救援工具','Rescue tools'),('evacuation','逃生疏散','Escape & evacuation'),('lighting','应急照明','Emergency lighting')])]
# Specifications and SKUs below are illustrative prototype data, not supplier claims.
rows=[
('fire','sprinklers','SP-101','快速响应标准喷头','Quick response sprinkler','sprinkler.jpg','K80 · DN15 · 68°C','Commercial','Brass'),
('fire','sprinklers','SP-102','下垂型洒水喷头','Pendent sprinkler head','sprinkler-pendent.jpg','K80 · DN15 · 68°C','Commercial','Brass'),
('fire','sprinklers','SP-103','直立型洒水喷头','Upright sprinkler head','sprinkler-upright.jpg','K80 · DN15 · 79°C','Industrial','Brass'),
('fire','extinguishers','FE-201','便携式灭火器','Portable fire extinguisher','extinguisher.svg','Portable · Wall mount','Residential','Steel'),
('fire','detection','FD-301','光电感烟探测器','Photoelectric smoke alarm','smoke.svg','Photoelectric · Battery backup','Residential','ABS'),
('fire','detection','FD-302','智能漏水感知器','Water leak detector','water-sensor.svg','Wireless · Local alarm','Commercial','ABS'),
('fire','hoses','FH-401','消防水带及水枪','Fire hose & nozzle','hose.svg','DN40 · 20 m · Adjustable','Industrial','Composite'),
('fire','extinguishers','FE-202','背负式灭火水包','Backpack fire pump','rescue-pack.png','20 L · Manual pump','Industrial','Composite'),
('security','cameras','SC-101','网络半球摄像机','Network dome camera','camera.svg','4 MP · PoE · Indoor','Commercial','Aluminium'),
('security','cameras','SC-102','户外网络摄像机','Outdoor network camera','camera-bullet.svg','4 MP · IR · Outdoor','Industrial','Aluminium'),
('security','access','AC-201','智能门禁读卡器','Smart access reader','access.svg','RFID · Touch keypad','Commercial','ABS'),
('security','access','AC-202','视频门禁终端','Video entry terminal','intercom.svg','7-inch · Two-way audio','Residential','Aluminium'),
('security','alarms','IA-301','被动红外探测器','PIR motion detector','pir.svg','12 m · Indoor · Wired','Commercial','ABS'),
('security','alarms','IA-302','声光警报器','Outdoor alarm sounder','siren.svg','Sound & strobe · Outdoor','Industrial','ABS'),
('security','sensors','SS-401','无线门磁传感器','Wireless door sensor','door.svg','Wireless · Compact','Residential','ABS'),
('security','sensors','SS-402','智能漏水监测器','Smart water sensor','water-sensor.svg','Wireless · Local alarm','Residential','ABS'),
('rescue','protection','RP-101','轻量化救援头盔','Lightweight rescue helmet','helmet.jpg','Adjustable · High visibility','Industrial','Composite'),
('rescue','protection','RP-102','现场救援头盔','Response safety helmet','helmet-red.jpg','Adjustable · Red finish','Industrial','Composite'),
('rescue','tools','RT-201','多功能救援背包','Multi-purpose response pack','rescue-pack.png','20 L · Reinforced fabric','Industrial','Composite'),
('rescue','tools','RT-202','应急医疗包','Emergency first-aid bag','medical.svg','Portable · Multi-compartment','Commercial','Composite'),
('rescue','evacuation','RE-301','便携式逃生软梯','Portable escape ladder','ladder.svg','Portable · Two-storey','Residential','Aluminium'),
('rescue','evacuation','RE-302','紧急疏散标识','Emergency exit sign','exit.svg','LED · Directional','Commercial','ABS'),
('rescue','lighting','RL-401','便携式救援照明灯','Portable response light','torch.jpg','LED · Handheld','Industrial','Aluminium'),
('rescue','lighting','RL-402','应急照明灯','Emergency twin-spot light','light.svg','LED · Battery backup','Commercial','ABS')]
products=[dict(zip(['cat','sub','id','zh','en','img','spec','use','material'],row)) for row in rows]
(R/'data.js').write_text('window.CATEGORIES='+json.dumps(cats,ensure_ascii=False)+';\nwindow.PRODUCTS='+json.dumps(products,ensure_ascii=False)+';',encoding='utf-8')
shell='''<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="Explore fire protection, security and rescue equipment. A clean, product-focused safety catalogue prototype."><meta name="theme-color" content="#102c40"><title>{title} | SENTRA Safety</title><link rel="icon" href="{base}assets/favicon.svg"><link rel="stylesheet" href="{base}style.css"><link rel="stylesheet" href="{base}modern.css"><script>window.PAGE={config};window.BASE='{base}';</script><script defer src="{base}data.js"></script><script defer src="{base}app.js"></script></head><body><a class="skip" href="#main">Skip to content</a><header id="header"></header><main id="main"></main><footer id="footer"></footer><dialog id="quote-dialog" aria-labelledby="dialog-title"></dialog><div id="toast" role="status" aria-live="polite"></div></body></html>'''
pages=[('index.html','Home',{'type':'home'}),('products/index.html','Products',{'type':'catalog','cat':'all'}),('solutions.html','Solutions',{'type':'solutions'}),('resources.html','Resources',{'type':'resources'}),('about.html','About us',{'type':'about'}),('contact.html','Contact us',{'type':'contact'}),('quote.html','Your enquiry',{'type':'quote'})]
for c in cats:
 pages.append((f'products/{c[0]}.html',c[2],{'type':'catalog','cat':c[0]}))
 for s in c[5]:pages.append((f'products/{c[0]}/{s[0]}.html',s[2],{'type':'catalog','cat':c[0],'sub':s[0]}))
for p in products:pages.append((f'product/{p["id"].lower()}.html',p['en'],{'type':'detail','id':p['id']}))
for file,title,config in pages:
 out=R/file;out.parent.mkdir(parents=True,exist_ok=True);base='../'*len(Path(file).parts[:-1]);out.write_text(shell.format(title=title,config=json.dumps(config),base=base),encoding='utf-8')
print(f'Generated {len(pages)} HTML pages')
