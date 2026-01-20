document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    // Set to TRUE to test the "Live Now" features today. 
    // Set to FALSE for the actual festival.
    const SIMULATE_FESTIVAL = true; 
    const SIMULATED_DATE = "2025-02-12"; // Simulating the first day
    const SIMULATED_TIME = "15:45";      // Simulating 3:45 PM

    // --- DOM ELEMENTS ---
    const container = document.getElementById('schedule-container');
    const tabsContainer = document.getElementById('day-tabs');
    const searchInput = document.getElementById('search-input');
    const favToggleBtn = document.getElementById('fav-toggle');
    const emptyState = document.getElementById('empty-state');

    // --- STATE ---
    let allData = [];
    let currentDayIndex = 0;
    let favorites = JSON.parse(localStorage.getItem('jazzFestFavorites')) || []; // Load saved favs
    let showFavoritesOnly = false;

    // --- INITIALIZATION ---
    fetch('schedule.json')
        .then(res => res.json())
        .then(data => {
            allData = data;
            initTabs();
            renderEvents();
        })
        .catch(err => console.error(err));

    // --- EVENT LISTENERS ---
    searchInput.addEventListener('input', renderEvents);
    
    favToggleBtn.addEventListener('click', () => {
        showFavoritesOnly = !showFavoritesOnly;
        
        // Update Button Style
        if (showFavoritesOnly) {
            favToggleBtn.classList.add('active');
            favToggleBtn.innerHTML = `<i class="fa-solid fa-star"></i> Show All`;
        } else {
            favToggleBtn.classList.remove('active');
            favToggleBtn.innerHTML = `<i class="fa-regular fa-star"></i> My Schedule`;
        }
        renderEvents();
    });

    // --- FUNCTIONS ---

    function initTabs() {
        tabsContainer.innerHTML = '';
        allData.forEach((day, index) => {
            const btn = document.createElement('button');
            btn.className = `tab-btn ${index === 0 ? 'active' : ''}`;
            btn.innerText = day.date.replace("February", "Feb"); 
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
        let events = [...allData[currentDayIndex].events];

        // 1. Sort by Time
        events.sort((a, b) => a.time.localeCompare(b.time));

        // 2. Filter (Search & Favorites)
        const filteredEvents = events.filter(event => {
            const matchesSearch = event.title.toLowerCase().includes(searchTerm) || 
                                  event.venue.toLowerCase().includes(searchTerm);
            const matchesFav = showFavoritesOnly ? favorites.includes(event.title) : true;
            return matchesSearch && matchesFav;
        });

        // 3. Handle Empty State
        if (filteredEvents.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }

        // 4. Generate Cards
        filteredEvents.forEach(event => {
            const isFav = favorites.includes(event.title);
            const isLive = checkIsLive(allData[currentDayIndex].date, event.time);
            
            const card = document.createElement('div');
            card.className = `event-card ${isLive ? 'live-now' : ''}`;
            
            card.innerHTML = `
                <div class="event-time-box">
                    <span class="event-time">${event.time}</span>
                    ${isLive ? '<span class="live-badge">LIVE</span>' : ''}
                </div>
                
                <div class="event-details">
                    <h3 class="event-title">${event.title}</h3>
                    <div class="event-venue">
                        <i class="fa-solid fa-location-dot"></i> ${event.venue}
                    </div>
                </div>

                <button class="star-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite('${event.title}')">
                    <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-star"></i>
                </button>
            `;
            container.appendChild(card);
        });
    }

    // Global function for onclick access
    window.toggleFavorite = (title) => {
        if (favorites.includes(title)) {
            favorites = favorites.filter(t => t !== title);
        } else {
            favorites.push(title);
        }
        localStorage.setItem('jazzFestFavorites', JSON.stringify(favorites));
        renderEvents(); // Re-render to update icon state
    };

    // Helper: Check if event is happening "now"
    function checkIsLive(dateStr, timeStr) {
        let now = new Date();
        
        if (SIMULATE_FESTIVAL) {
            now = new Date(`${SIMULATED_DATE}T${SIMULATED_TIME}:00`);
        }

        const eventDay = dateStr.match(/\d+/)[0]; 
        
        if (now.getDate() != eventDay || now.getMonth() !== 1 || now.getFullYear() !== 2025) {
            return false;
        }

        const [eventHour, eventMin] = timeStr.split(':').map(Number);
        const eventDateObj = new Date(now);
        eventDateObj.setHours(eventHour, eventMin, 0);

        const eventEndObj = new Date(eventDateObj);
        eventEndObj.setMinutes(eventEndObj.getMinutes() + 60);

        return now >= eventDateObj && now < eventEndObj;
    }
});
