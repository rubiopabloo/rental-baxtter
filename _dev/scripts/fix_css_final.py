import os

def fix_css():
    with open('styles/main.css', 'r', encoding='utf-8') as f:
        css = f.read()

    # Fix overlay class
    css = css.replace('.image-drawer-overlay.active {', '.image-drawer-overlay.active, .image-drawer-overlay.show {')
    
    # Fix drawer transform logic
    drawer_old = '''.image-drawer {
    position: fixed; top: 0; right: -500px; width: 400px; max-width: 90vw; bottom: 0;
    background: #fff; z-index: 9999; box-shadow: -4px 0 15px rgba(0,0,0,0.1);
    transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.image-drawer.active { right: 0; }'''
    drawer_new = '''.image-drawer {
    position: fixed; top: 0; right: 0; width: 400px; max-width: 90vw; bottom: 0;
    background: #fff; z-index: 9999; box-shadow: -4px 0 15px rgba(0,0,0,0.1);
    transform: translateX(100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.image-drawer.active { transform: translateX(0); }'''
    css = css.replace(drawer_old, drawer_new)

    # Fix calendar responsiveness
    cal_old = '''@media (max-width: 1024px) {
    #panel-calendario > div:nth-child(2) { flex-direction: column; overflow-y: auto; }
    .calendar-sidebar { width: 100% !important; flex-shrink: 0; }
    #main-calendar-grid > div { min-height: 80px; }
}'''
    cal_new = '''@media (max-width: 1024px) {
    #panel-calendario > div:nth-child(2) { flex-direction: column; overflow-y: auto; }
    .calendar-sidebar { width: 100% !important; flex-shrink: 0; }
    #main-calendar-grid > div { min-height: 80px; }
    .calendar-main-view > div:first-child { min-width: 600px; } /* Force horizontal scroll */
    .calendar-main-view { overflow-x: auto; -webkit-overflow-scrolling: touch; }
}'''
    css = css.replace(cal_old, cal_new)

    with open('styles/main.css', 'w', encoding='utf-8') as f:
        f.write(css)

fix_css()
