# 베리트365 앱 자료 갱신 — 깃허브 액션이 날마다 돌린다 (사람이 돌려도 됨: python scripts/update.py)
# 1) 오늘의 베리트: 지금 운영 중인 berith365.com 의 '오늘' 쪽에서 영상 주소·본문 범위를 읽는다
# 2) 이주의 설교: 새암교회 유튜브(@seamvision)에서 가장 최근 '주일예배' 영상을 찾는다
import json, re, os, urllib.request, urllib.parse, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data')
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36',
      'Accept-Language': 'ko-KR,ko;q=0.9'}
KST = datetime.timezone(datetime.timedelta(hours=9))

def get(u):
    return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30).read().decode('utf-8', 'replace')

def oembed(vid):
    try:
        return json.loads(get('https://www.youtube.com/oembed?format=json&url=' + urllib.parse.quote('https://youtu.be/' + vid)))['title']
    except Exception:
        return ''

def load(name, default):
    try:
        with open(os.path.join(DATA, name), encoding='utf-8') as f: return json.load(f)
    except Exception:
        return default

def save(name, obj):
    with open(os.path.join(DATA, name), 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)

def today():
    h = get('https://berith365.com/berith/today')
    m = re.search(r'<div id="videoData"(.*?)>', h, re.S)
    if not m: return None
    a = dict(re.findall(r'data-([a-z-]+)="([^"]*)"', m.group(1)))
    vid = re.search(r'(?:youtu\.be/|v=)([A-Za-z0-9_-]{11})', a.get('video-url', ''))
    if not vid: return None
    vid = vid.group(1)
    title = oembed(vid)                       # 예: 11월 1일, 305일차(D-061) 사도행전 1-3장_베리트365
    t = re.match(r'\s*(\d+)월 (\d+)일, (\d+)일차\(D-(\d+)\) (.+?)_베리트365', title)
    return {'date': datetime.datetime.now(KST).strftime('%Y-%m-%d'),
            'day': int(t.group(3)) if t else int(a.get('video-no') or 0),
            'dleft': int(t.group(4)) if t else None,
            'range': t.group(5) if t else '',
            'book': a.get('book-id', ''), 'start': int(a.get('bible-start') or 0), 'end': int(a.get('bible-end') or 0),
            'video': vid, 'title': title}

def sermon():
    h = get('https://www.youtube.com/@seamvision/videos')
    for vid in list(dict.fromkeys(re.findall(r'"videoId":"([A-Za-z0-9_-]{11})"', h)))[:20]:
        title = oembed(vid)                   # 예: 언약을 율법이 폐기치 못하리라 | 용인새암교회 26년 10월 25일 주일예배 | 이재선 목사
        p = [s.strip() for s in title.split('|')]
        if len(p) >= 2 and '주일예배' in p[1]:
            d = re.search(r'(\d+)년 (\d+)월 (\d+)일', p[1])
            return {'video': vid, 'title': p[0], 'when': f'{int(d.group(2))}월 {int(d.group(3))}일 주일예배' if d else p[1],
                    'preacher': p[2] if len(p) > 2 else ''}
    return None

if __name__ == '__main__':
    os.makedirs(DATA, exist_ok=True)
    t = today()
    if t and t['video']:
        save('today.json', t)
        hist = load('history.json', {})
        hist[t['date']] = {k: t[k] for k in ('day', 'range', 'book', 'start', 'end', 'video')}
        save('history.json', dict(sorted(hist.items())))
        plan = load('plan.json', {})   # 일정 달력의 '그날 영상'도 함께 채운다
        plan[t['date'][5:]] = {k: t[k] for k in ('day', 'range', 'video', 'book', 'start', 'end')}
        save('plan.json', dict(sorted(plan.items())))
        print('오늘:', t['title'])
    s = sermon()
    if s:
        save('sermon.json', s)
        print('설교:', s['title'], s['when'])
