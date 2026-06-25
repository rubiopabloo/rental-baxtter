// ============================================================
// Admin Panel â€” Rental Baxtter
// XSS protection via escapeHtml (SECURITY_GUIDE.md Â§2.2)
// ============================================================

// DOM Elements
const loginScreen = document.getElementById('admin-login-screen');
const dashboardScreen = document.getElementById('admin-dashboard-screen');
const loginForm = document.getElementById('admin-login-form');
const tbody = document.getElementById('requests-tbody');
const filterStatus = document.getElementById('filter-status');

// Elementos de Gestión de Colegios y Semana
const displaySemana = document.getElementById('display-semana');
const schoolListContainer = document.getElementById('school-list-container');
const schoolStatsContainer = document.getElementById('school-stats');
const localDateTimeSpan = document.getElementById('local-date-time');

const sidebarItems = document.querySelectorAll('.sidebar-item[data-target]');
const panels = document.querySelectorAll('.content-panel');
const btnOpenSidebar = document.getElementById('btn-open-sidebar');
const btnCloseSidebar = document.getElementById('btn-close-sidebar');
const btnCollapseSidebar = document.getElementById('btn-collapse-sidebar');
const adminSidebar = document.getElementById('admin-sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const adminLayout = document.getElementById('admin-dashboard-screen');

function switchPanel(panelId) {
    // Hide all panels
    panels.forEach(p => p.classList.remove('active', 'hidden'));
    panels.forEach(p => p.classList.add('hidden'));
    
    // Deactivate all sidebar items
    sidebarItems.forEach(item => item.classList.remove('active'));

    // Show target panel
    const targetPanel = document.getElementById(panelId);
    if (targetPanel) {
        targetPanel.classList.remove('hidden');
        targetPanel.classList.add('active');
    }

    // Activate corresponding sidebar item
    const activeItem = Array.from(sidebarItems).find(item => item.getAttribute('data-target') === panelId);
    if (activeItem) {
        activeItem.classList.add('active');
    }

    // Custom behaviors when opening specific panels
    if (panelId === 'panel-configuracion') {
        loadHistoricalReports();
        loadConfigOpciones();
    }

    // Close mobile sidebar if open
    closeSidebar();
}

function openSidebar() {
    if (window.innerWidth <= 768) {
        if (adminSidebar) adminSidebar.classList.add('open');
        if (sidebarOverlay) sidebarOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    } else {
        if (adminLayout) adminLayout.classList.toggle('sidebar-collapsed');
    }
}

function closeSidebar() {
    if (adminSidebar) adminSidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('show');
    document.body.style.overflow = '';
}

// Setup Event Listeners
sidebarItems.forEach(item => {
    item.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-target');
        if (target) switchPanel(target);
    });
});

if (btnOpenSidebar) btnOpenSidebar.addEventListener('click', openSidebar);
if (btnCloseSidebar) btnCloseSidebar.addEventListener('click', closeSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);
if (btnCollapseSidebar) btnCollapseSidebar.addEventListener('click', () => {
    if (adminLayout) adminLayout.classList.toggle('sidebar-collapsed');
    const collapseIcon = document.getElementById('icon-collapse');
    if (collapseIcon) {
        if (adminLayout.classList.contains('sidebar-collapsed')) {
            collapseIcon.setAttribute('data-lucide', 'chevron-right');
        } else {
            collapseIcon.setAttribute('data-lucide', 'chevron-left');
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
});

// Touch swipe gestures for mobile sidebar
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
}, false);

document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    if (window.innerWidth <= 768) {
        const swipeDistance = touchEndX - touchStartX;
        if (swipeDistance > 50 && touchStartX < 50) {
            // Swipe right from left edge -> open sidebar
            openSidebar();
        } else if (swipeDistance < -50) {
            // Swipe left -> close sidebar
            closeSidebar();
        }
    }
}, false);

// Variables antiguas de configuracion
const btnCalendario = document.getElementById('btn-calendario');
const togglePausa = document.getElementById('config-toggle-pausa');
const inputInicioSem1 = document.getElementById('config-input-inicio-sem1');
const inputFinSem1 = document.getElementById('config-input-fin-sem1');
const btnGuardarTemporada = document.getElementById('btn-config-guardar-temporada');
const temporadaBadge = document.getElementById('temporada-badge');

const DEFAULT_WSP_TEMPLATE = 'Hola {LIDER}, te escribo del Rental de Baxtter. Tenemos un pedido para el pasajero {PASAJERO} (cambio de {PRENDA} por {MOTIVO}). Te explicaremos los pasos a seguir en breve.';
const DEFAULT_HOTELES = 'Aguas del sur, Bariloche SKI, Cambria, Monteclaro, Patagonia LAGO, Patagonia SUR, Alt interlaken';

async function loadConfigOpciones() {
    const wspInput = document.getElementById('config-wsp-full-template');
    const hotelesInput = document.getElementById('config-hoteles-list');

    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('temporada_config')
                .select('wsp_template, hoteles_list')
                .eq('id', 1)
                .single();

            if (!error && data) {
                if (wspInput) wspInput.value = data.wsp_template || DEFAULT_WSP_TEMPLATE;
                if (hotelesInput) hotelesInput.value = data.hoteles_list || DEFAULT_HOTELES;
                return;
            }
        } catch (e) {
            // log suppressed
        }
    }

    // Fallback to localStorage
    if (wspInput) wspInput.value = localStorage.getItem('config_wsp_full_template') || DEFAULT_WSP_TEMPLATE;
    if (hotelesInput) hotelesInput.value = localStorage.getItem('config_hoteles_list') || DEFAULT_HOTELES;
}

async function getWspTemplate() {
    if (supabaseClient) {
        try {
            const { data } = await supabaseClient
                .from('temporada_config')
                .select('wsp_template')
                .eq('id', 1)
                .single();
            if (data && data.wsp_template) return data.wsp_template;
        } catch (e) {
            // log suppressed
        }
    }
    return localStorage.getItem('config_wsp_full_template') || DEFAULT_WSP_TEMPLATE;
}

// Bindeo del guardado de opciones adicionales
document.addEventListener('DOMContentLoaded', () => {
    const btnGuardarOpciones = document.getElementById('btn-config-guardar-opciones');
    if (btnGuardarOpciones) {
        btnGuardarOpciones.addEventListener('click', async () => {
            const wspTemplate = document.getElementById('config-wsp-full-template').value.trim();
            const hotelesVal = document.getElementById('config-hoteles-list').value.trim();

            if (supabaseClient) {
                try {
                    const { error } = await supabaseClient
                        .from('temporada_config')
                        .update({
                            wsp_template: wspTemplate,
                            hoteles_list: hotelesVal
                        })
                        .eq('id', 1);
                    if (error) throw error;
                } catch (e) {
                    // log suppressed
                    // Fallback: save locally too
                    localStorage.setItem('config_wsp_full_template', wspTemplate);
                    localStorage.setItem('config_hoteles_list', hotelesVal);
                }
            } else {
                localStorage.setItem('config_wsp_full_template', wspTemplate);
                localStorage.setItem('config_hoteles_list', hotelesVal);
            }

            hzToast('Opciones guardadas con éxito.', 'success');
        });
    }

    const searchInput = document.getElementById('config-search-reportes');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            if (window.allHistoricalReports) {
                const filtered = window.allHistoricalReports.filter(r => 
                    r.semana_nombre.toLowerCase().includes(query) || 
                    new Date(r.created_at).toLocaleDateString().includes(query)
                );
                renderHistoricalReports(filtered);
            }
        });
    }
});

// Tracking states
const ESTADOS_SIMPLES = ['Pendiente', 'Resuelto'];

// ============================================================
// XSS Prevention (SECURITY_GUIDE.md Â§2.2)
// NEVER use innerHTML with user data without escaping
// ============================================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(text)));
    return div.innerHTML;
}

// ============================================================
// Authentication (SECURITY_GUIDE.md Â§3.1)
// Uses Supabase Auth when available, localStorage mock otherwise
// ============================================================

// Check if already logged in via Supabase Auth session
async function checkExistingSession() {
    if (!supabaseClient) return;
    
    // Set up auth state change listener FIRST
    supabaseClient.auth.onAuthStateChange((event, session) => {
        const dbStatusBadge = document.getElementById('db-status-badge');
        if (session) {
            if (dbStatusBadge) {
                dbStatusBadge.textContent = 'En línea';
                dbStatusBadge.style.backgroundColor = '#10b981';
            }
            // Do not call showDashboard here to avoid infinite loops, but ensure UI reflects connected state
            if (loginScreen && !loginScreen.classList.contains('hidden')) {
                showDashboard();
            }
        } else {
            if (dbStatusBadge) {
                dbStatusBadge.textContent = 'Sin conexión';
                dbStatusBadge.style.backgroundColor = '#ef4444';
            }
            if (dashboardScreen && !dashboardScreen.classList.contains('hidden')) {
                dashboardScreen.classList.add('hidden');
                loginScreen.classList.remove('hidden');
            }
        }
    });

    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();

        if (error) throw error;

        if (session) {
            // Sesión activa: mostrar el panel
            showDashboard();
        }
    } catch (err) {
        // Sin sesión activa o sin conexión: se queda en la pantalla de login
    }
}

checkExistingSession();

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('admin-username');
    const passInput = document.getElementById('admin-password');

    const email = emailInput.value.trim().toLowerCase();
    const pass = passInput.value;

    if (!email || !pass) {
        hzToast('Completá email y contraseña.', 'error');
        return;
    }

    if (!supabaseClient) {
        hzToast('El servicio no está disponible en este momento. Intentá más tarde.', 'error');
        return;
    }

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Ingresando...';

    try {
        // Login directo con el email registrado en Supabase Auth
        const { error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: pass
        });

        if (error) {
            // Mensaje genérico: no se exponen detalles del proveedor de auth
            hzToast('Usuario o contraseña incorrectos.', 'error');
        }
        // Si es exitoso, onAuthStateChange se encarga de mostrar el panel.
    } catch (err) {
        hzToast('No se pudo iniciar sesión. Revisá tu conexión e intentá de nuevo.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
});

function showDashboard() {
    loginScreen.classList.add('hidden');
    dashboardScreen.classList.remove('hidden');
    try { window.history.replaceState(null, '', '/admin'); } catch(e) {}
    
    // Iniciar Reloj Local
    startClock();
    updateLoggedInUserWidget();
    
    // Cargar Datos Iniciales (async fetching without blocking)
    renderTable();
    updateStats();
    loadWeek();
    loadSchools();
    loadLideres();
    loadLideresOperativo();
    
    // Suscribir al admin a notificaciones push
    suscribirNotificacionesAdmin();
}

