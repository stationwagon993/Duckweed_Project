cd "$(dirname "$0")" && python3 - <<'PY'
parts=[open('page_head.html').read(),'<script>\n',open('dash.js').read(),'</script>\n',
'<script type="importmap">\n{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}\n</script>\n<script type="module">\n',
open('a_head.js').read(),open('b_core.js').read(),open('c_geom.js').read(),open('d_scene.js').read(),open('b_post.js').read(),open('e_loop.js').read(),'</script>\n</body>\n</html>\n']
html=''.join(parts)
open('index.html','w').write(html)
# hosted artifact copy: the publisher adds its own document skeleton
import re
a=html.replace('<!doctype html>\n','').replace('<html lang="en">\n','').replace('<head>\n','').replace('</head>\n','').replace('</body>\n','').replace('</html>\n','')
a=a.replace('<meta charset="utf-8">\n','').replace('<meta name="viewport" content="width=device-width, initial-scale=1">\n','')
a=re.sub(r'<body[^>]*>\n', '', a, count=1)
a=a.replace('<script>\n', '<script>window.DW_ARTIFACT = true;</script>\n<script>\n', 1)
open('artifact.html','w').write(a)
PY
