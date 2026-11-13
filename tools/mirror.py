#!/usr/bin/env python3
"""Download public Vallfirest HTML and its original presentation assets."""
import concurrent.futures as cf, hashlib, json, re, time
from pathlib import Path
from urllib.parse import urljoin,urlsplit,unquote
import requests
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
BASE='https://www.vallfirest.com/'
HEAD={'User-Agent':'Mozilla/5.0'}
manifest={}; failures=[]; pages={}
def absolute(u,base=BASE): return urljoin(base,u.strip())
def local(u):
 p=urlsplit(u)
 if p.netloc in ('www.vallfirest.com','vallfirest.com'):
  path=unquote(p.path).lstrip('/')
  if not path or not Path(path).suffix: path=path.rstrip('/')+'/index.html' if path else 'index.html'
  return path
 ext=Path(p.path).suffix or '.css'
 return 'assets/external/'+p.netloc+'/'+hashlib.sha256(u.encode()).hexdigest()[:16]+ext

def download(u):
 target=ROOT/local(u)
 if target.exists(): return u,target.read_bytes(),True
 for i in range(3):
  try:
   r=requests.get(u,headers=HEAD,timeout=35);r.raise_for_status()
   target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(r.content)
   return u,r.content,True
  except Exception as e:
   if i==2: return u,str(e).encode(),False
 return u,b'',False

def rewrite_url(u,base):
 if not u or u.startswith(('data:','#','mailto:','tel:','javascript:','blob:')): return u
 full=absolute(u,base)
 if full in manifest:return '/'+manifest[full]+('#'+urlsplit(full).fragment if urlsplit(full).fragment else '')
 return full

def clean(s):
 for x in s.select('script'):
  src=x.get('src',''); t=x.string or x.get_text()
  if any(v in src for v in ('googletagmanager','clarity.ms','cdn-cgi')) or any(v in t for v in ('__ie_ctx__ =','clarity", "script"','__CF$cv$params')): x.decompose()
  elif "gtag('config'" in t:x.string='window.dataLayer=[]; function gtag(){};'
 for x in s.select('iframe'):
  if not x.get('src') or 'googletagmanager' in x.get('src',''):x.decompose()
 for x in s.select('link[rel=preconnect],link[rel=dns-prefetch]'):x.decompose()

def collect(s,base):
 out=set()
 for x in s.find_all(True):
  attrs=['src','poster','data-src','data-original']
  if x.name=='link' and any(v in x.get('rel',[]) for v in ('stylesheet','icon','preload')):attrs+=['href']
  for a in attrs:
   v=x.get(a)
   if v and not v.startswith(('data:','javascript:','#')):out.add(absolute(v,base))
  for v in re.findall(r'url\(\s*[\'"]?([^\)\'\"]+)',x.get('style','')):
   if not v.startswith('data:'):out.add(absolute(v,base))
  for a in ['srcset','data-srcset']:
   for item in x.get(a,'').split(','):
    if item.strip():out.add(absolute(item.strip().split()[0],base))
 return out

home=Path('/tmp/vallfirest-original.html').read_text();pages[BASE]=home
s=BeautifulSoup(home,'html.parser')
urls=set()
for a in s.select('a[href]'):
 u=absolute(a['href']);p=urlsplit(u)
 if p.netloc=='www.vallfirest.com' and p.path not in ('','/') and not p.query and not p.fragment and not Path(p.path).suffix and not p.path.startswith(('/user/','/ecommerce/')) and p.path not in ('/fr','/de','/it','/pt'):
  urls.add(u)
print('Downloading',len(urls)+1,'pages',flush=True)
with cf.ThreadPoolExecutor(max_workers=10) as pool:
 for u,data,ok in pool.map(download,sorted(urls)):
  if ok:pages[u]=data.decode('utf-8',errors='replace')
  else:failures.append({'url':u,'error':data.decode()})
manifest.update({u:local(u) for u in pages})
assets=set()
for u,h in pages.items():
 soup=BeautifulSoup(h,'html.parser');clean(soup);assets|=collect(soup,u)
seen=set(); raw={}
for round in range(5):
 batch=assets-seen
 if not batch:break
 print('Asset round',round+1,':',len(batch),flush=True);seen|=batch
 with cf.ThreadPoolExecutor(max_workers=12) as pool:
  for u,data,ok in pool.map(download,sorted(batch)):
   if ok:
    manifest[u]=local(u)
    if '.css' in urlsplit(u).path or 'fonts.googleapis.com' in u:
     text=data.decode('utf-8',errors='replace');raw[u]=text
     for v in re.findall(r'url\(\s*[\'"]?([^\)\'\"]+)',text):
      if not v.startswith(('data:','#')):assets.add(absolute(v,u))
     for v in re.findall(r'@import\s+[\'"]([^\'"]+)',text):assets.add(absolute(v,u))
   else:failures.append({'url':u,'error':data.decode()})
for u,text in raw.items():
 text=re.sub(r'url\(\s*([\'\"]?)([^\)\'\"]+)\1\s*\)',lambda m:'url("'+rewrite_url(m[2],u)+'")',text)
 (ROOT/local(u)).write_text(text)
for u,h in pages.items():
 soup=BeautifulSoup(h,'html.parser');clean(soup)
 for x in soup.find_all(True):
  for a in ['src','href','poster','data-src','data-original','action']:
   if x.has_attr(a):x[a]=rewrite_url(x[a],u)
  for a in ['srcset','data-srcset']:
   if x.has_attr(a):x[a]=', '.join(' '.join([rewrite_url(t.strip().split()[0],u)]+t.strip().split()[1:]) for t in x[a].split(',') if t.strip())
  if x.has_attr('style'):x['style']=re.sub(r'url\(\s*[\'"]?([^\)\'\"]+)[\'"]?\s*\)',lambda m:'url("'+rewrite_url(m[1],u)+'")',x['style'])
 # Original presentation code remains; local adapter handles backend-only operations.
 if soup.head:
  st=soup.new_tag('link',rel='stylesheet',href='/local.css');soup.head.append(st)
  sc=soup.new_tag('script',src='/local.js');soup.head.insert(0,sc)
 target=ROOT/local(u);target.parent.mkdir(parents=True,exist_ok=True);target.write_text(str(soup))
(ROOT/'manifest.json').write_text(json.dumps({'source':BASE,'pages':{u:local(u) for u in pages},'assets':manifest,'failures':failures},ensure_ascii=False,indent=2))
print('DONE',len(pages),'pages',len(manifest),'files;',len(failures),'failures',flush=True)
