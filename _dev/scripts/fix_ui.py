import os

def fix_html():
    with open('admin.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # Add Calendar Button to Sidebar
    btn_old = '''                <button class="sidebar-item" data-target="panel-temporada" title="Configurar inicio y fin de la temporada y semanas activas">
                    <i data-lucide="calendar-cog"></i> Temporada y Semanas
                </button>'''
    
    btn_new = '''                <button class="sidebar-item" data-target="panel-temporada" title="Configurar inicio y fin de la temporada y semanas activas">
                    <i data-lucide="calendar-cog"></i> Temporada y Semanas
                </button>
                <button class="sidebar-item" data-target="panel-calendario" title="Calendario Operativo">
                    <i data-lucide="calendar-days"></i> Calendario
                </button>'''
    
    if btn_old in html and 'data-target="panel-calendario"' not in html:
        html = html.replace(btn_old, btn_new)

    with open('admin.html', 'w', encoding='utf-8') as f:
        f.write(html)

def fix_css():
    with open('styles/main.css', 'r', encoding='utf-8') as f:
        css = f.read()

    drawer_css = '''
/* Image Drawer Styles */
.image-drawer-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5); z-index: 9998;
    opacity: 0; pointer-events: none; transition: opacity 0.3s;
}
.image-drawer-overlay.active { opacity: 1; pointer-events: auto; }
.image-drawer {
    position: fixed; top: 0; right: -500px; width: 400px; max-width: 90vw; bottom: 0;
    background: #fff; z-index: 9999; box-shadow: -4px 0 15px rgba(0,0,0,0.1);
    transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.image-drawer.active { right: 0; }
.drawer-header {
    padding: 16px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; background: #f8fafc;
}
.drawer-header h3 { font-size: 1.1rem; font-weight: 600; margin: 0; color: #1e293b; }
.btn-icon { background: none; border: none; cursor: pointer; color: #64748b; border-radius: 4px; padding: 4px; transition: background 0.2s, color 0.2s; }
.btn-icon:hover { background: #e2e8f0; color: #0f172a; }
.drawer-content { padding: 16px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; }
.drawer-image-container { position: relative; width: 100%; max-width: 350px; background: #f1f5f9; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; min-height: 250px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
.drawer-main-image { max-width: 100%; max-height: 70vh; object-fit: contain; }
.drawer-nav { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.4); color: white; border: none; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s; }
.drawer-nav:hover { background: rgba(0,0,0,0.7); }
.drawer-nav.left { left: 8px; }
.drawer-nav.right { right: 8px; }
.drawer-counter { margin-top: 12px; font-size: 0.9rem; color: #64748b; font-weight: 500; }
.drawer-footer { padding: 16px; border-top: 1px solid #e2e8f0; background: #f8fafc; text-align: center; }
'''
    if '.image-drawer-overlay' not in css:
        css += '\\n' + drawer_css

    with open('styles/main.css', 'w', encoding='utf-8') as f:
        f.write(css)

fix_html()
fix_css()
