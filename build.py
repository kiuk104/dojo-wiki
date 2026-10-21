"""Dojo Wiki 빌드 — src/<분류>/guide.md 를 <분류>/guide.html 로 만들고, 허브·검색 색인·서비스 워커를 갱신한다.

사용:  python build.py            (전체)
       python build.py vscode     (한 분류만 — 허브·색인·sw는 항상 다시 만든다)
필요:  pip install markdown
"""
import re, html, sys, json, os, hashlib, datetime, markdown

ROOT = os.path.dirname(os.path.abspath(__file__))
P = lambda *a: os.path.join(ROOT, *a)
NOW = datetime.datetime.now(datetime.timezone.utc)
BUILD = NOW.strftime('%Y%m%d%H%M%S')
TODAY = (NOW + datetime.timedelta(hours=2)).strftime('%Y-%m-%d')

games = json.load(open(P('topics.json'), encoding='utf-8'))
meta_path = P('data', 'meta.json')
meta = json.load(open(meta_path, encoding='utf-8')) if os.path.exists(meta_path) else {}
only = sys.argv[1:]


def inline(t):
    return re.sub(r'^<p>|</p>$', '', markdown.markdown(t))


def render_body(body):
    text = '\n'.join(l for l in body if l.strip() != '---')
    text = re.sub(r'~~(.+?)~~', r'<del>\1</del>', text)
    h = markdown.markdown(text, extensions=['tables', 'fenced_code'])
    # 코드 블록(```)은 따로 보관 — 아래의 <code>→<kbd> 변환은 글 속 짧은 코드에만
    pres = []
    def keep_pre(m):
        pres.append(m.group(0).replace('<pre><code', '<pre class="code"><code'))
        return '\x00PRE%d\x00' % (len(pres) - 1)
    h = re.sub(r'<pre><code.*?</code></pre>', keep_pre, h, flags=re.S)
    h = h.replace('<h4>', '<h5 class="ssub">').replace('</h4>', '</h5>')
    h = h.replace('<h5>', '<h6>')
    h = re.sub(r'<code>(.*?)</code>', r'<kbd>\1</kbd>', h, flags=re.S)
    h = h.replace('<table>', '<div class="tw"><table>').replace('</table>', '</table></div>')
    h = re.sub(r'<a href="(http[^"]+)">', r'<a href="\1" target="_blank" rel="noopener">', h)

    def bq(m):
        inner = m.group(1).strip()
        txt = re.sub('<[^>]+>', '', inner)
        cls = 'warn' if re.search('⚠️|주의|정정|❗', txt[:80]) else ('tip' if re.search('💡|⭐|🎁|꿀팁', txt[:40]) else 'note')
        return '<aside class="%s">%s</aside>' % (cls, inner)
    h = re.sub(r'<blockquote>(.*?)</blockquote>', bq, h, flags=re.S)
    h = h.replace('\n', '')
    return re.sub(r'\x00PRE(\d+)\x00', lambda m: pres[int(m.group(1))], h)


def plain_text(s):
    t = re.sub(r'<[^>]+>', ' ', s)
    return re.sub(r'\s+', ' ', html.unescape(t)).strip()


def live_links(g):
    """파일이 실제로 있는 링크만 (아직 안 올린 매뉴얼 등은 숨김)"""
    return [l for l in g.get('links', []) if os.path.exists(P(g['id'], l['href']))]


def sync_source(g):
    """topics.json 의 source(외부 원본 md)가 있으면 빌드 전에 src/<id>/guide.md 로 자동 복사한다."""
    src = g.get('source')
    if not src or not os.path.exists(src):
        return
    dst = P('src', g['id'], 'guide.md')
    new = open(src, encoding='utf-8').read()
    old = open(dst, encoding='utf-8').read() if os.path.exists(dst) else None
    if new != old:
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        open(dst, 'w', encoding='utf-8').write(new)
        print('%-26s source -> src/%s/guide.md' % (g['id'], g['id']))


