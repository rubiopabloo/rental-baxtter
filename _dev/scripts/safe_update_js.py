import os

def safe_update_js():
    with open('js/admin.js', 'r', encoding='utf-8') as f:
        js = f.read()

    # 1. Update the User profile logic
    user_logic_old = '''// ============================================================
// LOGGED IN USER IN SIDEBAR
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    const userLabel = document.getElementById('logged-in-user');
    if (userLabel) {
        let displayName = 'Admin';
        
        if (typeof supabaseClient !== 'undefined') {
            try {
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (session && session.user && session.user.email) {
                    displayName = session.user.email.split('@')[0];
                } else {
                    const localUser = localStorage.getItem('admin_user');
                    if (localUser) displayName = localUser;
                }
            } catch (e) {
                console.error(e);
                const localUser = localStorage.getItem('admin_user');
                if (localUser) displayName = localUser;
            }
        } else {
            const localUser = localStorage.getItem('admin_user');
            if (localUser) displayName = localUser;
        }
        
        userLabel.textContent = displayName;
    }
});'''
    user_logic_new = '''// ============================================================
// LOGGED IN USER IN SIDEBAR
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
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
                console.error(e);
            }
        }
        
        userNameLabel.textContent = displayName;
        if (userAvatar) userAvatar.textContent = displayName.charAt(0).toUpperCase();
        
        const emailLabel = document.getElementById('logged-in-user-email');
        if (emailLabel) emailLabel.style.display = 'none';
    }
});'''
    js = js.replace(user_logic_old, user_logic_new)

    # 2. Update Image Drawer logic for Carousel
    drawer_old = '''let currentDrawerImages = [];

function openImageDrawer(fotosArray) {
    if (!imageDrawer || !drawerGallery) return;
    currentDrawerImages = fotosArray;
    
    // Populate gallery
    drawerGallery.innerHTML = '';
    fotosArray.forEach((url, idx) => {
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
            console.error('Error al descargar imágenes:', err);
            alert('Hubo un error al intentar descargar las imágenes.');
        } finally {
            btnDownloadAll.innerHTML = btnOriginalText;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    });
}'''
    drawer_new = '''let currentDrawerImages = [];
let currentImageIndex = 0;

function openImageDrawer(fotosArray) {
    const imageDrawer = document.getElementById('image-drawer');
    const imageDrawerOverlay = document.getElementById('image-drawer-overlay');
    const drawerMainImage = document.getElementById('drawer-main-image');
    const drawerCounter = document.getElementById('drawer-image-counter');
    const btnPrev = document.getElementById('drawer-prev-btn');
    const btnNext = document.getElementById('drawer-next-btn');

    if (!imageDrawer) return;
    
    currentDrawerImages = fotosArray || [];
    currentImageIndex = 0;
    
    if (currentDrawerImages.length === 0) {
        if (drawerMainImage) drawerMainImage.src = '';
        if (drawerCounter) drawerCounter.textContent = '0 / 0';
        if (btnPrev) btnPrev.style.display = 'none';
        if (btnNext) btnNext.style.display = 'none';
    } else {
        updateDrawerImage();
        if (btnPrev) {
            btnPrev.style.display = currentDrawerImages.length > 1 ? 'flex' : 'none';
            btnPrev.onclick = () => {
                currentImageIndex = (currentImageIndex > 0) ? currentImageIndex - 1 : currentDrawerImages.length - 1;
                updateDrawerImage();
            };
        }
        if (btnNext) {
            btnNext.style.display = currentDrawerImages.length > 1 ? 'flex' : 'none';
            btnNext.onclick = () => {
                currentImageIndex = (currentImageIndex < currentDrawerImages.length - 1) ? currentImageIndex + 1 : 0;
                updateDrawerImage();
            };
        }
    }

    imageDrawer.style.transform = 'translateX(0)';
    if (imageDrawerOverlay) imageDrawerOverlay.classList.add('show');
}

function updateDrawerImage() {
    const drawerMainImage = document.getElementById('drawer-main-image');
    const drawerCounter = document.getElementById('drawer-image-counter');
    if (drawerMainImage && currentDrawerImages.length > 0) {
        drawerMainImage.src = currentDrawerImages[currentImageIndex];
    }
    if (drawerCounter) {
        drawerCounter.textContent = (currentImageIndex + 1) + ' / ' + currentDrawerImages.length;
    }
}

function closeImageDrawer() {
    const imageDrawer = document.getElementById('image-drawer');
    const imageDrawerOverlay = document.getElementById('image-drawer-overlay');
    if (!imageDrawer) return;
    imageDrawer.style.transform = 'translateX(100%)';
    if (imageDrawerOverlay) imageDrawerOverlay.classList.remove('show');
    currentDrawerImages = [];
}

const btnCloseDrawerEl = document.getElementById('btn-close-drawer');
if (btnCloseDrawerEl) btnCloseDrawerEl.addEventListener('click', closeImageDrawer);
const imageDrawerOverlayEl = document.getElementById('image-drawer-overlay');
if (imageDrawerOverlayEl) imageDrawerOverlayEl.addEventListener('click', closeImageDrawer);

const btnDownloadAll = document.getElementById('btn-download-all-images');
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
                await new Promise(r => setTimeout(r, 300));
            }
        } catch (err) {
            console.error('Error', err);
            alert('Hubo un error al descargar.');
        } finally {
            btnDownloadAll.innerHTML = btnOriginalText;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    });
}'''
    js = js.replace(drawer_old, drawer_new)

    # 3. Swap Chevron logic
    toggle_old = "if (adminLayout) adminLayout.classList.add('sidebar-collapsed');"
    toggle_new = '''if (adminLayout) adminLayout.classList.toggle('sidebar-collapsed');
    const collapseIcon = document.getElementById('icon-collapse');
    if (collapseIcon) {
        if (adminLayout.classList.contains('sidebar-collapsed')) {
            collapseIcon.setAttribute('data-lucide', 'chevron-right');
        } else {
            collapseIcon.setAttribute('data-lucide', 'chevron-left');
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }'''
    js = js.replace(toggle_old, toggle_new)

    # 4. Add the Calendar Logic (using UNICODE escapes)
    calendar_logic = '''

// ============================================================
// CALENDAR LOGIC
// ============================================================
let calendarCurrentDate = new Date();
let calendarEvents = [
    { date: new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString().split('T')[0], title: 'Llegada San Agust\\u00edn', type: 'llegada' },
    { date: new Date(new Date().getFullYear(), new Date().getMonth(), 12).toISOString().split('T')[0], title: 'Inicio Operativo', type: 'operativo' },
    { date: new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString().split('T')[0], title: 'Reuni\\u00f3n Semanal', type: 'reunion' }
];

document.addEventListener('DOMContentLoaded', () => {
    const mainCalendarGrid = document.getElementById('main-calendar-grid');
    const miniCalendarGrid = document.getElementById('mini-calendar');
    const currentMonthLabel = document.getElementById('calendar-current-month');
    const modalEvent = document.getElementById('modal-event');
    const btnSaveEvent = document.getElementById('btn-save-event');
    const btnCancelEvent = document.getElementById('btn-cancel-event');
    const btnAddEvent = document.getElementById('btn-add-event');
    const btnExportIcs = document.getElementById('btn-export-ics');

    function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
    function getFirstDayOfMonth(year, month) {
        let day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1;
    }

    function renderCalendar() {
        if (!mainCalendarGrid || !miniCalendarGrid) return;
        
        const year = calendarCurrentDate.getFullYear();
        const month = calendarCurrentDate.getMonth();
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        if (currentMonthLabel) currentMonthLabel.textContent = monthNames[month] + ' ' + year;
        
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        
        mainCalendarGrid.innerHTML = '';
        const miniHeaders = Array.from(miniCalendarGrid.children).slice(0, 7);
        miniCalendarGrid.innerHTML = '';
        miniHeaders.forEach(h => miniCalendarGrid.appendChild(h));
        
        const prevMonthDays = getDaysInMonth(year, month - 1);
        let gridCount = 0;
        
        for (let i = 0; i < firstDay; i++) {
            const div = document.createElement('div');
            div.className = 'out-of-month';
            div.innerHTML = "<span style='float: right; margin: 4px; font-size: 0.85rem;'>" + (prevMonthDays - firstDay + i + 1) + "</span>";
            mainCalendarGrid.appendChild(div);
            
            const mDiv = document.createElement('div');
            mDiv.style.color = '#ccc';
            mDiv.textContent = prevMonthDays - firstDay + i + 1;
            miniCalendarGrid.appendChild(mDiv);
            gridCount++;
        }
        
        for (let i = 1; i <= daysInMonth; i++) {
            const currentDateStr = year + "-" + String(month+1).padStart(2, '0') + "-" + String(i).padStart(2, '0');
            const div = document.createElement('div');
            div.innerHTML = "<span style='float: right; margin: 4px; font-size: 0.85rem; font-weight: 500; color: #333;'>" + i + "</span><div style='clear: both;'></div>";
            
            const dayEvents = calendarEvents.filter(ev => ev.date === currentDateStr);
            const activeFilters = Array.from(document.querySelectorAll('.cal-filter:checked')).map(cb => cb.value);
            
            dayEvents.forEach(ev => {
                if (activeFilters.includes(ev.type)) {
                    const evDiv = document.createElement('div');
                    evDiv.className = 'cal-event ' + ev.type;
                    evDiv.textContent = ev.title;
                    div.appendChild(evDiv);
                }
            });
            
            div.addEventListener('click', () => {
                if (modalEvent) {
                    document.getElementById('ev-fecha').value = currentDateStr;
                    modalEvent.style.display = 'flex';
                }
            });
            
            mainCalendarGrid.appendChild(div);
            const mDiv = document.createElement('div');
            if (dayEvents.length > 0) mDiv.style.fontWeight = 'bold';
            mDiv.textContent = i;
            miniCalendarGrid.appendChild(mDiv);
            gridCount++;
        }
        
        let nextMonthDay = 1;
        while (gridCount % 7 !== 0 || gridCount < 35) {
            const div = document.createElement('div');
            div.className = 'out-of-month';
            div.innerHTML = "<span style='float: right; margin: 4px; font-size: 0.85rem;'>" + nextMonthDay + "</span>";
            mainCalendarGrid.appendChild(div);
            
            const mDiv = document.createElement('div');
            mDiv.style.color = '#ccc';
            mDiv.textContent = nextMonthDay;
            miniCalendarGrid.appendChild(mDiv);
            
            nextMonthDay++;
            gridCount++;
        }
    }

    const btnPrev = document.getElementById('btn-prev-month');
    const btnNext = document.getElementById('btn-next-month');
    if (btnPrev) btnPrev.addEventListener('click', () => { calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1); renderCalendar(); });
    if (btnNext) btnNext.addEventListener('click', () => { calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1); renderCalendar(); });
    if (btnCancelEvent) btnCancelEvent.addEventListener('click', () => modalEvent.style.display = 'none');
    if (btnAddEvent) btnAddEvent.addEventListener('click', () => {
        document.getElementById('ev-fecha').value = new Date().toISOString().split('T')[0];
        modalEvent.style.display = 'flex';
    });
    if (btnSaveEvent) btnSaveEvent.addEventListener('click', () => {
        const title = document.getElementById('ev-titulo').value;
        const date = document.getElementById('ev-fecha').value;
        const cat = document.getElementById('ev-categoria').value;
        if (title && date) {
            calendarEvents.push({ date, title, type: cat });
            renderCalendar();
            modalEvent.style.display = 'none';
            document.getElementById('ev-titulo').value = '';
        } else {
            alert('Ingrese t\\u00edtulo y fecha');
        }
    });
    document.querySelectorAll('.cal-filter').forEach(cb => cb.addEventListener('change', renderCalendar));
    if (btnExportIcs) btnExportIcs.addEventListener('click', () => {
        let ics = 'BEGIN:VCALENDAR\\nVERSION:2.0\\nPRODID:-//Rental Baxtter//Calendario//ES\\n';
        calendarEvents.forEach(ev => {
            const dateStr = ev.date.replace(/-/g, '') + 'T000000Z';
            ics += 'BEGIN:VEVENT\\nDTSTART:' + dateStr + '\\nSUMMARY:' + ev.title + '\\nEND:VEVENT\\n';
        });
        ics += 'END:VCALENDAR';
        const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rental-calendario.ics';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    });
    if (mainCalendarGrid) renderCalendar();
});
'''
    js += '\n' + calendar_logic

    with open('js/admin.js', 'w', encoding='utf-8') as f:
        f.write(js)

safe_update_js()
