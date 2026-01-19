document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('schedule-container');
    const tabsContainer = document.getElementById('day-tabs');

    // Fetch the JSON data
    fetch('schedule.json')
        .then(response => response.json())
        .then(data => {
            initSchedule(data);
        })
        .catch(error => {
            console.error('Error loading schedule:', error);
            container.innerHTML = '<p>Error loading schedule. Please try again.</p>';
        });

    function initSchedule(daysData) {
        // Create Day Tabs
        daysData.forEach((day, index) => {
            const btn = document.createElement('button');
            btn.className = `tab-btn ${index === 0 ? 'active' : ''}`;
            btn.innerText = day.date;
            btn.onclick = () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderEvents(day.events);
            };
            tabsContainer.appendChild(btn);
        });

        // Render first day by default
        if(daysData.length > 0) {
            renderEvents(daysData[0].events);
        }
    }

    function renderEvents(events) {
        container.innerHTML = ''; // Clear current list
        
        // Sort events by time just in case
        events.sort((a, b) => a.time.localeCompare(b.time));

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
