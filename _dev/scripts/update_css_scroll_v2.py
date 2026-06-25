import re

with open('styles/main.css', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add overflow-y: auto to html, body and body
content = re.sub(
    r'(html, body \{[^}]*?)(overflow-x:\s*hidden;)([^}]*?\})',
    r'\1\2\n    overflow-y: auto;\3',
    content,
    flags=re.DOTALL
)

# 2. Ensure main containers have overflow-y: auto
if 'main, #main-content, #form-content' not in content:
    fix_css = """
/* Fix for inputs being blocked by user-select: none */
input, textarea, select {
    user-select: auto !important;
    -webkit-user-select: auto !important;
}

/* Ensure main containers allow scroll */
main, #main-content, #form-content {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
}
"""
    # Append to the top of the file right after body
    content = re.sub(
        r'(body\s*\{[^}]*?\})',
        r'\1\n' + fix_css,
        content,
        count=1,
        flags=re.DOTALL
    )

with open('styles/main.css', 'w', encoding='utf-8') as f:
    f.write(content)

print("CSS updated successfully.")