async function logout() {
    if (supabaseClient) {
        try {
            await supabaseClient.auth.signOut();
        } catch (err) {
            // log suppressed
        }
    }
    localStorage.removeItem('admin_logged_in');
    localStorage.removeItem('admin_user');
    dashboardScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    try { window.history.replaceState(null, '', '/login'); } catch(e) {}
}

// 1. Reloj en tiempo real
function startClock() {
    function updateClock() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateStr = now.toLocaleDateString('es-ES', options);
        const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        if (localDateTimeSpan) {
            const capitalizedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
            localDateTimeSpan.textContent = `${capitalizedDate} - ${timeStr}`;
        }
    }
    updateClock();
    setInterval(updateClock, 1000);
}

async function getRequests() {
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('pedidos')
                .select(`
                    id,
                    fecha,
                    estado,
                    motivo,
                    observaciones,
                    lider_id,
                    pasajeros (
                        nombre,
                        dni,
                        colegio,
                        hotel,
                        habitacion,
                        lider_coordinador
                    ),
                    items (
                        foto_url_1,
                        foto_url_2,
                        foto_url_3,
                        tipo_prenda,
                        motivo,
                        observaciones
                    )
                `)
                .eq('semana_archivada', false);

            if (error) {
                throw error;
            }
            
            const mapped = data.map(req => {
                // Build items array (multiple prendas per order)
                const items = (req.items || []).map(item => ({
                    tipo_prenda: item.tipo_prenda || 'No especificada',
                    motivo: item.motivo || req.motivo || 'No especificado',
                    observaciones: item.observaciones || '',
                    foto_url_1: item.foto_url_1 || null,
                    foto_url_2: item.foto_url_2 || null,
                    foto_url_3: item.foto_url_3 || null,
                }));

                return {
                    id: req.id,
                    nombre: req.pasajeros?.nombre || 'Desconocido',
                    dni: req.pasajeros?.dni || '',
                    colegio: req.pasajeros?.colegio || '',
                    hotel: req.pasajeros?.hotel || '',
                    habitacion: req.pasajeros?.habitacion || '',
                    lider_coordinador: req.pasajeros?.lider_coordinador || '',
                    items: items,
                    // Legacy single-prenda fields for backward compat
                    prenda: items[0]?.tipo_prenda || 'No especificada',
                    motivo: req.motivo || items[0]?.motivo || 'No especificado',
                    obs: req.observaciones || '',
                    fecha: req.fecha,
                    estado: req.estado,
                    lider_id: req.lider_id
                };
            });

            // --- AUTO-ASIGNACIÃ“N AUTOMÃTICA DE LÃDER ---
            if (window.lideresCache && window.lideresCache.length > 0) {
                for (const req of mapped) {
                    if (!req.lider_id && req.colegio) {
                        const colLower = req.colegio.trim().toLowerCase();
                        const matchedLider = window.lideresCache.find(l => {
                            if (!l.colegios_asignados) return false;
                            const cols = l.colegios_asignados.split(',').map(c => c.trim().toLowerCase());
                            return cols.includes(colLower);
                        });
                        if (matchedLider) {
                            req.lider_id = matchedLider.id;
                            supabaseClient
                                .from('pedidos')
                                .update({ lider_id: matchedLider.id })
                                .eq('id', req.id)
                                .then(({ error }) => {
                                    if (error) {}
                                });
                        }
                    }
                }
            }

            return mapped;
        } catch (error) {
            // log suppressed
            hzToast('No se pudieron cargar las solicitudes. Revisá tu conexión.', 'error');
            return [];
        }
    }
    
    return [];
}

