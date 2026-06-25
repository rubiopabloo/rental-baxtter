// DOM Elements
const checkboxes = document.querySelectorAll('.confirm-check');
const btnShowForm = document.getElementById('btn-show-form');
const mainContent = document.getElementById('main-content');
const formContent = document.getElementById('form-content');
const changeForm = document.getElementById('change-form');

const onboardingOverlay = document.getElementById('onboarding-overlay');
const termsModal = document.getElementById('terms-modal');
const btnTerms = document.getElementById('btn-terms');
const btnCloseTerms = document.getElementById('btn-close-terms');

window.openOnboarding = function() {
    if (onboardingOverlay) {
        onboardingOverlay.classList.remove('hidden');
        onboardingOverlay.style.opacity = '1';
        onboardingOverlay.style.transform = 'scale(1)';
    }
};

window.closeOnboarding = function() {
    if (onboardingOverlay) {
        onboardingOverlay.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        onboardingOverlay.style.opacity = '0';
        onboardingOverlay.style.transform = 'scale(0.95)';
        setTimeout(() => {
            onboardingOverlay.classList.add('hidden');
            sessionStorage.setItem('guia_vista_sesion', 'true');
        }, 400);
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    if (onboardingOverlay && !sessionStorage.getItem('guia_vista_sesion')) {
        openOnboarding();
    }
    
    // Cargar hoteles dinámicos desde Supabase (sincronizado entre dispositivos)
    const hotelSelect = document.getElementById('f-hotel');
    if (hotelSelect) {
        let customHotels = null;
        let customColegios = null;

        // Intentar cargar desde Supabase primero
        if (typeof supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL && !SUPABASE_URL.includes('TU_PROYECTO')) {
            try {
                const { data, error } = await supabaseClient
                    .from('temporada_config')
                    .select('hoteles_list, colegios_semana')
                    .eq('id', 1)
                    .single();

                if (!error && data) {
                    if (data.hoteles_list) customHotels = data.hoteles_list;
                    if (data.colegios_semana) customColegios = data.colegios_semana;
                }
            } catch (e) {
                // log suppressed
            }
        }

        // Fallback a localStorage
        if (!customHotels) {
            customHotels = localStorage.getItem('config_hoteles_list');
        }

        if (customHotels) {
            const initialOption = hotelSelect.options[0];
            hotelSelect.innerHTML = '';
            hotelSelect.appendChild(initialOption);
            
            customHotels.split(',').map(h => h.trim()).filter(h => h).forEach(hotel => {
                const opt = document.createElement('option');
                opt.value = hotel;
                opt.textContent = hotel;
                hotelSelect.appendChild(opt);
            });
        }

        const colegioInput = document.getElementById('f-colegio');
        if (colegioInput && customColegios) {
            const colegiosArr = customColegios.split(',').map(c => c.trim()).filter(c => c);
            if (colegiosArr.length > 0) {
                const selectColegio = document.createElement('select');
                selectColegio.id = 'f-colegio';
                selectColegio.required = true;
                selectColegio.className = 'f-colegio-select';
                selectColegio.innerHTML = '<option value="" disabled selected>Seleccioná tu colegio</option>';
                colegiosArr.forEach(col => {
                    const opt = document.createElement('option');
                    opt.value = col;
                    opt.textContent = col;
                    selectColegio.appendChild(opt);
                });
                
                const wrapper = document.createElement('div');
                wrapper.className = 'select-wrapper';
                wrapper.appendChild(selectColegio);
                
                const icon = document.createElement('i');
                icon.dataset.lucide = 'chevron-down';
                icon.className = 'select-icon';
                wrapper.appendChild(icon);
                
                colegioInput.parentNode.replaceChild(wrapper, colegioInput);
            }
        }
    }

    // Initialize prendas system
    initPrendasSystem();
});

if (btnTerms) {
    btnTerms.addEventListener('click', () => {
        if (termsModal) termsModal.classList.remove('hidden');
    });
}

