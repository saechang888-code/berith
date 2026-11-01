# 베리트365 한 해 통독표 만들기 — 유튜브 베리트365 채널의 「N월의베리트」 재생목록에서
# 날짜별 영상·본문 범위를 모아 data/plan.json 으로 쓴다 (일정 달력에서 날짜를 누르면 그날 영상이 뜨게).
# 사용: python scripts/plan.py   (재생목록이 바뀌었을 때만 다시 돌리면 된다)
import json, re, os, urllib.request
import sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from update import get, oembed, DATA

BOOKS = {}
for code, name in re.findall(r"(\w+) (\S+) \d+", open(os.path.join(os.path.dirname(DATA), 'js', 'app.js'), encoding='utf-8').read().split('const BOOKS = (')[1].split(".split('|')")[0]):
    BOOKS[name] = code

def playlists():
    h = get('https://www.youtube.com/@berith365/playlists')
    return list(dict.fromkeys(re.findall(r'"playlistId":"(PLotwPr_[A-Za-z0-9_-]+)"', h)))

def videos(pl):
    h = get('https://www.youtube.com/playlist?list=' + pl)
    t = re.search(r'<meta property="og:title" content="([^"]*)"', h)
    if not t or '베리트' not in t.group(1): return []
    return list(dict.fromkeys(re.findall(r'"videoId":"([A-Za-z0-9_-]{11})"', h)))

def parse(vid):
    title = oembed(vid)   # 예: 11월 1일, 305일차(D-061) 사도행전 1-3장_베리트365
    m = re.match(r'\s*(\d+)월\s*(\d+)일,\s*(\d+)일차\(D-(\d+)\)\s*(.+?)_베리트', title)
    if not m: return None
    mo, d, day, rng = int(m.group(1)), int(m.group(2)), int(m.group(3)), m.group(5).strip()
    b = re.match(r'(\S+)\s+(\d+)(?:-(\d+))?장', rng)
    book = BOOKS.get(b.group(1), '') if b else ''
    return f'{mo:02d}-{d:02d}', {'day': day, 'range': rng, 'video': vid, 'book': book,
                                 'start': int(b.group(2)) if b else 0, 'end': int(b.group(3) or b.group(2)) if b else 0}

if __name__ == '__main__':
    path = os.path.join(DATA, 'plan.json')
    plan = json.load(open(path, encoding='utf-8')) if os.path.exists(path) else {}
    for pl in playlists():
        for vid in videos(pl):
            r = parse(vid)
            if r: plan[r[0]] = r[1]
    json.dump(dict(sorted(plan.items())), open(path, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('날짜 수', len(plan))
