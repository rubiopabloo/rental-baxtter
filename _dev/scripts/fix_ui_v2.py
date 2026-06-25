import os

def fix_html():
    with open('admin.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Hide hamburger button in mobile header
    mobile_header_old = '''            <header class="mobile-main-header">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <button id="btn-open-sidebar" aria-label="Abrir Men">
                        <i data-lucide="menu" style="width: 24px; height: 24px;"></i>
                    </button>
                    <span style="font-weight: 700; font-size: 1.1rem;">Panel Lateral</span>
                </div>'''
    # Note: we need to use exact matching but the console might have encoding issues, so let's match safely
    mobile_header_old = mobile_header_old.replace('Men', 'Menú')
    
    # Actually, we can just replace the whole div via regex or string slice
    import re
    # Match the div containing btn-open-sidebar
    html = re.sub(r'<div style="display: flex; align-items: center; gap: 12px;">\s*<button id="btn-open-sidebar" aria-label="Abrir Men(?:|ú|&#250;)">\s*<i data-lucide="menu" style="width: 24px; height: 24px;"></i>\s*</button>\s*<span style="font-weight: 700; font-size: 1.1rem;">Panel Lateral</span>\s*</div>', 
                  '<div style="display: flex; align-items: center; gap: 12px; visibility: hidden;"><button id="btn-open-sidebar"><i data-lucide="menu"></i></button></div>', html)

    # 2. Add id="icon-collapse" to chevron
    chevron_old = '''<button id="btn-collapse-sidebar" class="desktop-only-btn" title="Ocultar panel" style="background: none; border: none; cursor: pointer; color: #888; padding: 4px; display: flex; align-items: center; justify-content: center; margin-left: auto;">
                    <i data-lucide="chevron-left" style="width: 20px; height: 20px;"></i>
                </button>'''
    chevron_new = '''<button id="btn-collapse-sidebar" class="desktop-only-btn" title="Ocultar panel" style="background: none; border: none; cursor: pointer; color: #888; padding: 4px; display: flex; align-items: center; justify-content: center; margin-left: auto;">
                    <i data-lucide="chevron-left" id="icon-collapse" style="width: 20px; height: 20px;"></i>
                </button>'''
    html = html.replace(chevron_old, chevron_new)

    # 3. Update sidebar footer (PDF, Vaciar, User, Logout)
    # Using regex to capture the whole block securely
    footer_pattern = r'<div class="sidebar-footer">.*?Cerrar Sesi(?:|ó|&#243;)n\s*</button>\s*</div>'
    
    footer_new = '''<div class="sidebar-footer" style="display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <button class="sidebar-item" id="btn-descargar-pdf" title="Exportar a PDF" style="background: #000; color: #fff; font-weight: 600; justify-content: center; padding: 10px;">
                        <i data-lucide="download" style="color: #fff;"></i> PDF
                    </button>
                    <button class="sidebar-item" id="btn-vaciar-todo" title="Vaciar todas las solicitudes" style="background: #ef4444; color: #ffffff; font-weight: 600; justify-content: center; padding: 10px;">
                        <i data-lucide="trash-2" style="color: #ffffff;"></i> Vaciar
                    </button>
                </div>
                
                <div class="user-profile-widget" style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; cursor: default; margin-top: 8px;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;" id="user-avatar-initial">A</div>
                    <div class="user-profile-text" style="display: flex; flex-direction: column;">
                        <span id="logged-in-user-name" style="font-weight: 600; font-size: 0.9rem; color: #111;">Admin</span>
                        <span id="logged-in-user-email" style="font-size: 0.75rem; color: #666; display: none;">admin@rental.com</span>
                    </div>
                </div>

                <button class="sidebar-item" id="btn-logout" title="Cerrar Sesi&oacute;n" style="justify-content: center;">
                    <i data-lucide="log-out"></i> Cerrar Sesi&oacute;n
                </button>
            </div>'''
    
    html = re.sub(footer_pattern, footer_new, html, flags=re.DOTALL)

    # Also, there's a `<div id="logged-in-user"` floating somewhere? No, it's inside the footer.

    with open('admin.html', 'w', encoding='utf-8') as f:
        f.write(html)

fix_html()
