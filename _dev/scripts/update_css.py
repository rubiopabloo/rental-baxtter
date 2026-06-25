import os

def update_css():
    with open('styles/main.css', 'r', encoding='utf-8') as f:
        css = f.read()

    # 1. Update the sidebar transition for better animation
    css = css.replace('transition: transform 0.3s ease;', 'transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);')
    css = css.replace('transition: width 0.3s ease;', 'transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);')
    css = css.replace('transition: width 0.3s;', 'transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);')

    # 2. Add New Styles
    new_css = '''
/* Shadcn Profile Widget */
.user-profile-widget:hover { background-color: #f1f5f9; border-color: #cbd5e1; }
.admin-layout.sidebar-collapsed .user-profile-widget { padding: 8px 0; justify-content: center; border: none; background: transparent; }
.admin-layout.sidebar-collapsed .user-profile-text { display: none !important; }
.admin-layout.sidebar-collapsed .sidebar-item { gap: 0 !important; }
.admin-layout.sidebar-collapsed .desktop-only-btn { margin: 0 auto; }

/* Calendar Styles */
.calendar-main-view { font-family: inherit; }
.calendar-main-view > div:first-child > div { border-right: 1px solid var(--border-color); }
.calendar-main-view > div:first-child > div:last-child { border-right: none; }
#main-calendar-grid > div { border-right: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); padding: 8px; min-height: 120px; position: relative; cursor: pointer; transition: background 0.2s; }
#main-calendar-grid > div:nth-child(7n) { border-right: none; }
#main-calendar-grid > div:hover { background: #f8fafc; }
#main-calendar-grid > div.out-of-month { background: #fdfdfd; color: #ccc; }
.cal-event { font-size: 0.75rem; padding: 4px 6px; border-radius: 4px; margin-bottom: 4px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; }
.cal-event.llegada { background-color: #3b82f6; }
.cal-event.operativo { background-color: #ef4444; }
.cal-event.reunion { background-color: #10b981; }
@media (max-width: 1024px) {
    #panel-calendario > div:nth-child(2) { flex-direction: column; overflow-y: auto; }
    .calendar-sidebar { width: 100% !important; flex-shrink: 0; }
    #main-calendar-grid > div { min-height: 80px; }
}

/* Hide desktop mobile header if somehow rendered */
@media (min-width: 769px) {
    .mobile-main-header { display: none !important; }
}
'''
    css += '\\n' + new_css
    
    with open('styles/main.css', 'w', encoding='utf-8') as f:
        f.write(css)

update_css()