async function renderTable() {
    const statusFilter = filterStatus.value;
    const allRequests = await getRequests();
    
    // Sort ascending first to assign chronological IDs
    allRequests.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    allRequests.forEach((req, index) => {
        req.displayId = '#' + (index + 1).toString().padStart(3, '0');
    });
    // Sort descending by date for display
    allRequests.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // Move 'Resuelto' status to the bottom
    allRequests.sort((a, b) => {
        if (a.estado === 'Resuelto' && b.estado !== 'Resuelto') return 1;
        if (b.estado === 'Resuelto' && a.estado !== 'Resuelto') return -1;
        return 0;
    });

    let filtered = allRequests;
    if (statusFilter !== 'Todos') {
        filtered = allRequests.filter(r => r.estado === statusFilter);
    }

    tbody.innerHTML = '';

    if (filtered.length === 0) {
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = 13;
        emptyCell.style.cssText = 'text-align: center; color: #888; padding: 20px;';
        emptyCell.textContent = 'No hay solicitudes registradas';
        emptyRow.appendChild(emptyCell);
        tbody.appendChild(emptyRow);
        return;
    }

    filtered.forEach(req => {
        const date = new Date(req.fecha);
        const formattedDate = `${date.toLocaleDateString()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        let statusClass = 'status-pendiente';
        if (req.estado === 'En proceso') statusClass = 'status-proceso';
        if (req.estado === 'Resuelto') statusClass = 'status-resuelto';

        const tr = document.createElement('tr');
        if (req.estado === 'Resuelto') {
            tr.style.backgroundColor = '#f3f4f6'; // Gris claro para filas resueltas
        }

        // --- Build each cell safely using textContent / DOM APIs ---

        // Cell: Nombre
        const tdNombre = document.createElement('td');
        const strongNombre = document.createElement('strong');
        strongNombre.textContent = req.nombre;
        tdNombre.appendChild(strongNombre);

        // Cell: DNI
        const tdDni = document.createElement('td');
        tdDni.textContent = req.dni || '-';

        // Cell: Colegio
        const tdColegio = document.createElement('td');
        tdColegio.textContent = req.colegio;

        // Cell: Líder
        const tdLider = document.createElement('td');
        const strongLider = document.createElement('strong');
        strongLider.textContent = req.lider_coordinador || 'No especificado';
        tdLider.appendChild(strongLider);

        // Cell: Hotel
        const tdHotel = document.createElement('td');
        tdHotel.textContent = req.hotel;

        // Cell: Habitación
        const tdHab = document.createElement('td');
        tdHab.textContent = req.habitacion;

        // Cell: Prendas (multiple items)
        const tdPrenda = document.createElement('td');
        if (req.items && req.items.length > 0) {
            req.items.forEach((item, idx) => {
                const prendaLine = document.createElement('div');
                prendaLine.style.cssText = 'margin-bottom: 4px;';
                const strongP = document.createElement('strong');
                strongP.textContent = item.tipo_prenda;
                prendaLine.appendChild(strongP);
                
                const motivoSpan = document.createElement('span');
                motivoSpan.style.cssText = 'display: block; font-size: 0.8rem; color: #888;';
                motivoSpan.textContent = item.motivo;
                prendaLine.appendChild(motivoSpan);

                if (item.observaciones) {
                    const obsSpan = document.createElement('small');
                    obsSpan.style.cssText = 'color: #aaa; font-style: italic; display: block;';
                    obsSpan.textContent = `"${item.observaciones}"`;
                    prendaLine.appendChild(obsSpan);
                }

                if (idx < req.items.length - 1) {
                    prendaLine.style.borderBottom = '1px solid #eee';
                    prendaLine.style.paddingBottom = '4px';
                }
                tdPrenda.appendChild(prendaLine);
            });
        } else {
            tdPrenda.textContent = req.prenda;
        }

        // Cell: Fotos (all items)
        const tdFotos = document.createElement('td');
        tdFotos.className = 'td-fotos';
        const allFotos = [];
        if (req.items && req.items.length > 0) {
            req.items.forEach(item => {
                if (item.foto_url_1) allFotos.push(item.foto_url_1);
                if (item.foto_url_2) allFotos.push(item.foto_url_2);
                if (item.foto_url_3) allFotos.push(item.foto_url_3);
            });
        }
        if (allFotos.length > 0) {
            const fotosWrapper = document.createElement('div');
            fotosWrapper.className = 'fotos-cell';
            allFotos.forEach((url, idx) => {
                const img = document.createElement('img');
                img.src = url;
                img.alt = `Foto ${idx + 1}`;
                img.className = 'foto-thumb';
                img.style.cursor = 'pointer';
                img.addEventListener('click', () => {
                    if (typeof openImageDrawer === 'function') {
                        openImageDrawer(allFotos);
                    }
                });
                fotosWrapper.appendChild(img);
            });
            tdFotos.appendChild(fotosWrapper);
        } else {
            const noFoto = document.createElement('span');
            noFoto.style.color = '#555';
            noFoto.style.fontSize = '0.8rem';
            noFoto.textContent = 'Sin fotos';
            tdFotos.appendChild(noFoto);
        }

        // Cell: Fecha
        const tdFecha = document.createElement('td');
        tdFecha.textContent = formattedDate;

        // Cell: Estado (Selector)
        const tdEstado = document.createElement('td');
        const selectEstado = document.createElement('select');
        selectEstado.className = 'seg-admin-estado-select';
        ESTADOS_SIMPLES.forEach(est => {
            const opt = document.createElement('option');
            opt.value = est;
            opt.textContent = est;
            if (req.estado === est) opt.selected = true;
            selectEstado.appendChild(opt);
        });
        selectEstado.addEventListener('change', function() {
            updateStatus(req.id, this.value);
        });
        tdEstado.appendChild(selectEstado);

        // Cell: Acciones
        const tdAcciones = document.createElement('td');
        const accionesWrapper = document.createElement('div');
        accionesWrapper.className = 'actions-cell';

        // Action buttons
        const btnGroup = document.createElement('div');
        btnGroup.className = 'btn-action-group';

        const btnRespond = document.createElement('button');
        btnRespond.className = 'btn-whatsapp-icon';
        btnRespond.title = 'Responder vía WhatsApp';
        btnRespond.style.cssText = 'display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: #25D366; color: white; border: none; cursor: pointer; margin-right: 8px;';
        btnRespond.innerHTML = `
            <i data-lucide="message-circle" style="width: 16px; height: 16px;"></i>
        `;
        
        const btnDelete = document.createElement('button');
        btnDelete.className = 'btn-action btn-action-delete';
        btnDelete.title = 'Eliminar solicitud';
        btnDelete.innerHTML = '<i data-lucide="trash-2"></i>';
        btnDelete.addEventListener('click', () => {
            deleteRequest(req.id);
        });

        btnGroup.appendChild(btnRespond);
        btnGroup.appendChild(btnDelete);

        accionesWrapper.appendChild(btnGroup);
        tdAcciones.appendChild(accionesWrapper);

        // Append all cells
        const tdNumero = document.createElement('td');
        const strongNumero = document.createElement('strong');
        strongNumero.textContent = req.displayId;
        strongNumero.style.color = 'var(--primary)';
        tdNumero.appendChild(strongNumero);
        
        if (req.estado === 'Resuelto') {
            const checkIcon = document.createElement('i');
            checkIcon.setAttribute('data-lucide', 'check-circle');
            checkIcon.style.cssText = 'color: #10b981; width: 16px; height: 16px; margin-left: 6px; vertical-align: text-bottom;';
            tdNumero.appendChild(checkIcon);
        }
        
        tr.appendChild(tdNumero);
        tr.appendChild(tdNombre);
        tr.appendChild(tdDni);
        tr.appendChild(tdColegio);
        tr.appendChild(tdLider);
        tr.appendChild(tdHotel);
        tr.appendChild(tdHab);
        tr.appendChild(tdPrenda);
        tr.appendChild(tdFotos);
        tr.appendChild(tdFecha);
        tr.appendChild(tdEstado);

        // Cell: Líder Asignado
        const tdLiderAsignado = document.createElement('td');
        const selectLider = document.createElement('select');
        selectLider.className = 'seg-admin-estado-select';
        
        const optDefault = document.createElement('option');
        optDefault.value = '';
        optDefault.textContent = 'Sin asignar';
        selectLider.appendChild(optDefault);

        (window.lideresCache || []).forEach(l => {
            const opt = document.createElement('option');
            opt.value = l.id;
            opt.textContent = l.nombre;
            if (req.lider_id == l.id) opt.selected = true;
            selectLider.appendChild(opt);
        });

        selectLider.addEventListener('change', function() {
            asignarLider(req.id, this.value || null);
        });
        
        // Conectar el botón de whatsapp aquí, para que lea el valor actual de selectLider
        btnRespond.addEventListener('click', () => {
            const prendasList = (req.items && req.items.length > 0)
                ? req.items.map(i => i.tipo_prenda).join(', ')
                : req.prenda;
            respondRequest(req.nombre, prendasList, req.motivo, selectLider.value);
        });
        
        tdLiderAsignado.appendChild(selectLider);

        tr.appendChild(tdLiderAsignado);
        tr.appendChild(tdAcciones);

        tbody.appendChild(tr);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function updateStatus(id, newStatus) {
    if (supabaseClient) {
        try {
            const { error } = await supabaseClient
                .from('pedidos')
                .update({ estado: newStatus })
                .eq('id', id);

            if (error) {
                hzToast('No se pudo actualizar el estado. Intentá de nuevo.', 'error');
                throw error;
            }
        } catch (error) {
            // log suppressed
        }
    }
    await renderTable();
    await updateStats();
}

async function deleteRequest(id) {
    if (!(await hzConfirm('¿Estás seguro de que deseas eliminar esta solicitud permanentemente?', { confirmText: 'Eliminar' }))) return;

    if (supabaseClient) {
        try {
            const { error } = await supabaseClient
                .from('pedidos')
                .delete()
                .eq('id', id);

            if (error) {
                hzToast('No se pudo eliminar la solicitud. Intentá de nuevo.', 'error');
                throw error;
            }
        } catch (error) {
            // log suppressed
        }
    }
    await renderTable();
    await updateStats();
}

async function respondRequest(nombre, prenda, motivo, liderId) {
    let finalPhone = null;
    let message = '';
    
    if (liderId && window.lideresCache) {
        const lider = window.lideresCache.find(l => l.id == liderId);
        if (lider && lider.whatsapp) {
            finalPhone = lider.whatsapp;
            
            // Read template from Supabase (synced) with fallback
            let template = await getWspTemplate();

            message = template
                .replace(/{LIDER}/g, lider.nombre)
                .replace(/{PASAJERO}/g, nombre)
                .replace(/{PRENDA}/g, prenda)
                .replace(/{MOTIVO}/g, motivo);
        }
    }

    if (!finalPhone) {
        hzToast('Asigná un líder al pedido primero para poder enviarle un WhatsApp.', 'info');
        return;
    }

    const cleanPhone = finalPhone.replace(/[^\d]/g, '');
    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
    window.open(whatsappUrl, '_blank');
}

async function updateStats() {
    let requests = [];
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('pedidos')
                .select('estado, fecha, motivo')
                .eq('semana_archivada', false);
            if (!error && data) {
                requests = data;
            }
        } catch (e) {
            // log suppressed
        }
    }
    
    const total = requests.length;
    const pendientes = requests.filter(r => r.estado === 'Pendiente').length;
    const resueltos = requests.filter(r => r.estado === 'Resuelto').length;

    const elTotal = document.getElementById('kpi-total');
    const elPendientes = document.getElementById('kpi-pendientes');
    const elResueltos = document.getElementById('kpi-resueltos');

    if (elTotal) elTotal.textContent = total;
    if (elPendientes) elPendientes.textContent = pendientes;
    if (elResueltos) elResueltos.textContent = resueltos;
    
    // Antiguos contadores (si aun existen en el html)
    const hoyCount = requests.filter(r => new Date(r.fecha).toDateString() === new Date().toDateString()).length;
    const tallesCount = requests.filter(r => r.motivo === 'Cambio de talle').length;
    const roturasCount = requests.filter(r => r.motivo && r.motivo.includes('Rotura')).length;
    const perdidasCount = requests.filter(r => r.motivo === 'Pérdida').length;

    if (document.getElementById('stat-hoy')) document.getElementById('stat-hoy').textContent = hoyCount;
    if (document.getElementById('stat-talles')) document.getElementById('stat-talles').textContent = tallesCount;
    if (document.getElementById('stat-roturas')) document.getElementById('stat-roturas').textContent = roturasCount;
    if (document.getElementById('stat-perdidas')) document.getElementById('stat-perdidas').textContent = perdidasCount;
}

window.temporadaConfig = {
    inicio: '2026-06-20',
    fin: '2026-06-27',
    pausada: true,
    colegios: ''
};

// Update the temporada status UI card
function updateTemporadaUI() {
    const badge = document.getElementById('config-temporada-estado-badge');
    const desc = document.getElementById('config-temporada-estado-desc');
    const toggleBtn = document.getElementById('btn-toggle-temporada');
    const isPaused = window.temporadaConfig.pausada;

    if (temporadaBadge) {
        if (isPaused) {
            temporadaBadge.style.display = 'inline-block';
            temporadaBadge.textContent = 'Pausada';
            temporadaBadge.style.backgroundColor = '#ef4444';
        } else {
            temporadaBadge.style.display = 'inline-block';
            temporadaBadge.textContent = 'En curso';
            temporadaBadge.style.backgroundColor = '#10b981';
        }
    }

    if (badge) {
        if (isPaused) {
            badge.textContent = 'Pausada';
            badge.style.background = '#fee2e2';
            badge.style.color = '#991b1b';
        } else {
            badge.textContent = 'En curso';
            badge.style.background = '#dcfce7';
            badge.style.color = '#166534';
        }
    }

    if (desc) {
        desc.textContent = isPaused
            ? 'La temporada está pausada. Configura las fechas e inicia cuando estés listo.'
            : 'La temporada está activa. El sistema avanzará las semanas y generará reportes automáticamente.';
    }

    if (toggleBtn) {
        if (isPaused) {
            toggleBtn.style.backgroundColor = '#10b981';
            toggleBtn.style.color = '#ffffff';
            toggleBtn.innerHTML = '<i data-lucide="play" style="width: 16px; height: 16px;"></i><span>Iniciar Temporada</span>';
        } else {
            toggleBtn.style.backgroundColor = '#ef4444';
            toggleBtn.style.color = '#ffffff';
            toggleBtn.innerHTML = '<i data-lucide="pause" style="width: 16px; height: 16px;"></i><span>Pausar Temporada</span>';
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // Update the hidden input
    const hiddenInput = document.getElementById('config-toggle-pausa');
    if (hiddenInput) hiddenInput.value = isPaused ? 'true' : 'false';
}

async function loadWeek() {
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('temporada_config')
                .select('*')
                .eq('id', 1)
                .single();
            
            if (data) {
                window.temporadaConfig = {
                    inicio: data.inicio_semana_1,
                    fin: data.fin_semana_1,
                    pausada: data.temporada_pausada,
                    colegios: data.colegios_semana || ''
                };
            }
        } catch (error) {
            // log suppressed
        }
    } else {
        const local = JSON.parse(localStorage.getItem('temporada_config'));
        if (local) window.temporadaConfig = local;
    }

    // Calcular semana actual
    let weekName = 'Semana 1';
    
    // Update temporada UI
    updateTemporadaUI();
    
    const inicioDate = new Date(window.temporadaConfig.inicio);
    const finDate = new Date(window.temporadaConfig.fin);
    const now = new Date();
    
    const inicioMs = inicioDate.getTime();
    const finMs = finDate.getTime();
    const duracionMs = finMs - inicioMs;
    
    if (duracionMs > 0 && now >= inicioDate && !window.temporadaConfig.pausada) {
        const transcurridoMs = now.getTime() - inicioMs;
        const semanaActual = Math.floor(transcurridoMs / duracionMs) + 1;
        weekName = `Semana ${semanaActual}`;
        
        // --- DETECCIÃ“N AUTOMÃTICA DE CAMBIO DE SEMANA ---
        if (now > finDate) {
            if (!window.isAdvancingWeek) {
                window.isAdvancingWeek = true;
                
                // 1. Generar reporte PDF de la semana que finaliza
                await generateWeeklyReport(weekName);
                
                // 2. Avanzar fechas
                const nuevaInicio = window.temporadaConfig.fin;
                const nuevaFinDate = new Date(finMs + duracionMs);
                const nuevaFin = nuevaFinDate.toISOString().split('T')[0];
                
                if (supabaseClient) {
                    try {
                        await supabaseClient
                            .from('temporada_config')
                            .update({
                                inicio_semana_1: nuevaInicio,
                                fin_semana_1: nuevaFin
                            })
                            .eq('id', 1);
                    } catch (e) {
                        // log suppressed
                    }
                } else {
                    localStorage.setItem('temporada_config', JSON.stringify({
                        inicio: nuevaInicio,
                        fin: nuevaFin,
                        pausada: window.temporadaConfig.pausada,
                        colegios: window.temporadaConfig.colegios
                    }));
                }
                
                // 3. Recargar estado
                window.isAdvancingWeek = false;
                setTimeout(() => loadWeek(), 1000);
                return;
            }
        }
    } else if (window.temporadaConfig.pausada) {
        weekName = 'Semana 1';
    }
    
    if (displaySemana) displaySemana.textContent = weekName;

    // Poblar inputs
    if (inputInicioSem1) inputInicioSem1.value = window.temporadaConfig.inicio;
    if (inputFinSem1) inputFinSem1.value = window.temporadaConfig.fin;
}

// Toggle temporada start/pause
document.addEventListener('DOMContentLoaded', () => {
    const btnToggle = document.getElementById('btn-toggle-temporada');
    if (btnToggle) {
        btnToggle.addEventListener('click', async () => {
            const newPausedState = !window.temporadaConfig.pausada;
            window.temporadaConfig.pausada = newPausedState;

            if (supabaseClient) {
                try {
                    await supabaseClient
                        .from('temporada_config')
                        .update({ temporada_pausada: newPausedState })
                        .eq('id', 1);
                } catch (e) {
                    // log suppressed
                }
            } else {
                localStorage.setItem('temporada_config', JSON.stringify({
                    inicio: window.temporadaConfig.inicio,
                    fin: window.temporadaConfig.fin,
                    pausada: newPausedState,
                    colegios: window.temporadaConfig.colegios
                }));
            }

            updateTemporadaUI();
            await loadWeek();
        });
    }
});

if (btnGuardarTemporada) {
    btnGuardarTemporada.addEventListener('click', async () => {
        const conf = {
            inicio_semana_1: inputInicioSem1.value,
            fin_semana_1: inputFinSem1.value,
            temporada_pausada: window.temporadaConfig.pausada,
            colegios_semana: window.temporadaConfig.colegios
        };
        
        btnGuardarTemporada.textContent = 'Guardando...';
        
        if (supabaseClient) {
            try {
                await supabaseClient.from('temporada_config').upsert([{ id: 1, ...conf }]);
            } catch(e) {
                // log suppressed
            }
        } else {
            localStorage.setItem('temporada_config', JSON.stringify({
                inicio: conf.inicio_semana_1,
                fin: conf.fin_semana_1,
                pausada: conf.temporada_pausada,
                colegios: conf.colegios_semana
            }));
        }
        
        btnGuardarTemporada.textContent = 'Guardar Configuración';
        hzToast('Configuración de temporada guardada con éxito.', 'success');
        await loadWeek();
        await loadSchools();
        switchPanel('panel-operacional');
    });
}

async function loadSchools() {
    const allRequests = await getRequests();
    const stats = {};
    let total = 0;
    
    allRequests.forEach(r => {
        if (!r.colegio) return;
        const col = r.colegio.trim();
        if (!col) return;
        
        const key = col.toLowerCase();
        if (!stats[key]) {
            stats[key] = { nombre: col, pendientes: 0, resueltos: 0, total: 0 };
        }
        stats[key].total++;
        if (r.estado === 'Resuelto') {
            stats[key].resueltos++;
        } else {
            stats[key].pendientes++;
        }
        total++;
    });
    
    // Agregar pre-cargados
    if (window.temporadaConfig && window.temporadaConfig.colegios) {
        const pre = window.temporadaConfig.colegios.split(',').map(s => s.trim()).filter(s => s);
        pre.forEach(col => {
            const key = col.toLowerCase();
            if (!stats[key]) {
                stats[key] = { nombre: col + ' (Pre-carga)', pendientes: 0, resueltos: 0, total: 0 };
            }
        });
    }

    const sortedSchools = Object.values(stats).sort((a,b) => b.total - a.total);
    renderSchools(sortedSchools, total);
}

const addColegioForm = document.getElementById('add-colegio-form');
if (addColegioForm) {
    addColegioForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('input-colegio-name');
        const colName = input.value.trim();
        if (!colName) return;

        try {
            let colegiosArr = [];
            if (window.temporadaConfig && window.temporadaConfig.colegios) {
                colegiosArr = window.temporadaConfig.colegios.split(',').map(s => s.trim()).filter(s => s);
            }
            if (!colegiosArr.some(c => c.toLowerCase() === colName.toLowerCase())) {
                colegiosArr.push(colName);
            }
            window.temporadaConfig.colegios = colegiosArr.join(', ');
            
            if (supabaseClient) {
                await supabaseClient
                    .from('temporada_config')
                    .update({ colegios_semana: window.temporadaConfig.colegios })
                    .eq('id', 1);
            } else {
                localStorage.setItem('temporada_config', JSON.stringify(window.temporadaConfig));
            }
            input.value = '';
            await loadSchools();
        } catch (err) {
            // log suppressed
            hzToast('No se pudo agregar el colegio. Intentá de nuevo.', 'error');
        }
    });
}

async function deleteSchool(schoolName) {
    if (!(await hzConfirm(`¿Estás seguro de que deseas eliminar el colegio "${schoolName}" de la semana? Se quitará de la pre-carga y de todos los pedidos activos.`, { confirmText: 'Eliminar' }))) {
        return;
    }

    try {
        // 1. Quitar de la configuración de pre-carga
        if (window.temporadaConfig && window.temporadaConfig.colegios) {
            let colegiosArr = window.temporadaConfig.colegios.split(',').map(s => s.trim()).filter(s => s);
            colegiosArr = colegiosArr.filter(c => c.toLowerCase() !== schoolName.toLowerCase());
            window.temporadaConfig.colegios = colegiosArr.join(', ');
            
            // Guardar configuración local por precaución
            localStorage.setItem('temporada_config', JSON.stringify(window.temporadaConfig));
            
            if (typeof inputColegiosSemana !== 'undefined' && inputColegiosSemana) {
                inputColegiosSemana.value = window.temporadaConfig.colegios;
            }

            if (supabaseClient) {
                await supabaseClient
                    .from('temporada_config')
                    .update({ colegios_semana: window.temporadaConfig.colegios })
                    .eq('id', 1);
            }
        }

        // 2. Limpiar en los pasajeros activos
        if (supabaseClient) {
            const { error } = await supabaseClient
                .from('pasajeros')
                .update({ colegio: '' })
                .eq('colegio', schoolName);
            if (error) throw error;
        }

        hzToast(`Colegio "${schoolName}" eliminado correctamente.`, 'success');
        
        // 3. Recargar datos
        await loadWeek();
        await loadSchools();
        if (typeof renderTable === 'function') {
            await renderTable();
        }
    } catch (e) {
        // log suppressed
        hzToast('No se pudo eliminar el colegio. Intentá de nuevo.', 'error');
    }
}

function renderSchools(schools, totalPedidos) {
    if (!schoolListContainer) return;
    schoolListContainer.innerHTML = '';
    
    if (schools.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.style.cssText = 'text-align: center; color: #888; padding: 20px;';
        emptyDiv.textContent = 'No hay colegios registrados en los pedidos de esta semana.';
        schoolListContainer.appendChild(emptyDiv);

        if (schoolStatsContainer) schoolStatsContainer.textContent = 'Total: 0';
        return;
    }

    if (schoolStatsContainer) {
        schoolStatsContainer.textContent = 'Pedidos totales con colegio asociado: ' + totalPedidos;
    }

    schools.forEach(school => {
        const item = document.createElement('div');
        item.className = 'school-item';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';

        const leftDiv = document.createElement('div');
        leftDiv.className = 'school-item-left';
        leftDiv.style.display = 'flex';
        leftDiv.style.alignItems = 'center';
        leftDiv.style.flexWrap = 'wrap';
        leftDiv.style.gap = '12px';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'school-name';
        nameSpan.textContent = `${school.nombre} (${school.total} pedidos)`;

        const statsDiv = document.createElement('div');
        statsDiv.style.cssText = 'display: flex; gap: 8px; font-size: 0.85rem; font-weight: bold; align-items: center;';
        const pSpan = document.createElement('span');
        pSpan.style.color = '#eab308'; // darker yellow/amber
        pSpan.textContent = `Pendientes: ${school.pendientes}`;
        const rSpan = document.createElement('span');
        rSpan.style.color = '#2ecc71';
        rSpan.textContent = `Resueltos: ${school.resueltos}`;
        statsDiv.appendChild(pSpan);
        statsDiv.appendChild(rSpan);

        leftDiv.appendChild(nameSpan);
        leftDiv.appendChild(statsDiv);

        const rightDiv = document.createElement('div');
        rightDiv.style.display = 'flex';
        rightDiv.style.alignItems = 'center';
        rightDiv.style.flexShrink = '0';

        // Botón para eliminar colegio
        const cleanSchoolName = school.nombre.replace(' (Pre-carga)', '');
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-danger';
        deleteBtn.style.cssText = 'padding: 4px 8px; border-radius: 6px;';
        deleteBtn.title = 'Eliminar colegio';
        deleteBtn.innerHTML = '<i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>';
        deleteBtn.onclick = async (e) => {
            e.preventDefault();
            await deleteSchool(cleanSchoolName);
        };
        
        rightDiv.appendChild(deleteBtn);

        item.appendChild(leftDiv);
        item.appendChild(rightDiv);
        schoolListContainer.appendChild(item);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.lideresCache = [];

async function loadLideres() {
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('lideres_semana').select('*').order('created_at', { ascending: true });
            if (error) throw error;
            window.lideresCache = data || [];
        } catch (e) {
            // log suppressed
        }
    } else {
        window.lideresCache = JSON.parse(localStorage.getItem('rental_lideres') || '[]');
    }
    renderLideres(window.lideresCache);
}

function renderLideres(lideres) {
    const container = document.getElementById('lider-list-container');
    if (!container) return;
    container.innerHTML = '';
    if (lideres.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">No hay líderes agregados</div>';
        return;
    }

    lideres.forEach(lider => {
        const item = document.createElement('div');
        item.className = 'school-item';
        
        const leftDiv = document.createElement('div');
        leftDiv.className = 'leader-item-left';
        leftDiv.innerHTML = `
            <div class="leader-item-left-top">
                <strong>${escapeHtml(lider.nombre)}</strong>
                <span class="leader-whatsapp">+${escapeHtml(lider.whatsapp)}</span>
            </div>
            <div class="leader-item-left-schools">
                <small>Colegios: ${escapeHtml(lider.colegios_asignados || 'Ninguno')}</small>
            </div>
        `;

        const rightDiv = document.createElement('div');
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-danger';
        deleteBtn.style.cssText = 'padding: 4px 8px; border-radius: 6px;';
        deleteBtn.title = 'Eliminar líder';
        deleteBtn.innerHTML = '<i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>';
        deleteBtn.addEventListener('click', () => deleteLider(lider.id));
        rightDiv.appendChild(deleteBtn);

        item.appendChild(leftDiv);
        item.appendChild(rightDiv);
        container.appendChild(item);
    });
    if (window.lucide) window.lucide.createIcons();
}

const addLiderForm = document.getElementById('add-lider-form');
if (addLiderForm) {
    addLiderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('input-lider-name').value.trim();
        const wsp = document.getElementById('input-lider-wsp').value.trim();
        const colegios = document.getElementById('input-lider-colegios') ? document.getElementById('input-lider-colegios').value.trim() : '';
        if (!nombre || !wsp) return;

        if (supabaseClient) {
            try {
                const { error } = await supabaseClient.from('lideres_semana').insert([{ nombre, whatsapp: wsp, colegios_asignados: colegios }]);
                if (error) throw error;
            } catch (err) {
                hzToast('No se pudo agregar el líder. Intentá de nuevo.', 'error');
            }
        } else {
            const arr = JSON.parse(localStorage.getItem('rental_lideres') || '[]');
            arr.push({ id: Date.now(), nombre, whatsapp: wsp, colegios_asignados: colegios });
            localStorage.setItem('rental_lideres', JSON.stringify(arr));
        }
        addLiderForm.reset();
        await loadLideres();
        
        // Auto-asignar colegios a los pedidos existentes sin líder asignado
        if (supabaseClient) {
            try {
                // Obtener todos los pedidos actuales sin líder
                const { data: pedidosSinLider } = await supabaseClient
                    .from('pedidos')
                    .select('id, pasajeros(colegio)')
                    .is('lider_id', null)
                    .eq('semana_archivada', false);
                
                if (pedidosSinLider && pedidosSinLider.length > 0 && colegios) {
                    const arrayColegiosLider = colegios.split(',').map(c => c.trim().toLowerCase());
                    for (const ped of pedidosSinLider) {
                        const colegioPedido = (ped.pasajeros?.colegio || '').trim().toLowerCase();
                        if (colegioPedido && arrayColegiosLider.includes(colegioPedido)) {
                            // Buscar el líder recién insertado
                            const newLider = window.lideresCache.find(l => l.nombre === nombre);
                            if (newLider) {
                                await supabaseClient.from('pedidos').update({ lider_id: newLider.id }).eq('id', ped.id);
                            }
                        }
                    }
                }
            } catch (e) {
                // log suppressed
            }
        }

        await renderTable(); // Update selects
    });
}

async function deleteLider(id) {
    if (!(await hzConfirm('¿Eliminar este líder?', { confirmText: 'Eliminar' }))) return;
    if (supabaseClient) {
        await supabaseClient.from('lideres_semana').delete().eq('id', id);
    } else {
        const arr = JSON.parse(localStorage.getItem('rental_lideres') || '[]');
        localStorage.setItem('rental_lideres', JSON.stringify(arr.filter(l => l.id !== id)));
    }
    await loadLideres();
    await renderTable();
}

// 4.b Gestión de Líderes del Operativo
// ============================================================
async function loadLideresOperativo() {
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('lideres_operativo').select('*').order('created_at', { ascending: true });
            if (error) throw error;
            window.lideresOperativoCache = data || [];
        } catch (e) {
            // log suppressed
        }
    } else {
        window.lideresOperativoCache = JSON.parse(localStorage.getItem('rental_lideres_operativo') || '[]');
    }
    renderLideresOperativo(window.lideresOperativoCache);
}

function renderLideresOperativo(lideres) {
    const container = document.getElementById('lider-operativo-list-container');
    if (!container) return;
    
    if (!lideres || lideres.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">No hay líderes en el directorio.</div>';
        return;
    }
    
    container.innerHTML = lideres.map(l => {
        let wspLink = '';
        if (l.whatsapp) {
            wspLink = `<a href="https://wa.me/${l.whatsapp.replace(/[^0-9]/g, '')}" target="_blank" class="btn-whatsapp-icon" style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: #25D366; color: white; text-decoration: none;" title="WhatsApp Directo"><i data-lucide="message-circle" style="width: 16px; height: 16px;"></i></a>`;
        }
        return `
        <div class="school-item">
            <div class="school-info">
                <span class="school-name">${escapeHtml(l.nombre)}</span>
                ${l.colegios_asignados ? `<div style="font-size: 0.75rem; color: #888; margin-top: 4px;">Colegios: ${escapeHtml(l.colegios_asignados)}</div>` : ''}
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
                ${wspLink}
                <button type="button" class="btn-danger" style="padding: 4px 8px; border-radius: 6px;" onclick="deleteLiderOperativo('${l.id}')">
                    <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                </button>
            </div>
        </div>
    `}).join('');
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