def load_status(g):
    """src/<id>/status.json (선택: 진행 현황 상자). 없으면 None."""
    p = P('src', g['id'], 'status.json')
    if not os.path.exists(p):
        return None
    st = json.load(open(p, encoding='utf-8'))
    for x in st.get('stats', []):
        v, mx = x.get('v'), x.get('max')
        if isinstance(v, (int, float)):
            if mx:
                x['_txt'] = '%s / %s' % (v, mx)
                x['_pct'] = max(1, min(100, round(v / mx * 100)))
            else:
                x['_txt'] = '%s%s' % (v, (' ' + x['unit']) if x.get('unit') else '')
                x['_pct'] = max(1, min(100, round(v))) if x.get('unit') == '%' else None
        else:
            x['_txt'], x['_pct'] = str(v), None
    return st


def render_status(g):
    """status.json → 가이드 상단 진행 현황 상자 HTML. json 이 없으면 예전 방식(status.html)을 그대로 쓴다."""
    st = load_status(g)
    if st is None:
        p = P('src', g['id'], 'status.html')
        return open(p, encoding='utf-8').read() if os.path.exists(p) else ''
    hd = html.escape(st.get('where', ''))
    if st.get('updated'):
        hd += ('%s%s 기준' % (' · ' if hd else '', html.escape(st['updated'])))
    cells = []
    for x in st.get('stats', []):
        hot = ' hot' if x.get('hot') else ''
        bar = ('<div class="bar"><i%s style="width:%d%%"></i></div>' % (' class="warn"' if x.get('hot') else '', x['_pct'])) if x['_pct'] else ''
        cells.append('        <div class="stat"><div class="k">%s</div><div class="v%s">%s</div>%s</div>'
                     % (html.escape(x['k']), hot, html.escape(x['_txt']), bar))
    return ('    <div class="status">\n      <div class="hd"><b>%s</b><span>%s</span></div>\n'
            '      <div class="stats">\n%s\n      </div>\n    </div>\n'
            % (html.escape(st.get('title', '현재 진행 현황')), hd, '\n'.join(cells)))


def git_date(path):
    """파일이 마지막으로 커밋된 날짜(YYYY-MM-DD). 미커밋 변경이 있거나 git 이 없으면 None → 오늘."""
    import subprocess
    try:
        if subprocess.run(['git', 'status', '--porcelain', '--', path], cwd=ROOT, capture_output=True, text=True).stdout.strip():
            return None
        d = subprocess.run(['git', 'log', '-1', '--format=%cs', '--', path], cwd=ROOT, capture_output=True, text=True).stdout.strip()
        return d or None
    except Exception:
        return None


