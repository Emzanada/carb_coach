import { SYSTEM_PROMPT } from './system_prompt.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('carb-form');
    const outputContainer = document.getElementById('output-container');
    const planDisplay = document.getElementById('plan-display');
    const resetBtn = document.getElementById('reset-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Gather Data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // 2. Construct Prompt (for demonstration/logging)
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

**History:**
${data.history || 'None provided'}
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
        form.classList.add('hidden');
        outputContainer.classList.remove('hidden');
        outputContainer.scrollIntoView({ behavior: 'smooth' });
    }

    function generateSimulatedPlan(data) {
        // Logic to make the simulation feel "real" based on inputs
        const isElite = data.experience === 'elite' || data.experience === 'experienced';
        const isUltra = data.distance === 'ultra';
        const isHot = data.weather.toLowerCase().includes('hot') || (parseInt(data.weather) > 24);

        let carbTarget = isElite ? '80-90g' : '50-60g';
        if (isUltra) carbTarget = '60-70g (steady state)';

        let fluidTarget = isHot ? '700-800ml' : '500-600ml';
        let sodiumTarget = isHot ? 'High (700mg+ / hr)' : 'Moderate (400-500mg / hr)';

        return `
            <h3>🏁 Race Strategy: ${data.distance.toUpperCase()}</h3>
            <p><strong>Goal Time:</strong> ${data['target-time']} | <strong>Weather Impact:</strong> ${isHot ? '⚠️ Heat Strategy Active' : 'Normal Conditions'}</p>
            
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
                    <tr>
                        <td><strong>Pre-Race</strong><br>(15 min out)</td>
                        <td>Top off glycogen & caffeine</td>
                        <td>1 Gel + Small sip of water</td>
                    </tr>
                    <tr>
                        <td><strong>Hour 1</strong></td>
                        <td>Settle into pace, start fueling early</td>
                        <td>${carbTarget} carbs (approx 2-3 gels) + ${fluidTarget} fluid</td>
                    </tr>
                    <tr>
                        <td><strong>Hour 2</strong></td>
                        <td>Maintain steady intake</td>
                        <td>${carbTarget} carbs + Electrolytes focus</td>
                    </tr>
                    <tr>
                        <td><strong>Hour 3+</strong></td>
                        <td>Mental check, caffeine boost if needed</td>
                        <td>${carbTarget} carbs + Caffeine gel if tolerant</td>
                    </tr>
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
});
