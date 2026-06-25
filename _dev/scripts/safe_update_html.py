import os

def safe_update_html():
    with open('admin.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Update the sidebar top header (ASCII only!)
    header_old = '<div class="sidebar-header">'
    header_new = '''<div class="sidebar-header">
                <img src="/assets/images/logo-black.png" alt="Rental Baxtter" class="sidebar-logo" style="height: 32px;">
                <div style="flex-grow: 1;"></div>
                <button class="desktop-only-btn" id="btn-pwa-reload-desktop" title="Recargar datos" style="background: none; border: none; cursor: pointer; color: #888; padding: 4px;">
                    <i data-lucide="refresh-cw" style="width: 18px; height: 18px;"></i>
                </button>
                <button class="desktop-only-btn" id="btn-collapse-sidebar" style="background: none; border: none; cursor: pointer; color: #888; padding: 4px;">
                    <i data-lucide="chevron-left" id="icon-collapse"></i>
                </button>
                <button class="mobile-only-btn" id="btn-close-sidebar" style="background: none; border: none; cursor: pointer; color: #888;">
                    <i data-lucide="x"></i>
                </button>
            </div>'''
    # We replace from <div class="sidebar-header"> up to the next </div>
    # Actually, simpler: replace the whole block by exact string matching the fd3a942 version.
    # fd3a942 sidebar-header was:
    sidebar_header_old = '''            <div class="sidebar-header">
                <img src="/assets/images/logo-black.png" alt="Rental Baxtter" class="sidebar-logo">
                <button class="mobile-only-btn" id="btn-close-sidebar">
                    <i data-lucide="x"></i>
                </button>
            </div>'''
    html = html.replace(sidebar_header_old, header_new)

    # 2. Update sidebar navigation
    nav_old = '''                <button class="sidebar-item" data-target="panel-temporada">
                    <i data-lucide="calendar-cog"></i> Temporada y Semanas
                </button>'''
    nav_new = '''                <button class="sidebar-item" data-target="panel-temporada" title="Configurar inicio y fin de la temporada y semanas activas">
                    <i data-lucide="calendar-cog"></i> Temporada y Semanas
                </button>
                <button class="sidebar-item" data-target="panel-calendario" title="Calendario Operativo">
                    <i data-lucide="calendar-days"></i> Calendario
                </button>'''
    html = html.replace(nav_old, nav_new)

    # 3. Update the Sidebar Footer
    footer_old = '''            <div class="sidebar-footer">
                <div class="user-profile">
                    <div class="user-avatar" id="user-avatar">A</div>
                    <div class="user-info">
                        <span class="user-name" id="logged-in-user">Cargando...</span>
                    </div>
                </div>
                <button class="sidebar-item" id="btn-logout">
                    <i data-lucide="log-out"></i> Cerrar Sesi&oacute;n
                </button>
            </div>'''
    footer_new = '''            <div class="sidebar-footer">
                <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
                    <button class="sidebar-item" id="btn-descargar-pdf" title="Exportar a PDF" style="background: #000; color: #fff; font-weight: 600; justify-content: center; padding: 10px; border-radius: 6px;">
                        <i data-lucide="download" style="color: #fff;"></i> PDF
                    </button>
                    <button class="sidebar-item" id="btn-vaciar-todo" title="Vaciar todas las solicitudes" style="background: #ef4444; color: #ffffff; font-weight: 600; justify-content: center; padding: 10px; border-radius: 6px;">
                        <i data-lucide="trash-2" style="color: #ffffff;"></i> Vaciar
                    </button>
                </div>
                <div class="user-profile-widget" style="display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); background: #f9f9f9; margin-bottom: 12px;">
                    <div style="width: 36px; height: 36px; border-radius: 50%; background: #000; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; flex-shrink: 0;" id="user-avatar-initial">A</div>
                    <div style="display: flex; flex-direction: column; overflow: hidden;" class="user-profile-text">
                        <span id="logged-in-user-name" style="font-size: 0.9rem; font-weight: 600; color: var(--text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Admin</span>
                        <span id="logged-in-user-email" style="font-size: 0.75rem; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: none;"></span>
                    </div>
                </div>
                <button class="sidebar-item" id="btn-logout" title="Cerrar sesi&oacute;n de administrador">
                    <i data-lucide="log-out"></i> Cerrar Sesi&oacute;n
                </button>
            </div>'''
    html = html.replace(footer_old, footer_new)

    # 4. Remove Mobile Main Header entirely
    mobile_header_old = '''        <header class="mobile-main-header">
            <button id="btn-open-sidebar">
                <i data-lucide="menu"></i>
            </button>
            <div class="mobile-logo-text">Panel Lateral</div>
            <button class="btn-pwa-reload-mobile" id="btn-pwa-reload">
                <i data-lucide="refresh-cw"></i>
            </button>
        </header>'''
    html = html.replace(mobile_header_old, '')

    # 5. Add Calendar HTML (before <!-- PANEL: CONFIGURACION -->)
    calendar_html = '''                <!-- PANEL: CALENDARIO -->
                <div id="panel-calendario" class="content-panel hidden" style="height: calc(100vh - 40px); display: flex; flex-direction: column;">
                    <div class="admin-top-bar" style="margin-bottom: 16px;">
                        <div>
                            <h2 style="font-size: 1.8rem; margin-bottom: 4px; display: flex; align-items: center; gap: 12px;"><i data-lucide="calendar-days" style="color: #000; width: 28px; height: 28px;"></i> Calendario Operativo</h2>
                            <p style="color: #888; font-size: 0.9rem;">Organiza eventos, llegadas y actividades del operativo de alquiler.</p>
                        </div>
                        <div class="admin-filter-controls">
                            <button class="action-btn-black" id="btn-export-ics" style="display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 8px;">
                                <i data-lucide="link-2" style="width: 18px; height: 18px;"></i> Obtener Enlace (.ics)
                            </button>
                            <button class="action-btn-black" id="btn-add-event" style="display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 8px;">
                                <i data-lucide="plus" style="width: 18px; height: 18px;"></i> Nuevo Evento
                            </button>
                        </div>
                    </div>

                    <div style="flex-grow: 1; display: flex; gap: 24px; min-height: 0;">
                        <!-- Sidebar del calendario -->
                        <div style="width: 250px; background: #fff; border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto;" class="calendar-sidebar">
                            <div class="calendar-month-selector" style="display: flex; justify-content: space-between; align-items: center;">
                                <button id="btn-prev-month" style="background: none; border: none; cursor: pointer; padding: 4px;"><i data-lucide="chevron-left" style="width: 20px; height: 20px;"></i></button>
                                <strong id="calendar-current-month" style="font-size: 1.1rem;">Julio 2026</strong>
                                <button id="btn-next-month" style="background: none; border: none; cursor: pointer; padding: 4px;"><i data-lucide="chevron-right" style="width: 20px; height: 20px;"></i></button>
                            </div>
                            <div id="mini-calendar" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; font-size: 0.75rem; color: #555;">
                                <div style="font-weight: 600;">Lu</div><div style="font-weight: 600;">Ma</div><div style="font-weight: 600;">Mi</div><div style="font-weight: 600;">Ju</div><div style="font-weight: 600;">Vi</div><div style="font-weight: 600;">Sa</div><div style="font-weight: 600;">Do</div>
                            </div>
                            <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 0;">
                            <div>
                                <h4 style="font-size: 0.85rem; color: #888; text-transform: uppercase; margin-bottom: 12px;">Categor&iacute;as</h4>
                                <div style="display: flex; flex-direction: column; gap: 10px; font-size: 0.9rem;">
                                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;"><input type="checkbox" checked class="cal-filter" value="llegada"> <span style="width: 12px; height: 12px; border-radius: 50%; background: #3b82f6;"></span> Llegada Colegio</label>
                                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;"><input type="checkbox" checked class="cal-filter" value="operativo"> <span style="width: 12px; height: 12px; border-radius: 50%; background: #ef4444;"></span> Operativo</label>
                                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;"><input type="checkbox" checked class="cal-filter" value="reunion"> <span style="width: 12px; height: 12px; border-radius: 50%; background: #10b981;"></span> Reuni&oacute;n L&iacute;deres</label>
                                </div>
                            </div>
                        </div>

                        <!-- Grilla Principal -->
                        <div style="flex-grow: 1; background: #fff; border: 1px solid var(--border-color); border-radius: 12px; display: flex; flex-direction: column; overflow: hidden;" class="calendar-main-view">
                            <div style="display: grid; grid-template-columns: repeat(7, 1fr); border-bottom: 1px solid var(--border-color); background: #f8fafc; text-align: center; font-weight: 600; font-size: 0.85rem; color: #555; padding: 12px 0;">
                                <div>Lunes</div><div>Martes</div><div>Mi&eacute;rcoles</div><div>Jueves</div><div>Viernes</div><div>S&aacute;bado</div><div>Domingo</div>
                            </div>
                            <div id="main-calendar-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); grid-auto-rows: minmax(100px, 1fr); flex-grow: 1; overflow-y: auto;">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- MODAL DE EVENTO -->
                <div id="modal-event" class="sidebar-overlay" style="z-index: 10003; display: none; align-items: center; justify-content: center;">
                    <div style="background: #fff; width: 90%; max-width: 400px; border-radius: 12px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
                        <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 1.2rem;" id="modal-event-title">Nuevo Evento</h3>
                        <div style="display: flex; flex-direction: column; gap: 16px;">
                            <div>
                                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px;">T&iacute;tulo del Evento</label>
                                <input type="text" id="ev-titulo" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 0.9rem; outline: none;" placeholder="Ej: Llegada San Agust&iacute;n">
                            </div>
                            <div style="display: flex; gap: 12px;">
                                <div style="flex: 1;">
                                    <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px;">Fecha</label>
                                    <input type="date" id="ev-fecha" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 0.9rem; outline: none;">
                                </div>
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px;">Categor&iacute;a</label>
                                <select id="ev-categoria" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 0.9rem; outline: none;">
                                    <option value="llegada">Llegada Colegio</option>
                                    <option value="operativo">Operativo</option>
                                    <option value="reunion">Reuni&oacute;n L&iacute;deres</option>
                                </select>
                            </div>
                        </div>
                        <div style="display: flex; gap: 12px; margin-top: 24px;">
                            <button id="btn-save-event" style="flex: 1; background: #000; color: #fff; border: none; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer;">Guardar</button>
                            <button id="btn-cancel-event" style="flex: 1; background: #f4f6f8; color: #333; border: 1px solid var(--border-color); padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer;">Cancelar</button>
                        </div>
                    </div>
                </div>

                <!-- PANEL: CONFIGURACION -->'''
    html = html.replace('<!-- PANEL: CONFIGURACION -->', calendar_html)

    # 6. Add Image Drawer Carousel HTML (Before <!-- Supabase SDK & Config -->)
    drawer_html = '''    <div class="image-drawer-overlay" id="image-drawer-overlay"></div>
    <div class="image-drawer" id="image-drawer" style="display: flex; flex-direction: column;">
        <div class="image-drawer-header">
            <h3>Fotos de la Prenda</h3>
            <div>
                <button class="action-btn-black" id="btn-download-all-images" style="margin-right: 12px; padding: 6px 12px;">
                    <i data-lucide="download" style="width: 16px; height: 16px;"></i> Descargar
                </button>
                <button id="btn-close-drawer" style="background: none; border: none; cursor: pointer; color: #888;">
                    <i data-lucide="x"></i>
                </button>
            </div>
        </div>
        <div class="image-drawer-content" id="image-drawer-gallery" style="flex-grow: 1; position: relative; display: flex; align-items: center; justify-content: center; padding: 0; background: #000;">
            <button id="drawer-prev-btn" style="position: absolute; left: 10px; background: rgba(0,0,0,0.5); color: #fff; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center;"><i data-lucide="chevron-left"></i></button>
            <img id="drawer-main-image" src="" style="max-width: 100%; max-height: 100%; object-fit: contain;">
            <button id="drawer-next-btn" style="position: absolute; right: 10px; background: rgba(0,0,0,0.5); color: #fff; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center;"><i data-lucide="chevron-right"></i></button>
            <div id="drawer-image-counter" style="position: absolute; bottom: 20px; background: rgba(0,0,0,0.7); color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem;">1 / 1</div>
        </div>
    </div>

    <!-- Supabase SDK & Config -->'''
    html = html.replace('<!-- Supabase SDK & Config -->', drawer_html)
    
    with open('admin.html', 'w', encoding='utf-8') as f:
        f.write(html)

safe_update_html()