const addLiderOpForm = document.getElementById('add-lider-operativo-form');
if (addLiderOpForm) {
    addLiderOpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = addLiderOpForm.querySelector('button');
        btn.textContent = 'Guardando...';
        btn.disabled = true;

        const nombre = document.getElementById('input-op-lider-name').value.trim();
        const whatsapp = document.getElementById('input-op-lider-wsp').value.trim();
        const colegios = document.getElementById('input-op-lider-colegios').value.trim();

        if (supabaseClient) {
            try {
                await supabaseClient.from('lideres_operativo').insert([{ nombre, whatsapp, colegios_asignados: colegios }]);
            } catch(err) {
                // log suppressed
                hzToast('No se pudo guardar. Intentá de nuevo.', 'error');
            }
        } else {
            const arr = JSON.parse(localStorage.getItem('rental_lideres_operativo') || '[]');
            arr.push({ id: Date.now().toString(), nombre, whatsapp, colegios_asignados: colegios, created_at: new Date().toISOString() });
            localStorage.setItem('rental_lideres_operativo', JSON.stringify(arr));
        }

        addLiderOpForm.reset();
        await loadLideresOperativo();
        
        btn.textContent = 'Guardar en Directorio';
        btn.disabled = false;
    });
}

async function deleteLiderOperativo(id) {
    if (!(await hzConfirm('¿Eliminar este líder del directorio del operativo?', { confirmText: 'Eliminar' }))) return;
    if (supabaseClient) {
        await supabaseClient.from('lideres_operativo').delete().eq('id', id);
    } else {
        const arr = JSON.parse(localStorage.getItem('rental_lideres_operativo') || '[]');
        localStorage.setItem('rental_lideres_operativo', JSON.stringify(arr.filter(l => l.id !== id)));
    }
    await loadLideresOperativo();
}

