// Navigation Logic
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`${viewId}-view`).classList.add('active');
    event.target.classList.add('active');

    // Load data based on view
    if (viewId === 'dashboard') loadStats();
    if (viewId === 'donors') loadDonors();
}

// Fetch and display dashboard stats
async function loadStats() {
    try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);

        document.getElementById('stat-total-donors').innerText = data.totalDonors;
        document.getElementById('stat-total-donations').innerText = data.totalDonations;
        document.getElementById('stat-today-donations').innerText = data.todayDonations;
        document.getElementById('stat-eligible').innerText = data.eligibleCount;
    } catch (err) {
        console.error('Failed to load stats:', err);
    }
}

// Fetch and display donors
async function loadDonors() {
    try {
        const res = await fetch('/api/donors');
        const donors = await res.json();
        
        if (donors.error) throw new Error(donors.error);

        const tbody = document.getElementById('donors-tbody');
        tbody.innerHTML = '';

        donors.forEach(d => {
            const tr = document.createElement('tr');
            
            const statusHtml = d.eligible 
                ? `<span class="badge eligible">Eligible</span>`
                : `<span class="badge ineligible">Wait ${90 - d.days_since} days</span>`;
                
            const btnHtml = `<button onclick="handleDonate(${d.donor_id})" class="btn btn-small" ${!d.eligible ? 'disabled' : ''}>Donate</button>`;

            tr.innerHTML = `
                <td>${d.name}</td>
                <td><span class="badge blood-group">${d.blood_group}</span></td>
                <td>${d.phone}</td>
                <td>${statusHtml}</td>
                <td>${btnHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Failed to load donors:', err);
    }
}

// Handle Recording a Donation
async function handleDonate(donorId) {
    if (!confirm('Record a new donation for this donor?')) return;
    
    try {
        const res = await fetch('/api/donate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ donor_id: donorId })
        });
        
        if (res.ok) {
            loadDonors(); // reload table
        } else {
            const data = await res.json();
            alert(data.error || 'Failed to record donation');
        }
    } catch (err) {
        console.error(err);
    }
}

// Handle Searching
document.getElementById('search-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const group = document.getElementById('search-group').value;
    
    try {
        const res = await fetch(`/api/search?blood_group=${encodeURIComponent(group)}`);
        const results = await res.json();
        
        if (results.error) throw new Error(results.error);

        const tbody = document.getElementById('search-tbody');
        tbody.innerHTML = '';
        document.getElementById('search-results-container').style.display = 'block';

        results.forEach(d => {
            const tr = document.createElement('tr');
            const isEligible = d.days_since === null || d.days_since >= 90;
            const statusHtml = isEligible 
                ? `<span class="badge eligible">Available</span>`
                : `<span class="badge ineligible">Unavailable</span>`;

            tr.innerHTML = `
                <td>${d.name}</td>
                <td>${d.address}</td>
                <td>${statusHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Failed to search:', err);
    }
});

// Handle Registration
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('reg-name').value,
        age: parseInt(document.getElementById('reg-age').value),
        gender: document.getElementById('reg-gender').value,
        blood_group: document.getElementById('reg-blood').value,
        phone: document.getElementById('reg-phone').value,
        address: document.getElementById('reg-address').value
    };

    try {
        const res = await fetch('/api/donors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (res.ok) {
            alert('Donor registered successfully!');
            document.getElementById('register-form').reset();
            // Simulate click to switch back to donors tab
            document.querySelectorAll('.nav-btn')[1].click();
        } else {
            const data = await res.json();
            alert(data.error || 'Failed to register');
        }
    } catch (err) {
        console.error('Registration failed:', err);
    }
});

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
});