if (btnCloseTerms) {
    btnCloseTerms.addEventListener('click', () => {
        if (termsModal) termsModal.classList.add('hidden');
    });
}

const MAX_PHOTOS_PER_PRENDA = 3;
const MAX_FILE_SIZE_MB = 5;
const MAX_PRENDAS = 7;

// State: array of prenda data. Each entry has { files: File[] }
let prendasState = [{ files: [] }];

function initPrendasSystem() {
    const btnAddPrenda = document.getElementById('btn-add-prenda');
    if (btnAddPrenda) {
        btnAddPrenda.addEventListener('click', addPrenda);
    }

    // Initialize photo upload for the first prenda
    bindPhotoUpload(0);
    bindTabClick(0);
}

function bindTabClick(index) {
    const tabsBar = document.getElementById('prendas-tabs-bar');
    if (!tabsBar) return;
    const tab = tabsBar.querySelector(`.prenda-tab[data-prenda-index="${index}"]`);
    if (tab) {
        tab.addEventListener('click', () => switchToPrenda(index));
    }
}

function switchToPrenda(index) {
    // Update tabs
    const tabsBar = document.getElementById('prendas-tabs-bar');
    tabsBar.querySelectorAll('.prenda-tab').forEach(t => t.classList.remove('active'));
    const activeTab = tabsBar.querySelector(`.prenda-tab[data-prenda-index="${index}"]`);
    if (activeTab) activeTab.classList.add('active');

    // Update panels
    const container = document.getElementById('prendas-container');
    container.querySelectorAll('.prenda-panel').forEach(p => p.classList.remove('active'));
    const activePanel = container.querySelector(`.prenda-panel[data-prenda-index="${index}"]`);
    if (activePanel) activePanel.classList.add('active');
}

function addPrenda() {
    const currentCount = prendasState.length;
    if (currentCount >= MAX_PRENDAS) {
        mostrarAlerta(`Máximo ${MAX_PRENDAS} prendas por solicitud.`);
        return;
    }

    const newIndex = currentCount;
    prendasState.push({ files: [] });

    // Add tab
    const tabsBar = document.getElementById('prendas-tabs-bar');
    const addBtn = document.getElementById('btn-add-prenda');
    
    const newTab = document.createElement('button');
    newTab.type = 'button';
    newTab.className = 'prenda-tab';
    newTab.dataset.prendaIndex = newIndex;
    newTab.innerHTML = `Prenda ${newIndex + 1} <span class="prenda-remove-btn" title="Quitar esta prenda">&times;</span>`;
    tabsBar.insertBefore(newTab, addBtn);
    bindTabClick(newIndex);

    // Add panel
    const container = document.getElementById('prendas-container');
    const panel = document.createElement('div');
    panel.className = 'prenda-panel';
    panel.dataset.prendaIndex = newIndex;
    panel.innerHTML = `
        <div class="form-group" style="margin-top: 10px;">
            <label>Prenda a cambiar</label>
            <div class="select-wrapper">
                <select class="f-prenda" required>
                    <option value="" disabled selected>Seleccioná una prenda</option>
                    <option value="Campera para nieve">Campera para nieve</option>
                    <option value="Pantalón para nieve">Pantalón para nieve</option>
                    <option value="Campera para barro">Campera para barro</option>
                    <option value="Pantalón para barro">Pantalón para barro</option>
                    <option value="Botas">Botas</option>
                    <option value="Guantes">Guantes</option>
                </select>
                <i data-lucide="chevron-down" class="select-icon"></i>
            </div>
        </div>

        <div class="form-group">
            <label>Motivo</label>
            <div class="select-wrapper">
                <select class="f-motivo" required>
                    <option value="" disabled selected>Seleccioná el motivo</option>
                    <option value="Cambio de talle">Cambio de talle</option>
                    <option value="Rotura al recibirla">Rotura al recibirla</option>
                    <option value="Rotura durante actividad">Rotura durante actividad</option>
                    <option value="Pérdida">Pérdida</option>
                    <option value="Otro">Otro</option>
                </select>
                <i data-lucide="chevron-down" class="select-icon"></i>
            </div>
        </div>

        <div class="form-group">
            <label>Observaciones</label>
            <textarea class="f-obs" rows="3" maxlength="500" placeholder="Agregá cualquier detalle adicional..."></textarea>
        </div>

        <div class="form-group">
            <label>Fotos del problema <span style="font-weight:400; color: #999;">(obligatorio, máx. 3)</span></label>
            <div class="photo-upload-area">
                <input type="file" class="f-fotos-input" accept="image/*" multiple style="display:none">
                <div class="photo-upload-trigger">
                    <i data-lucide="camera" style="width: 28px; height: 28px; color: #999;"></i>
                    <span>Tocá para agregar fotos</span>
                    <small style="color: #999;">JPG, PNG — máximo 5 MB cada una</small>
                </div>
                <div class="photo-preview-container"></div>
            </div>
        </div>
    `;

    container.appendChild(panel);

    // Bind remove button
    const removeBtn = newTab.querySelector('.prenda-remove-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removePrenda(newIndex);
        });
    }

    // Bind photo upload
    bindPhotoUpload(newIndex);

    // Switch to the new tab
    switchToPrenda(newIndex);

    if (typeof lucide !== 'undefined') lucide.createIcons();

    if (prendasState.length >= MAX_PRENDAS) {
        document.getElementById('btn-add-prenda').style.display = 'none';
    }
}