async function asignarLider(pedidoId, liderId) {
    if (supabaseClient) {
        try {
            await supabaseClient.from('pedidos').update({ lider_id: liderId }).eq('id', pedidoId);
        } catch (e) {
            // log suppressed
        }
    }
}

// Expose functions globally
window.deleteRequest = deleteRequest;
window.respondRequest = respondRequest;
window.deleteLider = deleteLider;
window.logout = logout;
window.updateStatus = updateStatus;

// Wire up logout button
const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', logout);
}

// ---- Old Helper Removed ----
// (Configuración y Hamburguesa antigua ya no existen en el nuevo layout Notion)

// Wire up Vaciar Todo
async function handleVaciarTodo() {
    if (!(await hzConfirm('¿Estás seguro de que quieres VACIAR TODO? Esta acción eliminará permanentemente todos los pedidos (vivos y archivados), reportes anteriores, y reiniciará los contadores a cero.', { confirmText: 'Eliminar' }))) return;
    
    if (supabaseClient) {
        try {
            // 1. Intentar eliminar items (silencioso si falla la policy, se borrarán por CASCADE luego)
            const { error: errorItems } = await supabaseClient
                .from('items')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000');
            if (errorItems) {}

            // 2. Eliminar todos los registros de pedidos (ESTE TIENE POLICY EN SCHEMA)
            const { error: errorPedidos } = await supabaseClient
                .from('pedidos')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000');
            if (errorPedidos) {
                // log suppressed
                throw errorPedidos;
            }

            // 3. Intentar eliminar pasajeros huérfanos (silencioso si falla la policy)
            const { error: errorPasajeros } = await supabaseClient
                .from('pasajeros')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000');
            if (errorPasajeros) {}

            // 4. Intentar eliminar reportes (silencioso si falla la policy)
            const { error: errorReportes } = await supabaseClient
                .from('reportes_semanales')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000');
            if (errorReportes) {}
            
            // Forzar limpieza local por las dudas
            localStorage.removeItem('rental_requests');
            localStorage.removeItem('rental_reports');

            hzToast('Sistema vaciado por completo.', 'success');
            await renderTable();
            await updateStats();
            await loadSchools();
            await loadHistoricalReports();
        } catch (err) {
            // log suppressed
            // Limpieza local de respaldo en caso de fallo de Supabase
            localStorage.removeItem('rental_requests');
            localStorage.removeItem('rental_reports');
            hzToast('No se pudo vaciar el sistema en este momento. Intentá de nuevo más tarde.', 'error');
            await renderTable();
            await updateStats();
            await loadSchools();
        }
    } else {
        // Limpieza local mock
        localStorage.removeItem('rental_requests');
        localStorage.removeItem('rental_reports');
        hzToast('Datos locales del dispositivo vaciados.', 'success');
        await renderTable();
        await updateStats();
        await loadSchools();
    }
}
const btnVaciarTodo = document.getElementById('btn-vaciar-todo');
if (btnVaciarTodo) {
    btnVaciarTodo.addEventListener('click', handleVaciarTodo);
}

// Wire up Descargar PDF Actual
async function handleDescargarPdf() {
    const weekName = displaySemana ? displaySemana.textContent : 'Semana Actual';
    
    try {
        await generateWeeklyReport(weekName);
        
        // Recargar reportes anteriores para que figure en el dropdown
        await loadHistoricalReports();
        hzToast('Reporte PDF de la semana generado y guardado con éxito.', 'success');
    } catch (e) {
        // log suppressed
        hzToast('No se pudo generar el PDF. Intentá de nuevo.', 'error');
    }
}
const btnDescargarPdf = document.getElementById('btn-descargar-pdf');
if (btnDescargarPdf) {
    btnDescargarPdf.addEventListener('click', handleDescargarPdf);
}

