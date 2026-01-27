document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const CSV_FILE_URL = "schedule.csv"; 
    
    // Set to FALSE for the actual festival
    const SIMULATE_FESTIVAL = true; 
    const SIMULATED_DATE = "2025-02-12"; 
    const SIMULATED_TIME = "15:45";      

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
    fetch(CSV_FILE_URL)
        .then(response => response.text())
        .then(csvText => {
            allData = parseCSV(csvText);
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

    // --- CSV PARSER ---
    function parseCSV(csvText) {
        const rows = csvText.split('\n').map(row => row.trim()).filter(row => row.length > 0);
        const rawEvents = [];

        // Skip Header
        for (let i = 1; i < rows.length; i++) {
            // Regex to split by comma ONLY if not inside quotes
            const columns = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            
            if (columns.length >= 4) {
                const clean = (txt) => txt ? txt.replace(/^"|"$/g, '').trim() : "";

                rawEvents.push({ 
                    date: clean(columns[0]),
                    time: clean(columns[1]),
                    venue: clean(columns[2]),
                    title: clean(columns[3]),
                    description: clean(columns[4]), // Can be empty
                    link: clean(columns[5])         // Can be empty
                });
            }
        }

        const groupedData = [];
        const uniqueDates = [...new Set(rawEvents.map(e => e.date))];

        uniqueDates.forEach(date => {
            if(date) {
                groupedData.push({
                    date: date,
                    events: rawEvents.filter(e => e.date === date)
                });
            }
        });

        return groupedData;
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
            let shortDate = day.date;
            try {
                 shortDate = day.date.replace("February", "Feb").split(',')[0] + " " + day.date.match(/\d+(st|nd|rd|th)/)[0];
            } catch(e) {}
            btn.innerText = shortDate;
            
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
            const isLive = checkIsLive(allData[currentDayIndex].date, event.time);
            
            // KEY CHANGE: Check if description OR link exists
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
                // If no details, change cursor to default
                card.style.cursor = "default";
            }
            
            card.innerHTML = `
                <div class="card-main">
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

    function checkIsLive(dateStr, timeStr) {
        let now = new Date();
        if (SIMULATE_FESTIVAL) {
            now = new Date(`${SIMULATED_DATE}T${SIMULATED_TIME}:00`);
        }
        
        const eventDayMatch = dateStr.match(/\d+/);
        if(!eventDayMatch) return false;
        const eventDay = parseInt(eventDayMatch[0]);

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
