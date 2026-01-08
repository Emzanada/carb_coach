import { SYSTEM_PROMPT } from './system_prompt.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('carb-form');
    const reviewForm = document.getElementById('review-form');
    const outputContainer = document.getElementById('output-container');
    const planDisplay = document.getElementById('plan-display');
    const resetBtn = document.getElementById('reset-btn');

    // Navigation
    const navPlanBtn = document.getElementById('nav-plan');
    const navReviewBtn = document.getElementById('nav-review');

    function switchTab(tab) {
        if (tab === 'plan') {
            form.classList.remove('hidden');
            reviewForm.classList.add('hidden');
            outputContainer.classList.add('hidden');
            navPlanBtn.classList.add('active');
            navReviewBtn.classList.remove('active');
        } else {
            form.classList.add('hidden');
            reviewForm.classList.remove('hidden');
            outputContainer.classList.add('hidden');
            navPlanBtn.classList.remove('active');
            navReviewBtn.classList.add('active');
        }
    }

    navPlanBtn.addEventListener('click', () => switchTab('plan'));
    navReviewBtn.addEventListener('click', () => switchTab('review'));

    // --- Review Logic ---
    reviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(reviewForm);
        const reviewData = Object.fromEntries(formData.entries());

        saveReview(reviewData);

        // Simple feedback
        const btn = reviewForm.querySelector('.review-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Saved!';
        btn.style.backgroundColor = '#10b981';

        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = '';
            reviewForm.reset();
            switchTab('plan'); // Go back to plan to encourage next step
        }, 1000);
    });

    function saveReview(review) {
        const reviews = JSON.parse(localStorage.getItem('carbCoach_reviews') || '[]');
        reviews.push(review);
        localStorage.setItem('carbCoach_reviews', JSON.stringify(reviews));
        console.log('Review saved:', review);
    }

    function getFormattedHistory() {
        const reviews = JSON.parse(localStorage.getItem('carbCoach_reviews') || '[]');
        if (reviews.length === 0) return '';

        return reviews.map(r => `
- **Run:** ${r['review-date']}
- **Rating:** ${r['review-rating']}/5
- **Notes:** ${r['review-notes']}
        `).join('\n');
    }

    // --- Plan Generation Logic ---

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Gather Data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // 2. Construct Prompt (for demonstration/logging)
        const historicalReviews = getFormattedHistory();

        const userContext = `
**Runner Profile:**
- Experience: ${data.experience}
- GI Issues: ${data['gi-issues'] || 'None'}
- Fuel Preferences: ${data['fuel-pref'] || 'Any'}

**Race Details:**
- Distance: ${data.distance}
- Target Time: ${data['target-time']}
- Weather: ${data.weather}

**Pre-Race Context:**
- Sleep: ${data.sleep}
- Last Meal: ${data['last-meal']}

**Medical/Manual History:**
${data.history || 'None provided'}

**Past Run Reviews (Fine-Tuning Data):**
${historicalReviews || 'No past reviews logged yet.'}
        `;

        const fullPrompt = `${SYSTEM_PROMPT}\n\n---\n\nUser Context:\n${userContext}`;
        console.log("Full Prompt constructed:", fullPrompt);

        // 3. Simulate LLM Response
        // In a real app, this would be: const response = await callLLM(fullPrompt);
        setLoading(true);

        // Simulate network delay
        setTimeout(() => {
            const planHTML = generateSimulatedPlan(data);
            displayPlan(planHTML);
            setLoading(false);
        }, 1500);
    });

    resetBtn.addEventListener('click', () => {
        form.reset();
        outputContainer.classList.add('hidden');
        form.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    function setLoading(isLoading) {
        const btn = form.querySelector('.generate-btn');
        if (isLoading) {
            btn.textContent = 'Analyzing Profile & Generating Plan...';
            btn.disabled = true;
            btn.style.opacity = '0.7';
        } else {
            btn.textContent = 'Generate Plan';
            btn.disabled = false;
            btn.style.opacity = '1';
        }
    }

    function displayPlan(htmlContent) {
        planDisplay.innerHTML = htmlContent;
        form.classList.add('hidden'); // Hide form
        navReviewBtn.classList.remove('active');
        navPlanBtn.classList.add('active'); // Visually keep us on 'Plan' tab concept
        outputContainer.classList.remove('hidden');
        outputContainer.scrollIntoView({ behavior: 'smooth' });
    }

    function generateSimulatedPlan(data) {
        // 1. Parse Duration
        const hours = parseDuration(data['target-time']);

        // 2. Analyze History (Simple Keyword Match)
        const reviews = JSON.parse(localStorage.getItem('carbCoach_reviews') || '[]');
        let historyAdjustments = [];
        let adjustmentBadge = '';

        // Base Defaults
        const isElite = data.experience === 'elite' || data.experience === 'experienced';
        const isUltra = data.distance === 'ultra';
        const isHot = data.weather.toLowerCase().includes('hot') || (parseInt(data.weather) > 24);

        let carbTargetVal = isElite ? 90 : 60;
        if (isUltra) carbTargetVal = 60; // steady state

        // Apply Adjustments
        const fullHistoryText = reviews.map(r => r['review-notes'].toLowerCase()).join(' ');

        if (fullHistoryText.includes('bloated') || fullHistoryText.includes('stomach') || fullHistoryText.includes('gi')) {
            carbTargetVal -= 10;
            historyAdjustments.push('Reduced carbs due to past GI issues');
        }
        if (fullHistoryText.includes('bonk') || fullHistoryText.includes('tired') || fullHistoryText.includes('crash')) {
            carbTargetVal += 10;
            historyAdjustments.push('Increased carbs to prevent bonking');
        }
        if (fullHistoryText.includes('cramp')) {
            historyAdjustments.push('Added aggressive sodium strategy due to cramp history');
        }

        let carbTarget = `${carbTargetVal}-${carbTargetVal + 10}g`;
        let fluidTarget = isHot ? '700-800ml' : '500-600ml';
        let sodiumTarget = isHot ? 'High (700mg+ / hr)' : 'Moderate (400-500mg / hr)';

        if (historyAdjustments.length > 0) {
            adjustmentBadge = `
                <div class="history-badge">
                    <strong>⚡ Adaptive AI Refinements:</strong>
                    <ul>
                        ${historyAdjustments.map(adj => `<li>${adj}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        // 3. Generate Hour Rows
        let tableRows = '';
        const totalHours = Math.ceil(hours);

        // Pre-race row
        tableRows += `
            <tr>
                <td><strong>Pre-Race</strong><br>(15 min out)</td>
                <td>Top off glycogen & caffeine</td>
                <td>1 Gel + Small sip of water</td>
            </tr>
        `;

        for (let i = 1; i <= totalHours; i++) {
            let label = `Hour ${i}`;
            let action = 'Maintain steady intake';
            let product = `${carbTarget} carbs + ${fluidTarget} fluid`;

            if (i === 1) {
                action = 'Settle into pace, start fueling early';
                product = `${carbTarget} carbs (approx 2-3 gels) + ${fluidTarget} fluid`;
            } else if (i === totalHours) {
                action = 'Final push - shift to liquid carbs if needed';
                product = 'Use remaining fuel detailed above';
            }

            tableRows += `
                <tr>
                    <td><strong>${label}</strong></td>
                    <td>${action}</td>
                    <td>${product}</td>
                </tr>
            `;
        }

        return `
            <h3>🏁 Race Strategy: ${data.distance.toUpperCase()}</h3>
            <p><strong>Goal Time:</strong> ${data['target-time']} (${hours.toFixed(1)} hrs) | <strong>Weather Impact:</strong> ${isHot ? '⚠️ Heat Strategy Active' : 'Normal Conditions'}</p>
            
            ${adjustmentBadge}

            <h4>🚀 Core Nutrition Targets</h4>
            <ul>
                <li><strong>Carbohydrates:</strong> ${carbTarget} per hour</li>
                <li><strong>Fluids:</strong> ${fluidTarget} per hour</li>
                <li><strong>Sodium:</strong> ${sodiumTarget}</li>
            </ul>

            <h4>📋 Hour-by-Hour Plan</h4>
            <table>
                <thead>
                    <tr>
                        <th>Hour / Mile</th>
                        <th>Action Item</th>
                        <th>Product Suggestion</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>

            <h4>💡 Coach's Notes</h4>
            <ul>
                <li><strong>Start Slow:</strong> Don't bank time. Trust the nutrition to kick in.</li>
                <li><strong>GI Check:</strong> ${data['gi-issues'] ? `Since you mentioned <em>${data['gi-issues']}</em>, stick to your tested fuel sources strictly.` : 'Listen to your stomach. If bloated, switch to water for 10 mins then resume.'}</li>
                <li><strong>Hydration:</strong> ${isHot ? 'Drink to thirst but keep a minimum baseline. Heat will increase perceived effort.' : 'Sip consistently, don\'t gulp.'}</li>
            </ul>
        `;
    }

    function parseDuration(timeStr) {
        // Formats: "3:45", "3:45:00", "4 hours", "3.5"
        if (!timeStr) return 3; // Default

        // Try HH:MM:SS
        if (timeStr.includes(':')) {
            const parts = timeStr.split(':').map(Number);
            if (parts.length >= 2) {
                return parts[0] + (parts[1] / 60) + ((parts[2] || 0) / 3600);
            }
        }

        // Try pure number
        const num = parseFloat(timeStr);
        if (!isNaN(num)) return num;

        return 3; // Fallback
    }
});