// Periodic reload for everything (requests & schools)
setInterval(async () => {
    if (!dashboardScreen.classList.contains('hidden')) {
        await renderTable();
        await updateStats();
        await loadSchools();
        await loadHistoricalReports();
    }
}, 15000);

// Funciones de seguimiento de pedidos (historial_estados) obsoletas removidas

// Funciones de aviso colegio removidas

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const output  = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
        output[i] = rawData.charCodeAt(i);
    }
    return output;
}

async function suscribirNotificacionesAdmin() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        // log suppressed
        return;
    }

    if (typeof VAPID_PUBLIC_KEY === 'undefined' || !VAPID_PUBLIC_KEY) {
        // log suppressed
        return;
    }

    try {
        const permiso = await Notification.requestPermission();
        if (permiso !== 'granted') {
            // log suppressed
            return;
        }

        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        let suscripcion = await registration.pushManager.getSubscription();
        
        if (!suscripcion) {
            suscripcion = await registration.pushManager.subscribe({
                userVisibleOnly:      true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
        }

        // Guardar suscripcion en Supabase para vincularla al admin (numero_pasajero: 0)
        if (supabaseClient) {
            const subString = JSON.stringify(suscripcion);
            
            // Eliminar suscripciones previas idénticas para evitar duplicados masivos en Windows
            try {
                const endpointUrl = suscripcion.endpoint;
                const { data: existingSubs } = await supabaseClient
                    .from('suscripciones_push')
                    .select('id, suscripcion')
                    .eq('numero_pasajero', 0);
                    
                if (existingSubs && existingSubs.length > 0) {
                    const idsToDelete = existingSubs.filter(sub => {
                        try {
                            const parsed = typeof sub.suscripcion === 'string' ? JSON.parse(sub.suscripcion) : sub.suscripcion;
                            return parsed.endpoint === endpointUrl;
                        } catch(e) { return false; }
                    }).map(sub => sub.id);
                    
                    if (idsToDelete.length > 0) {
                        await supabaseClient.from('suscripciones_push').delete().in('id', idsToDelete);
                    }
                }
            } catch (err) {
                // log suppressed
            }

            const { error } = await supabaseClient
                .from('suscripciones_push')
                .insert({
                    numero_pasajero: 0,
                    suscripcion:     subString
                });

            if (error) {
                // log suppressed
            } else {
                // log suppressed
            }
        }
    } catch (err) {
        // log suppressed
    }
}

async function loadHistoricalReports() {
    const container = document.getElementById('config-historico-semanas-container');
    if (!container || !supabaseClient) return;

    try {
        const { data, error } = await supabaseClient
            .from('reportes_semanales')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        window.allHistoricalReports = data || [];
        
        const badge = document.getElementById('reportes-count-badge');
        if (badge) {
            badge.textContent = window.allHistoricalReports.length;
        }

        renderHistoricalReports(window.allHistoricalReports);
    } catch (err) {
        // log suppressed
        container.innerHTML = '<p style="color: #ff6b6b; font-size: 0.9rem;">Error al cargar el historial.</p>';
    }
}

function renderHistoricalReports(data) {
    const container = document.getElementById('config-historico-semanas-container');
    if (!container) return;

    if (data.length === 0) {
        container.innerHTML = '<p style="color: #aaa; font-size: 0.9rem; text-align: center; padding: 20px;">No se encontraron reportes.</p>';
        return;
    }

    container.innerHTML = '';
    data.forEach(report => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '8px';
        row.style.marginBottom = '10px';
        row.style.alignItems = 'stretch';

        const btn = document.createElement('a');
        btn.href = report.archivo_url;
        btn.target = '_blank';
        btn.className = 'btn-admin-submit';
        btn.style.flex = '1';
        btn.style.margin = '0';
        btn.style.backgroundColor = '#444';
        btn.style.textAlign = 'center';
        btn.style.textDecoration = 'none';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.innerHTML = `<i data-lucide="file-text" style="width: 16px; margin-right: 8px; vertical-align: middle;"></i> Descargar ${escapeHtml(report.semana_nombre)} (${new Date(report.created_at).toLocaleDateString()})`;

        const delBtn = document.createElement('button');
        delBtn.className = 'btn-admin-submit';
        delBtn.style.margin = '0';
        delBtn.style.backgroundColor = '#ef4444';
        delBtn.style.width = '42px';
        delBtn.style.padding = '0';
        delBtn.style.display = 'flex';
        delBtn.style.alignItems = 'center';
        delBtn.style.justifyContent = 'center';
        delBtn.title = 'Eliminar reporte';
        delBtn.innerHTML = `<i data-lucide="trash-2" style="width: 18px; height: 18px; color: #fff;"></i>`;
        
        delBtn.onclick = async (e) => {
            e.preventDefault();
            if (await hzConfirm(`¿Estás seguro de que deseas eliminar por completo el reporte "${report.semana_nombre}"?`, { confirmText: 'Eliminar' })) {
                try {
                    if (report.archivo_url) {
                        const urlParts = report.archivo_url.split('/');
                        const fileName = urlParts[urlParts.length - 1];
                        
                        try {
                            await supabaseClient.storage.from('reportes_semanales').remove([fileName]);
                        } catch (err) {
                            // log suppressed
                        }
                    }

                    const { error } = await supabaseClient
                        .from('reportes_semanales')
                        .delete()
                        .eq('id', report.id);

                    if (error) {
                        // log suppressed
                        hzToast('No se pudo eliminar el reporte en este momento. Intentá de nuevo más tarde.', 'error');
                        throw error;
                    }

                    hzToast('Reporte eliminado con éxito.', 'success');
                    loadHistoricalReports();
                } catch (err) {
                    // log suppressed
                }
            }
        };

        row.appendChild(btn);
        row.appendChild(delBtn);
        container.appendChild(row);
    });
    if (window.lucide) window.lucide.createIcons();
}

// Helper function to generate PDF and archive the finished week automatically
async function generateWeeklyReport(currentWeekName) {
    if (!supabaseClient) return;
    try {
        // log suppressed
        // 1. Obtener todos los pedidos de la semana que está terminando
        const pedidosActuales = await getRequests();

        // 2. Construir el HTML premium para el PDF
        const containerHtml = document.createElement('div');
        containerHtml.style.padding = '40px 30px';
        containerHtml.style.fontFamily = "'Product Sans', Helvetica, Arial, sans-serif";
        containerHtml.style.color = '#333';
        containerHtml.style.backgroundColor = '#ffffff';

        // Calcular contadores rápidos para el reporte
        const totalSemana = pedidosActuales.length;
        const resueltosSemana = pedidosActuales.filter(p => p.estado === 'Resuelto').length;
        const pendientesSemana = totalSemana - resueltosSemana;

        let htmlContent = `
            <!-- HEADER CON LOGO Y TÃ TULO -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #d3221d; padding-bottom: 20px; margin-bottom: 25px;">
                <div>
                    <h1 style="color: #d3221d; font-size: 24px; margin: 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Rental Baxtter</h1>
                    <p style="color: #666; font-size: 14px; margin: 5px 0 0 0; font-weight: 500;">Reporte Oficial de Control de Equipos</p>
                </div>
                <div style="text-align: right;">
                    <span style="background-color: #d3221d; color: #ffffff; padding: 6px 14px; border-radius: 50px; font-size: 12px; font-weight: bold; text-transform: uppercase;">${escapeHtml(currentWeekName)}</span>
                    <p style="font-size: 11px; color: #888; margin: 8px 0 0 0;">Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
            </div>

            <!-- RESUMEN DE ESTADÃ STICAS (KPIs DE LA SEMANA) -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px;">
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center;">
                    <span style="font-size: 11px; color: #666; font-weight: bold; text-transform: uppercase; display: block; margin-bottom: 5px;">Total Solicitudes</span>
                    <strong style="font-size: 20px; color: #333;">${totalSemana}</strong>
                </div>
                <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; text-align: center;">
                    <span style="font-size: 11px; color: #166534; font-weight: bold; text-transform: uppercase; display: block; margin-bottom: 5px;">Resueltos</span>
                    <strong style="font-size: 20px; color: #166534;">${resueltosSemana}</strong>
                </div>
                <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; text-align: center;">
                    <span style="font-size: 11px; color: #991b1b; font-weight: bold; text-transform: uppercase; display: block; margin-bottom: 5px;">Pendientes</span>
                    <strong style="font-size: 20px; color: #991b1b;">${pendientesSemana}</strong>
                </div>
            </div>

            <!-- DETALLE DE SOLICITUDES -->
            <h2 style="font-size: 16px; color: #333; margin-bottom: 15px; font-weight: 700; border-bottom: 1px solid #eee; padding-bottom: 8px;">Detalle de Cambios de la Semana</h2>
        `;

        if (pedidosActuales.length === 0) {
            htmlContent += '<p style="color: #777; font-style: italic; text-align: center; margin-top: 30px;">No hubo solicitudes de cambio registradas durante esta semana.</p>';
        } else {
            htmlContent += `
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px;">
                    <thead>
                        <tr style="background-color: #f1f3f5; border-bottom: 2px solid #dee2e6; text-align: left;">
                            <th style="padding: 10px 8px; font-weight: bold; color: #495057;">Pasajero</th>
                            <th style="padding: 10px 8px; font-weight: bold; color: #495057;">DNI</th>
                            <th style="padding: 10px 8px; font-weight: bold; color: #495057;">Colegio</th>
                            <th style="padding: 10px 8px; font-weight: bold; color: #495057;">Hotel (Hab)</th>
                            <th style="padding: 10px 8px; font-weight: bold; color: #495057;">Prendas</th>
                            <th style="padding: 10px 8px; font-weight: bold; color: #495057;">Fotos</th>
                            <th style="padding: 10px 8px; font-weight: bold; color: #495057; text-align: center;">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            pedidosActuales.forEach((p, index) => {
                const rowBg = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
                const statusColor = p.estado === 'Resuelto' ? '#166534' : '#991b1b';
                const statusBg = p.estado === 'Resuelto' ? '#dcfce7' : '#fee2e2';
                
                // Build prendas detail string
                let prendasHtml = '';
                if (p.items && p.items.length > 0) {
                    prendasHtml = p.items.map(item => {
                        let line = `<strong>${escapeHtml(item.tipo_prenda)}</strong>`;
                        line += `<br><span style="font-size: 9px; color: #666;">${escapeHtml(item.motivo)}</span>`;
                        if (item.observaciones) {
                            line += `<br><span style="font-size: 9px; color: #999; font-style: italic;">"${escapeHtml(item.observaciones)}"</span>`;
                        }
                        return line;
                    }).join('<hr style="margin: 2px 0; border: none; border-top: 1px solid #eee;">');
                } else {
                    prendasHtml = escapeHtml(p.prenda);
                }

                // Build photos from all items
                let fotosHtml = '';
                const allItemFotos = [];
                if (p.items && p.items.length > 0) {
                    p.items.forEach(item => {
                        if (item.foto_url_1) allItemFotos.push(item.foto_url_1);
                        if (item.foto_url_2) allItemFotos.push(item.foto_url_2);
                        if (item.foto_url_3) allItemFotos.push(item.foto_url_3);
                    });
                }
                if (allItemFotos.length > 0) {
                    fotosHtml = allItemFotos.map(url => 
                        `<img src="${url}" style="width: 30px; height: 30px; object-fit: cover; border-radius: 4px; margin-right: 2px;">`
                    ).join('');
                } else {
                    fotosHtml = '<span style="color: #aaa; font-size: 10px;">Sin fotos</span>';
                }

                htmlContent += `
                    <tr style="background-color: ${rowBg}; border-bottom: 1px solid #e9ecef;">
                        <td style="padding: 10px 8px; font-weight: 600; color: #212529;">${escapeHtml(p.nombre)}</td>
                        <td style="padding: 10px 8px; color: #495057;">${escapeHtml(p.dni || '-')}</td>
                        <td style="padding: 10px 8px; color: #495057;">${escapeHtml(p.colegio)}</td>
                        <td style="padding: 10px 8px; color: #495057;">${escapeHtml(p.hotel)} (${escapeHtml(p.habitacion)})</td>
                        <td style="padding: 10px 8px; color: #495057;">${prendasHtml}</td>
                        <td style="padding: 10px 8px;">${fotosHtml}</td>
                        <td style="padding: 10px 8px; text-align: center;">
                            <span style="background-color: ${statusBg}; color: ${statusColor}; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 10px; text-transform: uppercase;">
                                ${escapeHtml(p.estado)}
                            </span>
                        </td>
                    </tr>
                `;
            });
            htmlContent += '</tbody></table>';
        }
        containerHtml.innerHTML = htmlContent;

        // 3. Generar PDF usando html2pdf
        const pdfBlob = await html2pdf().from(containerHtml).set({
            margin: 10,
            filename: `reporte_${currentWeekName.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        }).output('blob');

        // 4. Subir PDF a Supabase Storage
        const safeName = currentWeekName.replace(/[^a-zA-Z0-9]/g, '_');
        const filePath = `${safeName}_${Date.now()}.pdf`;
        
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('reportes_semanales')
            .upload(filePath, pdfBlob, { contentType: 'application/pdf' });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabaseClient.storage
            .from('reportes_semanales')
            .getPublicUrl(uploadData.path);
        const pdfUrl = urlData.publicUrl;

        // 5. Guardar registro en la tabla reportes_semanales
        const { error: insertError } = await supabaseClient
            .from('reportes_semanales')
            .insert({
                semana_nombre: currentWeekName,
                archivo_url: pdfUrl
            });
        if (insertError) throw insertError;

        // 6. Archivar pedidos actuales
        const idsToArchive = pedidosActuales.map(p => p.id);
        if (idsToArchive.length > 0) {
            const { error: updatePedidosError } = await supabaseClient
                .from('pedidos')
                .update({ semana_archivada: true })
                .in('id', idsToArchive);
            if (updatePedidosError) throw updatePedidosError;
        }

        // log suppressed
    } catch (error) {
        // log suppressed
    }
}

