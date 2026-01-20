document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('schedule-container');
    const tabsContainer = document.getElementById('day-tabs');

    let allData = [];
    let currentDayIndex = 0;

    // Fetch the JSON data
    fetch('schedule.json')
        .then(response => response.json())
        .then(data => {
            allData = data;
            initSchedule();
        })
        .catch(error => {
            console.error('Error loading schedule:', error);
            container.innerHTML = '<p style="text-align:center; color: #888;">Unable to load schedule.</p>';
        });

    function initSchedule() {
        // Create Day Tabs
        allData.forEach((day, index) => {
            const btn = document.createElement('button');
            btn.className = `tab-btn ${index === 0 ? 'active' : ''}`;
            // Simplify date to "Thu 12th Feb" format if desired, or keep raw
            btn.innerText = day.date.replace("February", "Feb"); 
            btn.onclick = () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentDayIndex = index;
                renderEvents();
            };
            tabsContainer.appendChild(btn);
        });

        // Render initial view
        renderEvents();
    }

    function renderEvents() {
        container.innerHTML = '';
        
        // Get events for current day
        let events = [...allData[currentDayIndex].events];

        // ALWAYS Sort by Time
        events.sort((a, b) => a.time.localeCompare(b.time));

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
