import os
import re

def fix_drawer():
    with open('admin.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # Find the start and end of the old drawer
    start_str = '<!-- IMAGE PREVIEW DRAWER -->'
    end_str = '        <div class="image-drawer-overlay" id="image-drawer-overlay"></div>'
    
    start_idx = html.find(start_str)
    end_idx = html.find(end_str)
    
    if start_idx != -1 and end_idx != -1:
        # Remove everything from start_str to just before end_str
        html = html[:start_idx] + html[end_idx:]

    with open('admin.html', 'w', encoding='utf-8') as f:
        f.write(html)

fix_drawer()