const imageDrawer = document.getElementById('image-preview-drawer');
const imageDrawerOverlay = document.getElementById('image-drawer-overlay');
const drawerGallery = document.getElementById('drawer-gallery');
const btnCloseDrawer = document.getElementById('btn-close-drawer');
const btnDownloadAll = document.getElementById('btn-download-all-images');

let currentDrawerImages = [];

function openImageDrawer(fotosArray) {
    if (!imageDrawer || !drawerGallery) return;
    currentDrawerImages = fotosArray || [];
    
    // Populate gallery
    drawerGallery.innerHTML = '';
    currentDrawerImages.forEach((url, idx) => {
        const imgWrap = document.createElement('div');
        imgWrap.style.background = '#fff';
        imgWrap.style.padding = '10px';
        imgWrap.style.borderRadius = '12px';
        imgWrap.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
        imgWrap.style.display = 'flex';
        imgWrap.style.flexDirection = 'column';
        
        const img = document.createElement('img');
        img.src = url;
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.borderRadius = '8px';
        img.style.objectFit = 'contain';
        img.style.maxHeight = '400px';
        
        imgWrap.appendChild(img);
        drawerGallery.appendChild(imgWrap);
    });

    // Open drawer
    imageDrawer.style.transform = 'translateX(0)';
    if (imageDrawerOverlay) imageDrawerOverlay.classList.add('show');
}

function closeImageDrawer() {
    if (!imageDrawer) return;
    imageDrawer.style.transform = 'translateX(100%)';
    if (imageDrawerOverlay) imageDrawerOverlay.classList.remove('show');
    currentDrawerImages = [];
}

if (btnCloseDrawer) btnCloseDrawer.addEventListener('click', closeImageDrawer);
if (imageDrawerOverlay) imageDrawerOverlay.addEventListener('click', closeImageDrawer);
if (imageDrawer) {
    imageDrawer.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}