function removePrenda(index) {
    if (prendasState.length <= 1) return; // Can't remove the last one

    // Remove state
    prendasState.splice(index, 1);

    // Rebuild tabs and panels
    rebuildPrendasUI();

    if (prendasState.length < MAX_PRENDAS) {
        document.getElementById('btn-add-prenda').style.display = 'flex';
    }
}

function rebuildPrendasUI() {
    const tabsBar = document.getElementById('prendas-tabs-bar');
    const container = document.getElementById('prendas-container');
    const addBtn = document.getElementById('btn-add-prenda');

    // Keep the panels' current form values before removing
    const savedData = [];
    const panels = container.querySelectorAll('.prenda-panel');
    panels.forEach((panel, i) => {
        // Only save if there's still a state entry for this (it hasn't been spliced)
        if (i < prendasState.length + 1) { // +1 because we already spliced
            savedData.push({
                prenda: panel.querySelector('.f-prenda')?.value || '',
                motivo: panel.querySelector('.f-motivo')?.value || '',
                obs: panel.querySelector('.f-obs')?.value || '',
            });
        }
    });

    // Remove all existing tabs (except add button)
    tabsBar.querySelectorAll('.prenda-tab').forEach(t => t.remove());

    // Remove all existing panels
    container.innerHTML = '';

    // Recreate from state
    prendasState.forEach((state, i) => {
        // Create tab
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'prenda-tab' + (i === 0 ? ' active' : '');
        tab.dataset.prendaIndex = i;
        tab.innerHTML = `Prenda ${i + 1} ${prendasState.length > 1 ? '<span class="prenda-remove-btn" title="Quitar esta prenda">&times;</span>' : ''}`;
        tabsBar.insertBefore(tab, addBtn);
        bindTabClick(i);

        // Create panel
        const panel = document.createElement('div');
        panel.className = 'prenda-panel' + (i === 0 ? ' active' : '');
        panel.dataset.prendaIndex = i;

        panel.innerHTML = `
            <div class="form-group" style="margin-top: 10px;">
                <label>Prenda a cambiar</label>
                <div class="select-wrapper">
                    <select class="f-prenda" required>
                        <option value="" disabled selected>Seleccioná una prenda</option>
                        <option value="Campera para nieve">Campera para nieve</option>
                        <option value="Pantalón para nieve">Pantalón para nieve</option>
                        <option value="Campera para barro">Campera para barro</option>
                        <option value="Pantalón para barro">Pantalón para barro</option>
                        <option value="Botas">Botas</option>
                        <option value="Guantes">Guantes</option>
                    </select>
                    <i data-lucide="chevron-down" class="select-icon"></i>
                </div>
            </div>

            <div class="form-group">
                <label>Motivo</label>
                <div class="select-wrapper">
                    <select class="f-motivo" required>
                        <option value="" disabled selected>Seleccioná el motivo</option>
                        <option value="Cambio de talle">Cambio de talle</option>
                        <option value="Rotura al recibirla">Rotura al recibirla</option>
                        <option value="Rotura durante actividad">Rotura durante actividad</option>
                        <option value="Pérdida">Pérdida</option>
                        <option value="Otro">Otro</option>
                    </select>
                    <i data-lucide="chevron-down" class="select-icon"></i>
                </div>
            </div>

            <div class="form-group">
                <label>Observaciones</label>
                <textarea class="f-obs" rows="3" maxlength="500" placeholder="Agregá cualquier detalle adicional..."></textarea>
            </div>

            <div class="form-group">
                <label>Fotos del problema <span style="font-weight:400; color: #999;">(obligatorio, máx. 3)</span></label>
                <div class="photo-upload-area">
                    <input type="file" class="f-fotos-input" accept="image/*" multiple style="display:none">
                    <div class="photo-upload-trigger">
                        <i data-lucide="camera" style="width: 28px; height: 28px; color: #999;"></i>
                        <span>Tocá para agregar fotos</span>
                        <small style="color: #999;">JPG, PNG — máximo 5 MB cada una</small>
                    </div>
                    <div class="photo-preview-container"></div>
                </div>
            </div>
        `;

        container.appendChild(panel);

        // Restore saved values if available (index mapping after splice)
        // The savedData has the OLD indices. After splice, index i maps to savedData at the correct position.
        // Since we already spliced prendasState, we need to figure out the mapping.
        // Actually, it's simpler: just restore the prenda/motivo/obs from what was saved.
        // After a removal, savedData might have one extra entry. We just use the first prendasState.length entries.
        if (savedData[i]) {
            if (savedData[i].prenda) panel.querySelector('.f-prenda').value = savedData[i].prenda;
            if (savedData[i].motivo) panel.querySelector('.f-motivo').value = savedData[i].motivo;
            if (savedData[i].obs) panel.querySelector('.f-obs').value = savedData[i].obs;
        }

        // Bind remove button
        const removeBtn = tab.querySelector('.prenda-remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removePrenda(i);
            });
        }

        // Bind photo upload and re-render preview
        bindPhotoUpload(i);
        renderPhotoPreview(i);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function bindPhotoUpload(prendaIndex) {
    const panel = document.querySelector(`.prenda-panel[data-prenda-index="${prendaIndex}"]`);
    if (!panel) return;

    const trigger = panel.querySelector('.photo-upload-trigger');
    const input = panel.querySelector('.f-fotos-input');

    if (trigger && input) {
        // Remove old listeners by cloning
        const newTrigger = trigger.cloneNode(true);
        trigger.parentNode.replaceChild(newTrigger, trigger);
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);

        newTrigger.addEventListener('click', () => {
            if (prendasState[prendaIndex].files.length >= MAX_PHOTOS_PER_PRENDA) {
                mostrarAlerta(`Solo podés subir un máximo de ${MAX_PHOTOS_PER_PRENDA} fotos por prenda.`);
                return;
            }
            newInput.click();
        });

        newInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);

            for (const file of files) {
                if (prendasState[prendaIndex].files.length >= MAX_PHOTOS_PER_PRENDA) {
                    mostrarAlerta(`Máximo ${MAX_PHOTOS_PER_PRENDA} fotos permitidas por prenda. Se ignoraron las fotos extra.`);
                    break;
                }

                // Validate file type (strict)
                if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                    mostrarAlerta(`El archivo "${file.name}" no es válido. Solo se permite JPG, PNG o WebP.`);
                    continue;
                }

                // Validate file size (5MB max)
                if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                    mostrarAlerta(`La foto "${file.name}" supera los ${MAX_FILE_SIZE_MB} MB.`);
                    continue;
                }

                prendasState[prendaIndex].files.push(file);
            }

            // Reset input so the same file can be re-selected if removed
            newInput.value = '';
            renderPhotoPreview(prendaIndex);
        });
    }
}