def build_game(g):
    sync_source(g)
    md = open(P('src', g['id'], 'guide.md'), encoding='utf-8').read()
    lines = md.split('\n')
    assert lines[0].startswith('# '), 'md 첫 줄은 "# 제목" 이어야 해요'
    blocks, cur, in_code = [], [0, None, []], False
    for ln in lines[1:]:
        if ln.startswith('```'):
            in_code = not in_code
        m = None if in_code else re.match(r'^(#{1,3}) (.+)$', ln)
        if m:
            blocks.append(cur)
            cur = [len(m.group(1)), m.group(2).strip(), []]
        else:
            cur[2].append(ln)
    blocks.append(cur)

    nav, secs, index = [], [], []
    n = 0
    for lvl, title, body in blocks:
        bh = render_body(body)
        if lvl == 0:
            if not re.sub('<[^>]+>', '', bh).strip():
                continue
            bid, head, tplain = 'intro', '', '소개'
        else:
            n += 1
            pre, tag, cls, navc = {1: ('p', 'h2', 'part', 'nav0'), 2: ('s', 'h3', 'sec', 'nav1'), 3: ('q', 'h4', 'sub', 'nav2')}[lvl]
            bid = pre + str(n)
            # 제목 끝의 {#이름} → 바뀌지 않는 주소 (코딩Dojo 레슨 링크용)
            sm = re.search(r'\s*\{#([a-z0-9-]+)\}\s*$', title)
            if sm:
                bid, title = sm.group(1), title[:sm.start()]
            th = inline(title)
            head = '<%s class="%s" id="%s">%s</%s>' % (tag, cls, bid, th, tag)
            tplain = plain_text(th)
            navtxt = html.escape(tplain)
            nav.append('<a class="%s" href="#%s" title="%s"><span class="nt">%s</span></a>' % (navc, bid, navtxt, navtxt))
        ptxt = plain_text(head + bh)
        s_attr = html.escape(' ' + ptxt.lower() + ' ', quote=True)
        secs.append('<section class="blk" id="blk-%s" data-s="%s">%s%s</section>' % (bid, s_attr, head, bh))
        if lvl >= 2 or lvl == 0:
            index.append({'g': g['id'], 'h': bid, 't': tplain, 'x': plain_text(bh)[:1200]})

    qs = [int(x) for x in re.findall(r'^### Q(\d+)\.', md, flags=re.M)]
    npages = len(re.findall(r'^## ', md, flags=re.M))
    qtxt = '페이지 %d개' % npages
    src_note = g.get('source') or ('src/%s/guide.md' % g['id'])
    foot = '%s · %s<br>원본: %s — 문서가 갱신되면 이 페이지도 다시 발행됩니다.' % (html.escape(g['title']), qtxt, html.escape(src_note))

    status = render_status(g)
    st = load_status(g) or {}
    brand_sub = st.get('sub') or g.get('brand_sub', '')
    extra = ''
    for l in live_links(g):
        if l.get('label'):
            extra += '    <a class="btn xlink" href="%s">%s</a>\n' % (l['href'], html.escape(l['label']))

    fsg = {'id': g['id']}
    if g.get('keys'):
        fsg['keys'] = g['keys']
    if g.get('cloudField'):
        fsg['cloudField'] = g['cloudField']

    tpl = open(P('templates', 'guide.html'), encoding='utf-8').read()
    rep = {
        'GAME_ID': g['id'], 'TITLE': html.escape(g['title']), 'GAME_EN': html.escape(g['en']),
        'BRAND_SUB': html.escape(brand_sub), 'DESC': html.escape(g.get('desc', ''), quote=True),
        'BUILD': BUILD, 'V': BUILD, 'NAV': '\n'.join(nav), 'STATUS': status, 'CONTENT': '\n'.join(secs),
        'FOOT': foot, 'EXTRA_LINKS': extra, 'SEARCH_HINT': html.escape(g.get('search_hint', '검색'), quote=True),
        'FSG_JSON': json.dumps(fsg, ensure_ascii=False),
    }
    out = re.sub(r'\{\{([A-Z_]+)\}\}', lambda m: rep[m.group(1)], tpl)
    os.makedirs(P(g['id']), exist_ok=True)
    open(P(g['id'], 'guide.html'), 'w', encoding='utf-8').write(out)

    h = hashlib.sha1(md.encode('utf-8')).hexdigest()
    m = meta.get(g['id'], {})
    if m.get('hash') != h:
        m = {'hash': h, 'updated': git_date(P('src', g['id'], 'guide.md')) or TODAY}
    m.update({'pages': npages, 'q': len(qs), 'sections': sum(1 for b in blocks if b[0] in (2, 3)), 'qmax': max(qs) if qs else 0})
    meta[g['id']] = m
    print('%-26s blocks %3d  Q %3d' % (g['id'], len(secs), len(qs)))
    return index


def index_tab_pages(g):
    """탭으로 나뉜 부가 페이지(예: 대항해시대 II 매뉴얼)를 허브 검색 색인에 넣는다."""
    out = []
    for l in live_links(g):
        if l.get('search') != 'tabs':
            continue
        s = open(P(g['id'], l['href']), encoding='utf-8').read()
        s = re.sub(r'data:image[^"\')]+', '', s)
        names = dict(re.findall(r"switchTab\('([\w-]+)',this\)\">(.*?)</button>", s))
        parts = re.split(r'<div class="tab-content[^"]*" id="tab-([\w-]+)"', s)
        for i in range(1, len(parts), 2):
            tid, body = parts[i], re.sub(r'<script.*?</script>|<style.*?</style>', '', parts[i + 1], flags=re.S)
            title = '%s — %s' % (l['hub'], plain_text(names.get(tid, tid)))
            out.append({'g': g['id'], 'p': l['href'], 'h': 'tab-' + tid, 't': title, 'x': plain_text(body)[:3000]})
    return out


