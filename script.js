document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    
    // Set to TRUE to test the "Live Now" feature (Simulating Feb 12th 2026)
    // Set to FALSE for the actual festival
    const SIMULATE_FESTIVAL = false; 
    const SIMULATED_DATE = "2026-02-12"; 
    const SIMULATED_TIME = "14:15";      

    // --- DOM ELEMENTS ---
    const container = document.getElementById('schedule-container');
    const tabsContainer = document.getElementById('day-tabs');
    const searchInput = document.getElementById('search-input');
    const favToggleBtn = document.getElementById('fav-toggle');
    const emptyState = document.getElementById('empty-state');

    // --- STATE ---
    let allData = [];
    let currentDayIndex = 0;
    let favorites = JSON.parse(localStorage.getItem('jazzFestFavorites')) || [];
    let showFavoritesOnly = false;

    // --- INITIALIZATION ---
    fetch('schedule.json')
        .then(response => response.json())
        .then(data => {
            allData = groupEventsByDay(data);
            if(allData.length > 0) {
                initTabs();
                renderEvents();
            } else {
                container.innerHTML = '<p style="text-align:center;">No events found.</p>';
            }
        })
        .catch(err => {
            console.error('Error loading schedule:', err);
            container.innerHTML = '<p style="text-align:center;">Unable to load schedule.</p>';
        });

    // --- HELPER: Group Flat JSON by Date ---
    function groupEventsByDay(flatEvents) {
        const groups = {};
        flatEvents.forEach(event => {
            if (!groups[event.date]) {
                groups[event.date] = [];
            }
            groups[event.date].push(event);
        });
        
        return Object.keys(groups).map(date => {
            return {
                date: date,
                events: groups[date]
            };
        });
    }

    // --- EVENT LISTENERS ---
    searchInput.addEventListener('input', renderEvents);
    
    favToggleBtn.addEventListener('click', () => {
        showFavoritesOnly = !showFavoritesOnly;
        if (showFavoritesOnly) {
            favToggleBtn.classList.add('active');
            favToggleBtn.innerHTML = `<i class="fa-solid fa-star"></i> Show All`;
        } else {
            favToggleBtn.classList.remove('active');
            favToggleBtn.innerHTML = `<i class="fa-regular fa-star"></i> My Schedule`;
        }
        renderEvents();
    });

    // --- RENDER FUNCTIONS ---
    function initTabs() {
        tabsContainer.innerHTML = '';
        allData.forEach((day, index) => {
            const btn = document.createElement('button');
            btn.className = `tab-btn ${index === 0 ? 'active' : ''}`;
            
            // Use the full date string exactly as it appears in JSON
            btn.innerText = day.date;
            
            btn.onclick = () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentDayIndex = index;
                renderEvents();
            };
            tabsContainer.appendChild(btn);
        });
    }

    function renderEvents() {
        container.innerHTML = '';
        const searchTerm = searchInput.value.toLowerCase();
        
        if (!allData[currentDayIndex]) return;

        let events = [...allData[currentDayIndex].events];
        events.sort((a, b) => a.time.localeCompare(b.time));

        const filteredEvents = events.filter(event => {
            const matchesSearch = event.title.toLowerCase().includes(searchTerm) || 
                                  event.venue.toLowerCase().includes(searchTerm);
            const matchesFav = showFavoritesOnly ? favorites.includes(event.title) : true;
            return matchesSearch && matchesFav;
        });

        if (filteredEvents.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }

        filteredEvents.forEach((event, index) => {
            const isFav = favorites.includes(event.title);
            const isLive = checkIsLive(allData[currentDayIndex].date, event.time, event.end_time);
            
            const hasDetails = (event.description && event.description !== "") || (event.link && event.link !== "");
            const uniqueId = `event-${index}`;

            const card = document.createElement('div');
            card.className = `event-card ${isLive ? 'live-now' : ''}`;
            
            if (hasDetails) {
                card.onclick = (e) => {
                    if(e.target.closest('.star-btn') || e.target.closest('.info-btn')) return;
                    
                    const detailsDiv = document.getElementById(uniqueId);
                    const icon = card.querySelector('.expand-icon');
                    
                    if (detailsDiv.style.display === "block") {
                        detailsDiv.style.display = "none";
                        icon.style.transform = "rotate(0deg)";
                    } else {
                        detailsDiv.style.display = "block";
                        icon.style.transform = "rotate(180deg)";
                    }
                };
            } else {
                card.style.cursor = "default";
            }
            
            // Format Time Range (e.g., 14:00 - 15:00)
            const timeDisplay = event.end_time ? `${event.time} - ${event.end_time}` : event.time;

            card.innerHTML = `
                <div class="card-main">
                    <div class="event-time-box">
                        <span class="event-time">${timeDisplay}</span>
                        ${isLive ? '<span class="live-badge">LIVE</span>' : ''}
                    </div>
                    
                    <div class="event-details">
                        <h3 class="event-title">${event.title}</h3>
                        <div class="event-venue">
                            <i class="fa-solid fa-location-dot"></i> ${event.venue}
                        </div>
                    </div>

                    <div class="actions">
                        <button class="star-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite('${event.title}')">
                            <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-star"></i>
                        </button>
                        ${hasDetails ? '<i class="fa-solid fa-chevron-down expand-icon"></i>' : ''}
                    </div>
                </div>

                <div id="${uniqueId}" class="card-expanded" style="display: none;">
                    <div class="expanded-content">
                        ${event.description ? `<p class="event-desc">${event.description}</p>` : ''}
                        ${event.link ? `<a href="${event.link}" target="_blank" class="info-btn">View Full Event Details <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    window.toggleFavorite = (title) => {
        if (favorites.includes(title)) {
            favorites = favorites.filter(t => t !== title);
        } else {
            favorites.push(title);
        }
        localStorage.setItem('jazzFestFavorites', JSON.stringify(favorites));
        renderEvents();
    };

    function checkIsLive(dateStr, timeStr, endTimeStr) {
        let now = new Date();
        if (SIMULATE_FESTIVAL) {
            now = new Date(`${SIMULATED_DATE}T${SIMULATED_TIME}:00`);
        }
        
        const eventDayMatch = dateStr.match(/\d+/);
        if(!eventDayMatch) return false;
        const eventDay = parseInt(eventDayMatch[0]);

        // Updated for Year 2026
        if (now.getDate() != eventDay || now.getMonth() !== 1 || now.getFullYear() !== 2026) {
            return false;
        }

        const [startHour, startMin] = timeStr.split(':').map(Number);
        const startDate = new Date(now);
        startDate.setHours(startHour, startMin, 0);

        let endDate = new Date(startDate);
        if (endTimeStr) {
            const [endHour, endMin] = endTimeStr.split(':').map(Number);
            endDate.setHours(endHour, endMin, 0);
        } else {
            endDate.setMinutes(endDate.getMinutes() + 60);
        }

        return now >= startDate && now < endDate;
    }
});
// --- COOKIE CONSENT & ANALYTICS LOGIC ---
const GA_MEASUREMENT_ID = "G-T6XBMPFRH9"; // <--- PASTE YOUR ID HERE

const cookieBanner = document.getElementById('cookie-banner');
const acceptBtn = document.getElementById('cookie-accept');
const declineBtn = document.getElementById('cookie-decline');

// 1. Check if user has already chosen
if (!localStorage.getItem('jazzFestConsent')) {
    // No choice made yet -> Show Banner
    if(cookieBanner) cookieBanner.classList.remove('hidden');
} else {
    // Choice made previously
    if (localStorage.getItem('jazzFestConsent') === 'granted') {
        loadGoogleAnalytics();
    }
}

// 2. Handle Accept
if(acceptBtn) {
    acceptBtn.addEventListener('click', () => {
        localStorage.setItem('jazzFestConsent', 'granted');
        cookieBanner.classList.add('hidden');
        loadGoogleAnalytics();
    });
}

// 3. Handle Decline
if(declineBtn) {
    declineBtn.addEventListener('click', () => {
        localStorage.setItem('jazzFestConsent', 'denied');
        cookieBanner.classList.add('hidden');
    });
}

// 4. Function to Load Google Analytics (Only runs if accepted)
function loadGoogleAnalytics() {
    // Create script tag
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize DataLayer
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID);
    
    console.log("GA Loaded");
}