function renderPhotoPreview(prendaIndex) {
    const panel = document.querySelector(`.prenda-panel[data-prenda-index="${prendaIndex}"]`);
    if (!panel) return;

    const previewContainer = panel.querySelector('.photo-preview-container');
    const trigger = panel.querySelector('.photo-upload-trigger');
    if (!previewContainer) return;

    previewContainer.innerHTML = '';

    const files = prendasState[prendaIndex].files;

    files.forEach((file, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'photo-preview-item';

        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = `Foto ${index + 1}`;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'photo-remove-btn';
        removeBtn.innerHTML = '&times;';
        removeBtn.addEventListener('click', () => {
            prendasState[prendaIndex].files.splice(index, 1);
            renderPhotoPreview(prendaIndex);
        });

        wrapper.appendChild(img);
        wrapper.appendChild(removeBtn);
        previewContainer.appendChild(wrapper);
    });

    // Show/hide the trigger based on how many photos are selected
    if (trigger) {
        if (files.length >= MAX_PHOTOS_PER_PRENDA) {
            trigger.style.display = 'none';
        } else {
            trigger.style.display = '';
        }
    }
}

// Handle checklist logic
function checkChecklist() {
    if (!btnShowForm) return;
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    btnShowForm.disabled = !allChecked;
    // Al completar los 3 ítems, el botón se desbloquea y se pinta de rojo
    btnShowForm.classList.toggle('btn-ready', allChecked);
}

