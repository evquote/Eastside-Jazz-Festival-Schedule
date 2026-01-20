document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('schedule-container');
    const tabsContainer = document.getElementById('day-tabs');
    const sortTimeBtn = document.getElementById('sort-time');
    const sortVenueBtn = document.getElementById('sort-venue');

    let allData = [];
    let currentDayIndex = 0;
    let currentSortMode = 'time'; // 'time' or 'venue'

    // Fetch the JSON data
    fetch('schedule.json')
        .then(response => response.json())
        .then(data => {
            allData = data;
            initSchedule();
        })
        .catch(error => {
            console.error('Error loading schedule:', error);
            container.innerHTML = '<p>Error loading schedule.</p>';
        });

    function initSchedule() {
        // Create Day Tabs
        allData.forEach((day, index) => {
            const btn = document.createElement('button');
            btn.className = `tab-btn ${index === 0 ? 'active' : ''}`;
            btn.innerText = day.date; // e.g. "Thursday 12th"
            btn.onclick = () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentDayIndex = index;
                renderEvents();
            };
            tabsContainer.appendChild(btn);
        });

        // Setup Sort Buttons
        sortTimeBtn.addEventListener('click', () => {
            setSortMode('time');
        });
        sortVenueBtn.addEventListener('click', () => {
            setSortMode('venue');
        });

        // Render initial view
        renderEvents();
    }

    function setSortMode(mode) {
        currentSortMode = mode;
        
        // Update UI classes
        if (mode === 'time') {
            sortTimeBtn.classList.add('active');
            sortVenueBtn.classList.remove('active');
        } else {
            sortVenueBtn.classList.add('active');
            sortTimeBtn.classList.remove('active');
        }
        
        renderEvents();
    }

    function renderEvents() {
        container.innerHTML = '';
        
        // Get events for current day
        let events = [...allData[currentDayIndex].events];

        // Apply Sorting
        if (currentSortMode === 'time') {
            // Sort by Time
            events.sort((a, b) => a.time.localeCompare(b.time));
        } else {
            // Sort by Venue, then by Time
            events.sort((a, b) => {
                if (a.venue < b.venue) return -1;
                if (a.venue > b.venue) return 1;
                return a.time.localeCompare(b.time); // If venue is same, sort by time
            });
        }

        // Generate HTML
        events.forEach(event => {
            const card = document.createElement('div');
            card.className = 'event-card';
            
            card.innerHTML = `
                <div class="event-time">${event.time}</div>
                <div class="event-details">
                    <h3 class="event-title">${event.title}</h3>
                    <div class="event-venue">${event.venue}</div>
                </div>
            `;
            container.appendChild(card);
        });
    }
});
