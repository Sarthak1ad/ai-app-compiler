document.addEventListener('DOMContentLoaded', () => {
    const promptInput = document.getElementById('prompt-input');
    const compileBtn = document.getElementById('compile-btn');
    const demoBtn = document.getElementById('demo-btn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const modifySection = document.getElementById('modify-section');
    const modifyInput = document.getElementById('modify-input');
    const modifyBtn = document.getElementById('modify-btn');
    let currentSessionId = null;
    
    // Stages
    const stages = {
        intent: document.getElementById('stage-intent'),
        design: document.getElementById('stage-design'),
        schema: document.getElementById('stage-schema'),
        refine: document.getElementById('stage-refine')
    };

    // Output views
    const codeViews = {
        ui: document.getElementById('code-ui'),
        api: document.getElementById('code-api'),
        db: document.getElementById('code-db'),
        auth: document.getElementById('code-auth')
    };
    
    const previewEmpty = document.getElementById('preview-empty');
    const previewFrame = document.getElementById('app-preview-frame');
    const diagnosticsContent = document.getElementById('diagnostics-content');

    // Tab Switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });

    // Demo Prompt
    demoBtn.addEventListener('click', () => {
        promptInput.value = "Build a CRM with login, contacts, dashboard, role-based access, and premium plan with payments. Admins can see analytics.";
    });

    // Reset UI
    function resetUI() {
        Object.values(stages).forEach(el => {
            el.className = 'stage pending';
            el.querySelector('.stage-status').innerHTML = '<i class="fa-solid fa-circle-notch"></i>';
        });
        
        Object.values(codeViews).forEach(el => el.textContent = '{}');
        
        previewFrame.style.display = 'none';
        previewEmpty.style.display = 'flex';
        diagnosticsContent.innerHTML = '<p class="text-muted">Compiling...</p>';
    }

    function updateStage(stageId, status) {
        if (!stages[stageId]) return;
        const el = stages[stageId];
        el.className = `stage ${status}`;
        
        const statusIcon = el.querySelector('.stage-status');
        if (status === 'running') {
            statusIcon.innerHTML = '<i class="fa-solid fa-circle-notch"></i>';
        } else if (status === 'done') {
            statusIcon.innerHTML = '<i class="fa-solid fa-check"></i>';
        } else if (status === 'error') {
            statusIcon.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        }
    }

    // Compile logic using Server-Sent Events
    compileBtn.addEventListener('click', async () => {
        const prompt = promptInput.value.trim();
        if (!prompt) return alert('Please enter a prompt');

        resetUI();
        compileBtn.disabled = true;
        compileBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Compiling...';

        try {
            // Use SSE for real-time updates
            const url = `/api/compile/stream?prompt=${encodeURIComponent(prompt)}`;
            const eventSource = new EventSource(url);

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                if (data.type === 'error') {
                    alert('Compilation failed: ' + data.error);
                    eventSource.close();
                    compileBtn.disabled = false;
                    compileBtn.innerHTML = '<i class="fa-solid fa-bolt"></i> Compile App';
                    return;
                }

                if (data.type === 'final') {
                    eventSource.close();
                    handleFinalResult(data.result);
                    return;
                }

                // Handle stage updates
                if (data.stage && data.status) {
                    // Update current stage
                    updateStage(data.stage, data.status);
                    
                    // Mark previous stages as done
                    const stageOrder = ['intent', 'design', 'schema', 'refine'];
                    const currentIndex = stageOrder.indexOf(data.stage);
                    if (data.status === 'running') {
                        for (let i = 0; i < currentIndex; i++) {
                            updateStage(stageOrder[i], 'done');
                        }
                    }
                }
            };

            eventSource.onerror = (err) => {
                console.error("SSE Error:", err);
                eventSource.close();
                compileBtn.disabled = false;
                compileBtn.innerHTML = '<i class="fa-solid fa-bolt"></i> Compile App';
            };

        } catch (error) {
            console.error(error);
            alert('Failed to connect to server');
            compileBtn.disabled = false;
            compileBtn.innerHTML = '<i class="fa-solid fa-bolt"></i> Compile App';
        }
    });

    function handleFinalResult(result) {
        compileBtn.disabled = false;
        compileBtn.innerHTML = '<i class="fa-solid fa-bolt"></i> Compile App';

        if (!result.success) {
            updateStage('refine', 'error');
            return;
        }

        // All stages done
        Object.keys(stages).forEach(k => updateStage(k, 'done'));

        // Render Code Views with basic syntax highlighting approach
        const formatJSON = (obj) => {
            const str = JSON.stringify(obj || {}, null, 2);
            if (!str) return '{}';
            return str.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                let cls = 'color: #e5c07b;'; // number
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'color: #e06c75;'; // key
                    } else {
                        cls = 'color: #98c379;'; // string
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'color: #d19a66;'; // boolean
                } else if (/null/.test(match)) {
                    cls = 'color: #56b6c2;'; // null
                }
                return '<span style="' + cls + '">' + match + '</span>';
            });
        };

        codeViews.ui.innerHTML = formatJSON(result.schemas.ui);
        codeViews.api.innerHTML = formatJSON(result.schemas.api);
        codeViews.db.innerHTML = formatJSON(result.schemas.db);
        codeViews.auth.innerHTML = formatJSON(result.schemas.auth);

        // Render Diagnostics
        const metrics = result.diagnostics.metrics;
        const costs = result.diagnostics.costs;
        const repair = result.diagnostics.repairReport;
        
        diagnosticsContent.innerHTML = `
            <div class="diagnostic-card">
                <h3><i class="fa-solid fa-stopwatch"></i> Performance Metrics</h3>
                <div class="diagnostic-metrics">
                    <div class="metric">
                        <span class="metric-label">Total Time</span>
                        <span class="metric-value">${(metrics.totalTime / 1000).toFixed(2)}s</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Schema Generation</span>
                        <span class="metric-value">${(metrics.stageTimings.schema / 1000).toFixed(2)}s</span>
                    </div>
                </div>
            </div>
            
            <div class="diagnostic-card">
                <h3><i class="fa-solid fa-coins"></i> Token Usage & Cost</h3>
                <div class="diagnostic-metrics">
                    <div class="metric">
                        <span class="metric-label">Estimated Cost</span>
                        <span class="metric-value" style="color: var(--success)">$${costs.totalEstimatedCostUSD.toFixed(4)}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Groq Llama-3.1-8B Tokens</span>
                        <span class="metric-value">${costs.breakdown['llama-3.1-8b-instant'] ? costs.breakdown['llama-3.1-8b-instant'].tokens.completion + costs.breakdown['llama-3.1-8b-instant'].tokens.prompt : 0}</span>
                    </div>
                </div>
            </div>

            <div class="diagnostic-card">
                <h3><i class="fa-solid fa-wrench"></i> Repair Engine</h3>
                <div class="diagnostic-metrics">
                    <div class="metric">
                        <span class="metric-label">Initial Errors</span>
                        <span class="metric-value" style="color: ${repair.initialErrors.length > 0 ? 'var(--warning)' : 'var(--text-main)'}">${repair.initialErrors.length}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Repaired</span>
                        <span class="metric-value" style="color: var(--success)">${repair.repairedErrors.length}</span>
                    </div>
                </div>
                ${repair.unresolvedErrors.length > 0 ? `<p style="color: var(--danger); margin-top: 10px; font-size: 0.85rem">Unresolved errors: ${repair.unresolvedErrors.length}</p>` : ''}
            </div>
        `;

        // Render Preview
        if (result.appPreviewUrl) {
            previewEmpty.style.display = 'none';
            previewFrame.style.display = 'block';
            previewFrame.src = result.appPreviewUrl;
        }

        // Enable mid-way modification
        if (result.sessionId) {
            currentSessionId = result.sessionId;
            modifySection.style.display = 'block';
        }
    }

    // Mid-way modification handler
    modifyBtn.addEventListener('click', async () => {
        const modification = modifyInput.value.trim();
        if (!modification) return alert('Please describe the modification');
        if (!currentSessionId) return alert('Please compile an app first');

        modifyBtn.disabled = true;
        modifyBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Applying...';

        try {
            const response = await fetch('/api/refine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: currentSessionId, modification })
            });
            const data = await response.json();

            if (data.success && data.schemas) {
                const formatJSON = (obj) => {
                    const str = JSON.stringify(obj || {}, null, 2);
                    if (!str) return '{}';
                    return str.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                        let cls = 'color: #e5c07b;';
                        if (/^"/.test(match)) { cls = /:$/.test(match) ? 'color: #e06c75;' : 'color: #98c379;'; }
                        else if (/true|false/.test(match)) { cls = 'color: #d19a66;'; }
                        else if (/null/.test(match)) { cls = 'color: #56b6c2;'; }
                        return '<span style="' + cls + '">' + match + '</span>';
                    });
                };

                codeViews.ui.innerHTML = formatJSON(data.schemas.ui);
                codeViews.api.innerHTML = formatJSON(data.schemas.api);
                codeViews.db.innerHTML = formatJSON(data.schemas.db);
                codeViews.auth.innerHTML = formatJSON(data.schemas.auth);

                if (data.appPreviewUrl) {
                    previewEmpty.style.display = 'none';
                    previewFrame.style.display = 'block';
                    previewFrame.src = data.appPreviewUrl;
                }
                modifyInput.value = '';
                alert('✅ Modification applied successfully!');
            } else {
                alert('Modification failed: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            alert('Failed to apply modification: ' + error.message);
        }

        modifyBtn.disabled = false;
        modifyBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Apply Modification';
    });
});