checkboxes.forEach(cb => {
    cb.addEventListener('change', checkChecklist);
});

// Navigation
function scrollToChecklist() {
    document.getElementById('checklist-section').scrollIntoView({ behavior: 'smooth' });
}

if (btnShowForm) {
    btnShowForm.addEventListener('click', () => {
        mainContent.classList.add('hidden');
        formContent.classList.remove('hidden');
        window.scrollTo(0, 0);
    });
}

function showMainContent() {
    formContent.classList.add('hidden');
    mainContent.classList.remove('hidden');
    window.scrollTo(0, 0);
}

/**
 * Compress an image file using canvas before uploading.
 */
async function compressImage(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    }));
                }, 'image/jpeg', quality);
            };
            img.onerror = () => resolve(file); // fallback
        };
        reader.onerror = () => resolve(file); // fallback
    });
}

/**
 * Upload a file to Supabase Storage and return its public URL.
 * Uses the 'fotos_pedidos' bucket.
 */
async function uploadPhotoToStorage(file, pedidoId, index) {
    if (!supabaseClient) return null;

    // Compress file
    const compressedFile = await compressImage(file, 800, 0.7);

    // Create a unique file path: pedido_id/timestamp_index.ext
    const ext = compressedFile.name.split('.').pop().toLowerCase();
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
    const filePath = `${pedidoId}/${Date.now()}_${index}.${safeExt}`;

    const { data, error } = await supabaseClient.storage
        .from('fotos_pedidos')
        .upload(filePath, compressedFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
        });

    if (error) {
        // log suppressed
        mostrarAlerta('No se pudo subir una de las fotos. Revisá tu conexión e intentá de nuevo.');
        return null;
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
        .from('fotos_pedidos')
        .getPublicUrl(data.path);

    return urlData?.publicUrl || null;
}

changeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // --- Honeypot check (SECURITY_GUIDE.md §1.3) ---
    const honeypot = document.getElementById('f-honeypot');
    if (honeypot && honeypot.value !== '') {
        // Silently reject — don't inform attacker
        const successModal = document.getElementById('success-modal');
        if (successModal) {
            successModal.classList.remove('hidden');
        } else {
            mostrarAlerta('¡Solicitud enviada correctamente! Un operador revisará tu caso.', true);
            resetFormCompletely();
        }
        return;
    }

    const nombre = document.getElementById('f-nombre').value.trim();
    const dni = document.getElementById('f-dni').value.trim();
    const colegio = document.getElementById('f-colegio').value.trim();
    const lider = document.getElementById('f-lider').value.trim();
    const hotel = document.getElementById('f-hotel').value.trim();
    const habitacion = document.getElementById('f-habitacion').value.trim();

    // --- Frontend validation ---
    if (!nombre || !dni || !colegio || !lider || !hotel || !habitacion) {
        mostrarAlerta('Por favor completá todos los campos obligatorios de datos personales.');
        return;
    }

    // Collect prendas data from DOM panels
    const prendasData = [];
    const panels = document.querySelectorAll('.prenda-panel');
    for (let i = 0; i < panels.length; i++) {
        const panel = panels[i];
        const prenda = panel.querySelector('.f-prenda')?.value;
        const motivo = panel.querySelector('.f-motivo')?.value;
        const obs = panel.querySelector('.f-obs')?.value?.trim() || '';

        if (!prenda || !motivo) {
            mostrarAlerta(`Por favor completá los campos obligatorios en la Prenda ${i + 1}.`);
            switchToPrenda(i);
            return;
        }

        if (!prendasState[i]?.files || prendasState[i].files.length === 0) {
            mostrarAlerta(`Por favor agregá al menos una foto del problema en la Prenda ${i + 1}.`);
            switchToPrenda(i);
            return;
        }

        prendasData.push({
            prenda,
            motivo,
            obs,
            files: prendasState[i]?.files || []
        });
    }

    if (prendasData.length === 0) {
        mostrarAlerta('Debés agregar al menos una prenda.');
        return;
    }

    const submitBtn = changeForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i data-lucide="loader" style="animation: spin 1s linear infinite;"></i> Enviando...';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    let savedSuccessfully = false;
    
    if (supabaseClient) {
        try {
            // Helper for generating UUIDs safely
            const generateUUID = () => {
                if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                    return crypto.randomUUID();
                }
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            };

            const passengerId = generateUUID();
            const orderId = generateUUID();

            // 1. Insert passenger (with DNI)
            const { error: passengerError } = await supabaseClient
                .from('pasajeros')
                .insert([{ 
                    id: passengerId,
                    nombre, 
                    dni,
                    colegio, 
                    hotel, 
                    habitacion, 
                    lider_coordinador: lider,
                }]);

            if (passengerError) throw passengerError;

            // 2. Insert order (pedido) — use first prenda's motivo/obs as the main one
            const { error: orderError } = await supabaseClient
                .from('pedidos')
                .insert([{
                    id: orderId,
                    pasajero_id: passengerId,
                    motivo: prendasData[0].motivo,
                    observaciones: prendasData[0].obs,
                    estado: 'Pendiente'
                }]);

            if (orderError) throw orderError;

            // 3. Notificar al admin
            const prendasDescList = prendasData.map(p => p.prenda).join(', ');
            try {
                fetch(`${SUPABASE_URL}/functions/v1/enviar-notificacion`, {
                    method: 'POST',
                    headers: {
                        'Content-Type':  'application/json',
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    },
                    body: JSON.stringify({
                        numero_pasajero: 0,
                        titulo:          'Nueva solicitud recibida',
                        mensaje:         `${nombre} (${colegio}) solicita cambio de ${prendasDescList}.`,
                        url:             '/admin.html'
                    })
                }).catch(e => { /* log suppressed */ });
            } catch (e) {
                // log suppressed
            }

            // 4. Insert items + upload photos for each prenda
            for (let pIdx = 0; pIdx < prendasData.length; pIdx++) {
                const pd = prendasData[pIdx];
                let fotoUrl1 = null, fotoUrl2 = null, fotoUrl3 = null;

                if (pd.files.length > 0) {
                    fotoUrl1 = await uploadPhotoToStorage(pd.files[0], orderId, `p${pIdx}_1`);
                }
                if (pd.files.length > 1) {
                    fotoUrl2 = await uploadPhotoToStorage(pd.files[1], orderId, `p${pIdx}_2`);
                }
                if (pd.files.length > 2) {
                    fotoUrl3 = await uploadPhotoToStorage(pd.files[2], orderId, `p${pIdx}_3`);
                }

                const { error: itemError } = await supabaseClient
                    .from('items')
                    .insert([{
                        pedido_id: orderId,
                        tipo_prenda: pd.prenda,
                        talle: 'N/A',
                        cantidad: 1,
                        foto_url_1: fotoUrl1,
                        foto_url_2: fotoUrl2,
                        foto_url_3: fotoUrl3,
                        motivo: pd.motivo,
                        observaciones: pd.obs
                    }]);

                if (itemError) throw itemError;
            }

            savedSuccessfully = true;

        } catch (error) {
            // log suppressed
            mostrarAlerta('No pudimos procesar tu solicitud en este momento. Verificá tu conexión a internet e intentá nuevamente.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    } else {
        // Servicio no disponible momentáneamente
        mostrarAlerta('El servicio no está disponible en este momento. Intentá más tarde.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    if (savedSuccessfully) {
        const successModal = document.getElementById('success-modal');
        if (successModal) {
            successModal.classList.remove('hidden');
        } else {
            resetFormCompletely();
            mostrarAlerta('Su pedido ya fue notificado al área de rental.', true);
            showMainContent();
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const btnSuccessClose = document.getElementById('btn-success-close');
    const successModal = document.getElementById('success-modal');
    
    if (btnSuccessClose && successModal) {
        btnSuccessClose.addEventListener('click', () => {
            successModal.classList.add('hidden');
            resetFormCompletely();
            showMainContent();
        });
    }
});

function resetFormCompletely() {
    changeForm.reset();
    prendasState = [{ files: [] }];
    rebuildPrendasUI();
    checkboxes.forEach(cb => cb.checked = false);
    btnShowForm.disabled = true;
    btnShowForm.classList.remove('btn-ready');
}

const slides = document.querySelectorAll('.card-with-media');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const dots = document.querySelectorAll('.carousel-dots .dot');
const track = document.querySelector('.info-track');
const carouselContainer = document.querySelector('.info-section');
let currentSlide = 0;

let isDragging = false;
let startPos = 0;
let currentTranslate = 0;
let prevTranslate = 0;
let animationID;
let startTime;

function setTranslate(translateValue) {
    if (track) {
        track.style.transform = `translateX(${translateValue}px)`;
    }
}

function showSlide(index) {
    if (!carouselContainer) return;
    
    if (index >= slides.length) {
        currentSlide = 0;
    } else if (index < 0) {
        currentSlide = slides.length - 1;
    } else {
        currentSlide = index;
    }

    currentTranslate = currentSlide * -carouselContainer.offsetWidth;
    prevTranslate = currentTranslate;
    
    // Ensure transition is active for the snap
    if (track) {
        track.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
    }
    setTranslate(currentTranslate);

    slides.forEach((slide, i) => {
        if (i === currentSlide) {
            slide.classList.add('active');
        } else {
            slide.classList.remove('active');
        }
    });

    dots.forEach((dot, i) => {
        if (i === currentSlide) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// Drag & Swipe Event Handlers
function getPositionX(event) {
    return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
}

function dragStart(event) {
    isDragging = true;
    startPos = getPositionX(event);
    startTime = new Date().getTime();
    
    if (track) {
        track.style.transition = 'none';
    }
    cancelAnimationFrame(animationID);
}

function dragAction(event) {
    if (!isDragging) return;
    
    const currentPosition = getPositionX(event);
    const diff = currentPosition - startPos;
    
    let translation = prevTranslate + diff;
    
    // Resistance elastic boundary logic
    if (currentSlide === 0 && diff > 0) {
        translation = prevTranslate + diff * 0.3;
    } else if (currentSlide === slides.length - 1 && diff < 0) {
        translation = prevTranslate + diff * 0.3;
    }
    
    currentTranslate = translation;
    setTranslate(currentTranslate);
}

function dragEnd() {
    if (!isDragging) return;
    isDragging = false;
    
    const movedBy = currentTranslate - prevTranslate;
    const threshold = carouselContainer ? carouselContainer.offsetWidth * 0.2 : 100;
    const timeElapsed = new Date().getTime() - startTime;
    
    // Fast swipe / flick detection
    const isFastSwipe = Math.abs(movedBy) > 50 && timeElapsed < 250;
    
    if (isFastSwipe || Math.abs(movedBy) > threshold) {
        if (movedBy < 0 && currentSlide < slides.length - 1) {
            currentSlide++;
        } else if (movedBy > 0 && currentSlide > 0) {
            currentSlide--;
        }
    }
    
    showSlide(currentSlide);
}

// Initialize Event Listeners
if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
        showSlide(currentSlide - 1);
    });

    nextBtn.addEventListener('click', () => {
        showSlide(currentSlide + 1);
    });

    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            showSlide(i);
        });
    });
}

