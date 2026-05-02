// ── Database Initialization (LocalStorage) ─────────────────────

function initDB() {
    // Initialize Admins
    if (!localStorage.getItem('admins')) {
        const initialAdmins = [
            { username: 'felix', password: '123' },
            { username: 'feeza', password: '123' },
            { username: 'ephrem', password: '123' },
            { username: 'georgy', password: '123' }
        ];
        localStorage.setItem('admins', JSON.stringify(initialAdmins));
    }

    // Initialize Donors
    if (!localStorage.getItem('donors')) {
        // Some dummy data just so the dashboard isn't empty, or start empty.
        localStorage.setItem('donors', JSON.stringify([]));
        localStorage.setItem('nextDonorId', '1');
    }

    // Initialize Donations
    if (!localStorage.getItem('donations')) {
        localStorage.setItem('donations', JSON.stringify([]));
        localStorage.setItem('nextDonationId', '1');
    }
}

// ── Authentication ─────────────────────────────────────────────

function login(username, password) {
    const admins = JSON.parse(localStorage.getItem('admins') || '[]');
    const admin = admins.find(a => a.username === username && a.password === password);
    if (admin) {
        localStorage.setItem('admin_logged_in', 'true');
        localStorage.setItem('admin_username', username);
        return true;
    }
    return false;
}

function logout() {
    localStorage.removeItem('admin_logged_in');
    localStorage.removeItem('admin_username');
    window.location.href = 'index.html';
}

function isLoggedIn() {
    return localStorage.getItem('admin_logged_in') === 'true';
}

function registerAdmin(username, password) {
    const admins = JSON.parse(localStorage.getItem('admins') || '[]');
    if (admins.find(a => a.username === username)) {
        return { success: false, message: 'Username already exists' };
    }
    admins.push({ username, password });
    localStorage.setItem('admins', JSON.stringify(admins));
    return { success: true };
}

// ── Donors Data ──────────────────────────────────────────────

function getDonors() {
    return JSON.parse(localStorage.getItem('donors') || '[]');
}

function getDonorById(id) {
    const donors = getDonors();
    return donors.find(d => d.id === parseInt(id));
}

function addDonor(donor) {
    const donors = getDonors();
    const id = parseInt(localStorage.getItem('nextDonorId'));
    donor.id = id;
    donor.created_at = new Date().toISOString();
    donors.push(donor);
    localStorage.setItem('donors', JSON.stringify(donors));
    localStorage.setItem('nextDonorId', id + 1);
    return id;
}

// ── Donations Data ────────────────────────────────────────────

function getDonations() {
    return JSON.parse(localStorage.getItem('donations') || '[]');
}

function getDonationsByDonor(donorId) {
    const donations = getDonations();
    return donations.filter(d => d.donor_id === parseInt(donorId)).sort((a, b) => new Date(b.donation_date) - new Date(a.donation_date));
}

function addDonation(donorId, dateStr) {
    const donations = getDonations();
    const id = parseInt(localStorage.getItem('nextDonationId'));
    donations.push({
        id: id,
        donor_id: parseInt(donorId),
        donation_date: dateStr
    });
    localStorage.setItem('donations', JSON.stringify(donations));
    localStorage.setItem('nextDonationId', id + 1);
    return id;
}

// ── Global Helper for Nav/Auth Rendering ───────────────────────

function renderNav() {
    const nav = document.querySelector('nav');
    if (!nav) return;
    
    // We expect a static nav, we'll just toggle the auth links
    const loggedIn = isLoggedIn();
    const authLinks = document.getElementById('auth-links');
    if (authLinks) {
        if (loggedIn) {
            authLinks.innerHTML = `
                <a href="register.html">Register Donor</a>
                <a href="donate.html">Record Donation</a>
                <a href="#" onclick="logout(); return false;">Logout</a>
            `;
        } else {
            authLinks.innerHTML = `
                <a href="login.html">Admin Login</a>
            `;
        }
    }
}

// Initialize on script load
initDB();
document.addEventListener('DOMContentLoaded', renderNav);