if (btnDownloadAll) {
    btnDownloadAll.addEventListener('click', async () => {
        if (!currentDrawerImages || currentDrawerImages.length === 0) return;
        
        const btnOriginalText = btnDownloadAll.innerHTML;
        btnDownloadAll.innerHTML = '<i data-lucide="loader-2" class="animate-spin" style="width: 16px; height: 16px;"></i> Descargando...';
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        try {
            for (let i = 0; i < currentDrawerImages.length; i++) {
                const url = currentDrawerImages[i];
                const response = await fetch(url);
                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = blobUrl;
                a.download = "prenda-foto-" + (i+1) + "-" + Date.now() + ".jpg";
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(blobUrl);
                document.body.removeChild(a);
                
                // Pequeña pausa para no sobrecargar el navegador
                await new Promise(r => setTimeout(r, 300));
            }
        } catch (err) {
            // log suppressed
            hzToast('No se pudieron descargar las imágenes. Intentá de nuevo.', 'error');
        } finally {
            btnDownloadAll.innerHTML = btnOriginalText;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    });
}

async function updateLoggedInUserWidget() {
    const userNameLabel = document.getElementById('logged-in-user-name');
    const userAvatar = document.getElementById('user-avatar-initial');
    if (userNameLabel) {
        let displayName = 'Admin';
        
        const localUser = localStorage.getItem('admin_user');
        if (localUser) {
            displayName = localUser;
        } else if (typeof supabaseClient !== 'undefined') {
            try {
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (session && session.user && session.user.email) {
                    displayName = session.user.email.split('@')[0];
                }
            } catch (e) {
                // log suppressed
            }
        }
        
        // El usuario especificó que solo hay 3 y deben mostrar su nombre
        // PabloRental, AristidesRental, UsuarioRental, o admin
        userNameLabel.textContent = displayName;
        if (userAvatar) userAvatar.textContent = displayName.charAt(0).toUpperCase();
        
        const emailLabel = document.getElementById('logged-in-user-email');
        if (emailLabel) emailLabel.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', updateLoggedInUserWidget);

let calendarCurrentDate = new Date();
let selectedWeekStart = getMonday(new Date());
let calendarEvents = [];
let calendarCategories = [];

function getMonday(d) {
    d = new Date(d);
    var day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function formatDateISO(d) {
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

async function loadCalendarData() {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            const { data: cats } = await supabaseClient.from('calendar_categories').select('*');
            if (cats) calendarCategories = cats;
            const { data: evts } = await supabaseClient.from('calendar_events').select('*');
            if (evts) calendarEvents = evts;
        } catch(e) {}
    } else {
        // Fallback for local testing
        calendarCategories = [
            { id: '1', nombre: 'Llegada Colegio', color: '#3b82f6' },
            { id: '2', nombre: 'Operativo', color: '#ef4444' },
            { id: '3', nombre: 'Reunión Líderes', color: '#10b981' }
        ];
        calendarEvents = [];
    }
}

function renderCategories() {
    const catList = document.getElementById('calendar-categories-list');
    const evCatSelect = document.getElementById('ev-categoria');
    if (!catList || !evCatSelect) return;
    
    catList.innerHTML = '';
    evCatSelect.innerHTML = '';
    
    calendarCategories.forEach(cat => {
        const lbl = document.createElement('label');
        lbl.style.cssText = `display: flex; align-items: center; gap: 8px; cursor: pointer; background: #f8fafc; padding: 6px 12px; border-radius: 8px; border: 1px solid #e2e8f0;`;
        lbl.innerHTML = `<input type="checkbox" checked value="${cat.id}" class="cal-filter" style="width: 16px; height: 16px; accent-color: ${cat.color};">
                         <span style="flex-grow: 1; font-weight: 500;">${cat.nombre}</span>
                         <button type="button" class="btn-delete-cat" data-id="${cat.id}" style="background: none; border: none; cursor: pointer; color: #ef4444;" title="Eliminar"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i></button>`;
        catList.appendChild(lbl);
        
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.nombre;
        evCatSelect.appendChild(opt);
    });
    
    document.querySelectorAll('.cal-filter').forEach(cb => cb.addEventListener('change', renderWeeklyGrid));
    document.querySelectorAll('.btn-delete-cat').forEach(btn => btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (await hzConfirm('¿Eliminar categoría y todos sus eventos?', { confirmText: 'Eliminar' })) {
            if (typeof supabaseClient !== 'undefined' && supabaseClient) {
                await supabaseClient.from('calendar_categories').delete().eq('id', id);
            }
            await loadCalendarData();
            renderCategories();
            renderWeeklyGrid();
        }
    }));
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderMiniCalendar() {
    const miniGrid = document.getElementById('mini-calendar-grid');
    const currentMonthLabel = document.getElementById('current-month');
    if (!miniGrid) return;
    
    const year = calendarCurrentDate.getFullYear();
    const month = calendarCurrentDate.getMonth();
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    if (currentMonthLabel) currentMonthLabel.textContent = monthNames[month] + ' ' + year;
    
    miniGrid.innerHTML = '';
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let firstDay = new Date(year, month, 1).getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    const prevMonthDays = new Date(year, month, 0).getDate();
    let gridCount = 0;
    
    const todayStr = formatDateISO(new Date());
    const selStartStr = formatDateISO(selectedWeekStart);
    const selEndStr = formatDateISO(new Date(selectedWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000));
    
    for (let i = 0; i < firstDay; i++) {
        const d = new Date(year, month - 1, prevMonthDays - firstDay + i + 1);
        const div = createMiniDay(d, true, todayStr, selStartStr, selEndStr);
        miniGrid.appendChild(div);
        gridCount++;
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        const div = createMiniDay(d, false, todayStr, selStartStr, selEndStr);
        miniGrid.appendChild(div);
        gridCount++;
    }
    
    let nextMonthDay = 1;
    while (gridCount % 7 !== 0 || gridCount < 42) {
        const d = new Date(year, month + 1, nextMonthDay);
        const div = createMiniDay(d, true, todayStr, selStartStr, selEndStr);
        miniGrid.appendChild(div);
        nextMonthDay++;
        gridCount++;
    }
}

function createMiniDay(dateObj, isOutOfMonth, todayStr, selStartStr, selEndStr) {
    const div = document.createElement('div');
    div.className = 'mini-cal-day';
    div.textContent = dateObj.getDate();
    
    const dateStr = formatDateISO(dateObj);
    if (isOutOfMonth) div.classList.add('out-of-month');
    if (dateStr === todayStr) div.classList.add('current-day');
    if (dateStr >= selStartStr && dateStr <= selEndStr) {
        div.classList.add('in-week');
    }
    if (dateStr === selStartStr) {
        div.classList.add('selected');
    }
    
    div.addEventListener('click', () => {
        selectedWeekStart = getMonday(dateObj);
        calendarCurrentDate = new Date(selectedWeekStart);
        renderMiniCalendar();
        renderWeeklyGrid();
    });
    return div;
}

function renderWeeklyGrid() {
    const daysHeader = document.getElementById('weekly-days-header');
    const eventsGrid = document.getElementById('main-calendar-grid');
    if (!daysHeader || !eventsGrid) return;
    
    daysHeader.innerHTML = '';
    eventsGrid.innerHTML = '';
    
    const weekDaysNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    const activeFilters = Array.from(document.querySelectorAll('.cal-filter:checked')).map(cb => cb.value);
    
    for (let i = 0; i < 7; i++) {
        const d = new Date(selectedWeekStart);
        d.setDate(d.getDate() + i);
        const dateStr = formatDateISO(d);
        const todayStr = formatDateISO(new Date());
        
        // Header
        const hDiv = document.createElement('div');
        hDiv.style.padding = '8px 0';
        if (dateStr === todayStr) {
            hDiv.innerHTML = `<div style="color: #d3221d; font-weight: bold;">${weekDaysNames[i]}</div><div style="font-size: 1.2rem; color: #d3221d; font-weight: bold;">${d.getDate()}</div>`;
        } else {
            hDiv.innerHTML = `<div>${weekDaysNames[i]}</div><div style="font-size: 1.2rem; color: #111;">${d.getDate()}</div>`;
        }
        daysHeader.appendChild(hDiv);
        
        // Column
        const colDiv = document.createElement('div');
        
        const dayEvents = calendarEvents.filter(ev => ev.fecha === dateStr && activeFilters.includes(ev.categoria_id));
        dayEvents.sort((a,b) => (a.hora || '24:00').localeCompare(b.hora || '24:00'));
        
        dayEvents.forEach(ev => {
            const cat = calendarCategories.find(c => c.id === ev.categoria_id);
            const color = cat ? cat.color : '#000';
            
            const evCard = document.createElement('div');
            evCard.className = 'cal-event-card';
            evCard.style.borderLeftColor = color;
            evCard.draggable = true;
            evCard.dataset.id = ev.id;
            
            let html = `<div class="ev-title" style="display:flex; justify-content:space-between; align-items:flex-start;">
                <span>${escapeHtml(ev.titulo)}</span>
                <button type="button" class="btn-delete-ev" data-id="${ev.id}" style="background:none;border:none;cursor:pointer;color:#ef4444;"><i data-lucide="x" style="width:14px;height:14px;"></i></button>
            </div>`;
            if (ev.hora) html += `<div class="ev-time"><i data-lucide="clock" style="width:12px;height:12px;"></i> ${ev.hora.substring(0,5)}</div>`;
            if (ev.descripcion) html += `<div class="ev-desc">${escapeHtml(ev.descripcion)}</div>`;
            
            evCard.innerHTML = html;
            
            evCard.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', ev.id);
            });
            
            colDiv.appendChild(evCard);
        });
        
        colDiv.querySelectorAll('.btn-delete-ev').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const evId = e.currentTarget.getAttribute('data-id');
                if (await hzConfirm('¿Eliminar evento?', { confirmText: 'Eliminar' })) {
                    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
                        await supabaseClient.from('calendar_events').delete().eq('id', evId);
                        await loadCalendarData();
                        renderWeeklyGrid();
                    }
                }
            });
        });
        
        colDiv.addEventListener('dragover', (e) => {
            e.preventDefault();
            colDiv.style.background = '#f1f5f9';
        });
        
        colDiv.addEventListener('dragleave', (e) => {
            colDiv.style.background = '';
        });
        
        colDiv.addEventListener('drop', async (e) => {
            e.preventDefault();
            colDiv.style.background = '';
            const evId = e.dataTransfer.getData('text/plain');
            if (evId) {
                if (typeof supabaseClient !== 'undefined' && supabaseClient) {
                    await supabaseClient.from('calendar_events').update({ fecha: dateStr }).eq('id', evId);
                    await loadCalendarData();
                    renderWeeklyGrid();
                }
            }
        });
        
        colDiv.addEventListener('click', (e) => {
            if (e.target.closest('.cal-event-card')) return;
            const modalEvent = document.getElementById('modal-event');
            if (modalEvent) {
                document.getElementById('ev-fecha').value = dateStr;
                toggleModal(modalEvent, true);
            }
        });
        
        eventsGrid.appendChild(colDiv);
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function toggleModal(modal, show) {
    if (!modal) return;
    modal.style.display = show ? 'flex' : 'none';
    document.body.classList.toggle('modal-open', show);
}

document.addEventListener('DOMContentLoaded', async () => {
    const mainCalendarGrid = document.getElementById('main-calendar-grid');
    if (mainCalendarGrid) {
        await loadCalendarData();
        renderCategories();
        renderMiniCalendar();
        renderWeeklyGrid();
        
        const btnPrev = document.getElementById('btn-prev-month');
        const btnNext = document.getElementById('btn-next-month');
        if (btnPrev) btnPrev.addEventListener('click', () => { calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1); renderMiniCalendar(); });
        if (btnNext) btnNext.addEventListener('click', () => { calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1); renderMiniCalendar(); });
        
        const modalEvent = document.getElementById('modal-event');
        const btnCancelEvent = document.getElementById('btn-cancel-event');
        if (btnCancelEvent) btnCancelEvent.addEventListener('click', () => toggleModal(modalEvent, false));
        if (modalEvent) {
            modalEvent.addEventListener('click', (e) => {
                if (e.target === modalEvent) toggleModal(modalEvent, false);
            });
        }
        
        const btnAddEvent = document.getElementById('btn-add-event');
        if (btnAddEvent) btnAddEvent.addEventListener('click', () => {
            document.getElementById('ev-fecha').value = formatDateISO(new Date());
            toggleModal(modalEvent, true);
        });
        
        const modalCategory = document.getElementById('modal-category');
        const btnCancelCategory = document.getElementById('btn-cancel-category');
        if (btnCancelCategory) btnCancelCategory.addEventListener('click', () => toggleModal(modalCategory, false));
        if (modalCategory) {
            modalCategory.addEventListener('click', (e) => {
                if (e.target === modalCategory) toggleModal(modalCategory, false);
            });
            // Handle color chips
            const chips = document.querySelectorAll('.color-chip');
            const colorVal = document.getElementById('cat-color-val');
            chips.forEach(chip => {
                chip.addEventListener('click', () => {
                    chips.forEach(c => { c.classList.remove('selected'); c.style.borderColor = 'transparent'; });
                    chip.classList.add('selected');
                    chip.style.borderColor = '#000';
                    colorVal.value = chip.getAttribute('data-color');
                });
            });
        }
        
        const btnAddCategory = document.getElementById('btn-add-category');
        if (btnAddCategory) btnAddCategory.addEventListener('click', () => {
            document.getElementById('cat-nombre').value = '';
            toggleModal(modalCategory, true);
        });

        const btnSaveCategory = document.getElementById('btn-save-category');
        if (btnSaveCategory) btnSaveCategory.addEventListener('click', async () => {
            const name = document.getElementById('cat-nombre').value;
            const color = document.getElementById('cat-color-val').value;
            if (name && name.trim()) {
                if (typeof supabaseClient !== 'undefined' && supabaseClient) {
                    await supabaseClient.from('calendar_categories').insert([{ nombre: name.trim(), color: color }]);
                }
                await loadCalendarData();
                renderCategories();
                renderWeeklyGrid();
                toggleModal(modalCategory, false);
            } else {
                hzToast('Ingresá un nombre de categoría.', 'info');
            }
        });
        
        const btnSaveEvent = document.getElementById('btn-save-event');
        if (btnSaveEvent) btnSaveEvent.addEventListener('click', async () => {
            const titulo = document.getElementById('ev-titulo').value;
            const fecha = document.getElementById('ev-fecha').value;
            const hora = document.getElementById('ev-hora').value || null;
            const catId = document.getElementById('ev-categoria').value;
            const desc = document.getElementById('ev-descripcion').value || null;
            
            if (titulo && fecha && catId) {
                if (typeof supabaseClient !== 'undefined' && supabaseClient) {
                    await supabaseClient.from('calendar_events').insert([{
                        titulo, fecha, hora, categoria_id: catId, descripcion: desc
                    }]);
                }
                await loadCalendarData();
                renderWeeklyGrid();
                toggleModal(modalEvent, false);
                document.getElementById('ev-titulo').value = '';
                document.getElementById('ev-descripcion').value = '';
                document.getElementById('ev-hora').value = '';
            } else {
                hzToast('Ingresá título, fecha y categoría.', 'info');
            }
        });
    }
});