if (carouselContainer && track) {
    // Touch Events
    carouselContainer.addEventListener('touchstart', dragStart, { passive: true });
    carouselContainer.addEventListener('touchend', dragEnd);
    carouselContainer.addEventListener('touchmove', dragAction, { passive: true });

    // Mouse Events
    carouselContainer.addEventListener('mousedown', dragStart);
    carouselContainer.addEventListener('mouseup', dragEnd);
    carouselContainer.addEventListener('mouseleave', dragEnd);
    carouselContainer.addEventListener('mousemove', dragAction);
    
    // Prevent image drag ghosting
    const images = carouselContainer.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('dragstart', (e) => e.preventDefault());
    });
}

// Handle window resizing
window.addEventListener('resize', () => {
    if (carouselContainer && track) {
        currentTranslate = currentSlide * -carouselContainer.offsetWidth;
        prevTranslate = currentTranslate;
        track.style.transition = 'none';
        setTranslate(currentTranslate);
    }
});

// Initial call to align
showSlide(0);

// Load lideres de semana
async function loadLideresPublic() {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient
            .from('lideres_semana')
            .select('id, nombre')
            .order('nombre', { ascending: true });
        
        if (error) throw error;
        
        const selectLider = document.getElementById('f-lider');
        if (selectLider) {
            if (!data || data.length === 0) {
                // Fallback to text input
                selectLider.outerHTML = '<input type="text" id="f-lider" required placeholder="Nombre de tu líder" maxlength="100">';
            } else {
                selectLider.innerHTML = '<option value="" disabled selected>Seleccioná tu líder</option>';
                data.forEach(lider => {
                    const opt = document.createElement('option');
                    opt.value = lider.nombre;
                    opt.textContent = lider.nombre;
                    selectLider.appendChild(opt);
                });
            }
        }
    } catch (err) {
        // log suppressed
        const selectLider = document.getElementById('f-lider');
        if (selectLider) {
            selectLider.outerHTML = '<input type="text" id="f-lider" required placeholder="Nombre de tu líder" maxlength="100">';
        }
    }
}
loadLideresPublic();
