import re

with open('js/admin.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove Supabase Client init
content = re.sub(
    r'// Initialize Supabase Client.*?let supabaseClient = null;\s*if\s*\(typeof supabase !==.*?}\n',
    '',
    content,
    flags=re.DOTALL
)

# 2. Update checkExistingSession
new_session_logic = """// Check if already logged in via Supabase Auth session
async function checkExistingSession() {
    if (!supabaseClient) return;
    
    // Set up auth state change listener FIRST
    supabaseClient.auth.onAuthStateChange((event, session) => {
        const dbStatusBadge = document.getElementById('db-status-badge');
        if (session) {
            localStorage.setItem('admin_logged_in', 'true');
            if (dbStatusBadge) {
                dbStatusBadge.textContent = 'BD Conectada';
                dbStatusBadge.style.backgroundColor = '#10b981';
            }
            // Do not call showDashboard here to avoid infinite loops, but ensure UI reflects connected state
            if (loginScreen && !loginScreen.classList.contains('hidden')) {
                showDashboard();
            }
        } else {
            localStorage.removeItem('admin_logged_in');
            if (dbStatusBadge) {
                dbStatusBadge.textContent = 'Modo Local (Desconectado)';
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
            // Already logged in
            showDashboard();
        } else {
            // No session active
            localStorage.removeItem('admin_logged_in');
        }
    } catch (err) {
        console.error('Session check error:', err);
    }
}"""

content = re.sub(
    r'// Check if already logged in via Supabase Auth session\nasync function checkExistingSession\(\) \{.*?\n\}\n',
    new_session_logic + '\n',
    content,
    flags=re.DOTALL
)

# 3. Update login form logic
new_login_logic = """loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usernameInput = document.getElementById('admin-username');
    const passInput = document.getElementById('admin-password');
    
    // Tomar los valores exactos, sin transformaciones que puedan fallar en supabase
    const username = usernameInput.value.trim();
    const pass = passInput.value;

    const VALID_USERS = ['AristidesRental', 'PabloRental', 'UsuarioRental'];
    const MASTER_PASSWORD = '23062026ADMIN';

    // Validate locally first (opcional, pero ayuda a la rapidez si no es válido)
    if (!VALID_USERS.includes(username) || pass !== MASTER_PASSWORD) {
        alert('Credenciales incorrectas.');
        return;
    }

    if (supabaseClient) {
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Ingresando...';

        try {
            // Usar el nombre de usuario exacto para formar el email
            const userEmail = `${username}@rental.com`;
            
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: userEmail,
                password: pass
            });
            
            if (error) {
                // Auto-registro en caso de que el usuario no exista (solo para los 3 válidos)
                if (error.message.includes('Invalid login credentials') || error.status === 400) {
                    const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
                        email: userEmail,
                        password: pass
                    });
                    
                    if (signUpError) {
                        alert('Error de autenticación: ' + signUpError.message);
                    } else if (signUpData?.session) {
                        // El auth state change listener se encargará del resto
                    } else {
                        alert('Por favor verifica tu correo (si se requiere confirmación) o intenta nuevamente.');
                    }
                } else {
                    // Mostrar error original para debugear
                    alert('Error de autenticación: ' + error.message);
                }
            } else {
                // Login exitoso, el onAuthStateChange maneja el showDashboard
            }
        } catch (err) {
            alert('Error inesperado: ' + (err.message || err));
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    } else {
        alert('Error: Base de datos no configurada o desconectada.');
    }
});"""

content = re.sub(
    r'loginForm\.addEventListener\(\'submit\', async \(e\) => \{.*?\n\}\);\n',
    new_login_logic + '\n',
    content,
    flags=re.DOTALL
)

with open('js/admin.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Admin.js updated successfully.")
