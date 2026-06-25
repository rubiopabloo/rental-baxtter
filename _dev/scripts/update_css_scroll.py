import re

with open('styles/main.css', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove overflow: hidden from body.admin-dashboard
content = re.sub(
    r'(body\.admin-dashboard\s*\{[^}]*?)overflow:\s*hidden\s*!important;',
    r'\1',
    content,
    flags=re.DOTALL
)

# 2. Fix the corrupted content at the end of the file
# "i m g  \n   - w e b k i t - u s e r - d r a g :   n o n e ;   p o i n t e r - e v e n t s :   n o n e ;"
content = re.sub(
    r'i m g\s+- w e b k i t - u s e r - d r a g :   n o n e ;   p o i n t e r - e v e n t s :   n o n e ;\s*',
    'img {\n    -webkit-user-drag: none;\n    pointer-events: none;\n}\n',
    content,
    flags=re.DOTALL
)

with open('styles/main.css', 'w', encoding='utf-8') as f:
    f.write(content)