def build_hub():
    order = [g for g in games if g.get('playing')] + [g for g in games if not g.get('playing')]
    cards = []
    for g in order:
        m = meta.get(g['id'], {})
        stat = ('페이지 %d개' % m['pages']) if m.get('pages') else '아직 비어 있음'
        links = ''.join('<a href="%s/%s">%s</a>' % (g['id'], l['href'], html.escape(l['hub'])) for l in live_links(g))
        badge = '<span class="badge">자주 봄</span>' if g.get('playing') else ''
        st = load_status(g) or {}
        prog = ''
        if st:
            line = ' · '.join(x for x in (st.get('sub'), st.get('where')) if x)
            first = next((x for x in st.get('stats', []) if x.get('_pct')), None)
            bar = ('<span class="card-bar" title="%s %s"><i style="width:%d%%"></i></span>'
                   % (html.escape(first['k'], quote=True), html.escape(first['_txt'], quote=True), first['_pct'])) if first else ''
            prog = '<span class="card-prog">📍 %s%s</span>' % (html.escape(line), bar)
        # 대표 이미지: <id>/cover.jpg 가 있으면 썸네일로, 없으면 글자 타일
        thumb = ('<img class="cover" src="%s/cover.jpg?v=%s" alt="" width="60" height="90" loading="lazy">' % (g['id'], BUILD)
                 if os.path.exists(P(g['id'], 'cover.jpg')) else
                 '<span class="mono" aria-hidden="true">%s</span>' % html.escape(g['mono']))
        cards.append(
            '<article class="card" data-game="%(id)s">'
            '<a class="card-main" href="%(id)s/guide.html">'
            '%(thumb)s'
            '<span class="card-tx"><span class="card-en">%(en)s</span><span class="card-name">%(name)s</span>'
            '<span class="card-title">%(title)s</span>%(prog)s</span></a>'
            '<div class="card-ft"><span class="card-stat">%(badge)s%(stat)s · %(upd)s 갱신</span>%(links)s</div>'
            '</article>' % {'id': g['id'], 'thumb': thumb, 'en': html.escape(g['en']),
                            'name': html.escape(g['name']), 'title': html.escape(g['title']), 'badge': badge, 'prog': prog,
                            'stat': stat, 'upd': (m.get('updated', TODAY)[5:].replace('-', '.')),
                            'links': ('<span class="card-links">%s</span>' % links) if links else ''})
    names = {g['id']: g['name'] for g in games}
    tpl = open(P('templates', 'hub.html'), encoding='utf-8').read()
    rep = {'BUILD': BUILD, 'V': BUILD, 'CARDS': '\n'.join(cards), 'COUNT': str(len(games)),
           'NAMES': json.dumps(names, ensure_ascii=False)}
    open(P('index.html'), 'w', encoding='utf-8').write(re.sub(r'\{\{([A-Z_]+)\}\}', lambda m: rep[m.group(1)], tpl))


def build_sw():
    core = ['./', './index.html', './manifest.webmanifest', './shared/fokus.css', './shared/core.js',
            './shared/guide.js', './shared/sync.js', './shared/fonts.js', './icons/icon-192.png', './icons/favicon.svg']
    core += ['./%s/guide.html' % g['id'] for g in games]
    core += ['./%s/cover.jpg' % g['id'] for g in games if os.path.exists(P(g['id'], 'cover.jpg'))]
    tpl = open(P('templates', 'sw.js'), encoding='utf-8').read()
    open(P('sw.js'), 'w', encoding='utf-8').write(tpl.replace('{{BUILD}}', BUILD).replace('{{CORE}}', json.dumps(core)))


if __name__ == '__main__':
    search = json.load(open(P('data', 'search.json'), encoding='utf-8')) if os.path.exists(P('data', 'search.json')) else []
    for g in games:
        if only and g['id'] not in only:
            continue
        idx = build_game(g) + index_tab_pages(g)
        search = [s for s in search if s['g'] != g['id']] + idx
    known = {g['id'] for g in games}
    search = [s for s in search if s['g'] in known]
    os.makedirs(P('data'), exist_ok=True)
    json.dump(search, open(P('data', 'search.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    json.dump(meta, open(meta_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    build_hub()
    build_sw()
    print('build', BUILD)
