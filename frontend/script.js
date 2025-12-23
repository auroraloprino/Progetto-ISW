const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

let currentDate = new Date();
let displayMonth = currentDate.getMonth();
let displayYear = currentDate.getFullYear();
let calendars = [];
let tags = [];
let selectedColor = '#0d4853';
let tagsVisible = true;
let tagIdCounter = 1;
let selectedDate = null;
let editingEventId = null;
let currentView = 'month';
let currentWeekStart = new Date();
let currentDayView = new Date();

const events = {};

let eventIdCounter = 1;

function switchView(view) {
  const monthCalendar = document.getElementById('monthCalendar');
  const weekViewInline = document.getElementById('weekViewInline');
  const dayViewInline = document.getElementById('dayViewInline');
  const viewSelector = document.getElementById('viewSelector');
  
  monthCalendar.style.display = 'none';
  weekViewInline.style.display = 'none';
  dayViewInline.style.display = 'none';
  
  currentView = view;
  viewSelector.value = view;
  
  if (view === 'month') {
    monthCalendar.style.display = 'flex';
    renderCalendar();
  } else if (view === 'week') {
    weekViewInline.style.display = 'flex';
    renderWeekViewInline();
  } else if (view === 'day') {
    currentDayView = new Date();
    dayViewInline.style.display = 'flex';
    renderDayViewInline();
  }
}

function renderWeekViewInline() {
  const weekGrid = document.getElementById('weekGridInline');
  const weekTitle = document.getElementById('weekViewTitleInline');
  
  const startOfWeek = new Date(currentWeekStart);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  
  weekTitle.textContent = `${startOfWeek.getDate()} ${months[startOfWeek.getMonth()]} - ${endOfWeek.getDate()} ${months[endOfWeek.getMonth()]} ${endOfWeek.getFullYear()}`;
  
  weekGrid.innerHTML = '';
  
  const timeColumn = document.createElement('div');
  timeColumn.className = 'week-time-column-inline';
  
  const timeHeader = document.createElement('div');
  timeHeader.className = 'week-time-header-inline';
  timeColumn.appendChild(timeHeader);
  
  const allDaySlot = document.createElement('div');
  allDaySlot.className = 'week-time-slot-inline';
  allDaySlot.textContent = 'Tutto il giorno';
  allDaySlot.style.fontSize = '0.7rem';
  timeColumn.appendChild(allDaySlot);
  
  for (let hour = 0; hour < 24; hour++) {
    const timeSlot = document.createElement('div');
    timeSlot.className = 'week-time-slot-inline';
    timeSlot.textContent = `${hour.toString().padStart(2, '0')}:00`;
    timeColumn.appendChild(timeSlot);
  }
  
  weekGrid.appendChild(timeColumn);
  
  for (let day = 0; day < 7; day++) {
    const dayColumn = document.createElement('div');
    dayColumn.className = 'week-day-column-inline';
    
    const currentDay = new Date(startOfWeek);
    currentDay.setDate(currentDay.getDate() + day);
    
    const dayHeader = document.createElement('div');
    dayHeader.className = 'week-day-header-inline';
    dayHeader.textContent = `${['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'][day]} ${currentDay.getDate()}`;
    dayColumn.appendChild(dayHeader);
    
    const dateKey = `${currentDay.getFullYear()}-${currentDay.getMonth() + 1}-${currentDay.getDate()}`;
    
    const allDaySlot = document.createElement('div');
    allDaySlot.className = 'week-hour-slot-inline';
    
    if (events[dateKey]) {
      events[dateKey].forEach(event => {
        const tag = tags.find(t => t.id == event.tag);
        if ((!event.tag || (tag && tag.visible)) && event.allDay) {
          const eventEl = document.createElement('div');
          eventEl.className = 'week-event-inline';
          eventEl.style.backgroundColor = getEventColor(event.tag);
          eventEl.innerHTML = `<strong>${getEventDisplayTitle(event, dateKey)}</strong>`;
          eventEl.onclick = () => editEvent(dateKey, event.id);
          allDaySlot.appendChild(eventEl);
        }
      });
    }
    
    dayColumn.appendChild(allDaySlot);
    
    for (let hour = 0; hour < 24; hour++) {
      const hourSlot = document.createElement('div');
      hourSlot.className = 'week-hour-slot-inline';
      
      if (events[dateKey]) {
        events[dateKey].forEach(event => {
          const tag = tags.find(t => t.id == event.tag);
          if ((!event.tag || (tag && tag.visible)) && !event.allDay) {
            const startDate = new Date(event.datetime);
            const endDate = event.endDatetime ? new Date(event.endDatetime) : startDate;
            const startDateKey = `${startDate.getFullYear()}-${startDate.getMonth() + 1}-${startDate.getDate()}`;
            const endDateKey = `${endDate.getFullYear()}-${endDate.getMonth() + 1}-${endDate.getDate()}`;
            
            let eventHour;
            if (dateKey === endDateKey && startDateKey !== endDateKey) {
              eventHour = endDate.getHours();
            } else {
              eventHour = startDate.getHours();
            }
            
            if (eventHour === hour) {
              const eventEl = document.createElement('div');
              eventEl.className = 'week-event-inline';
              eventEl.style.backgroundColor = getEventColor(event.tag);
              
              let displayTime;
              if (dateKey === endDateKey && startDateKey !== endDateKey) {
                displayTime = endDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
              } else {
                displayTime = startDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
              }
              
              eventEl.innerHTML = `<strong>${getEventDisplayTitle(event, dateKey)}</strong><span>${displayTime}</span>`;
              eventEl.onclick = () => editEvent(dateKey, event.id);
              hourSlot.appendChild(eventEl);
            }
          }
        });
      }
      
      dayColumn.appendChild(hourSlot);
    }
    
    weekGrid.appendChild(dayColumn);
  }
}

function renderDayViewInline() {
  const dayViewTitle = document.getElementById('dayViewTitleInline');
  const dayTimeline = document.getElementById('dayTimelineInline');
  
  dayViewTitle.textContent = `${currentDayView.getDate()} ${months[currentDayView.getMonth()]} ${currentDayView.getFullYear()}`;
  
  const dateKey = `${currentDayView.getFullYear()}-${currentDayView.getMonth() + 1}-${currentDayView.getDate()}`;
  const dayEvents = events[dateKey] || [];
  
  const allDayEvents = dayEvents.filter(event => {
    const tag = tags.find(t => t.id == event.tag);
    return (!event.tag || (tag && tag.visible)) && event.allDay;
  });
  
  let timelineHTML = '';
  
  if (allDayEvents.length > 0) {
    timelineHTML += `
      <div class="all-day-section">
        <div class="all-day-label">Tutto il giorno</div>
        <div class="all-day-events">
          ${allDayEvents.map(event => `
            <div class="all-day-event" 
                 style="background: ${getEventColor(event.tag)}" 
                 onclick="editEvent('${dateKey}', ${event.id})">
              <strong>${getEventDisplayTitle(event, dateKey)}</strong>
              <span>${event.type}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  for (let hour = 0; hour < 24; hour++) {
    const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
    const eventsInHour = dayEvents.filter(event => {
      const tag = tags.find(t => t.id == event.tag);
      if (event.tag && (!tag || !tag.visible)) return false;
      if (event.allDay) return false;
      
      const eventStart = new Date(event.datetime);
      const eventEnd = event.endDatetime ? new Date(event.endDatetime) : eventStart;
      const startDateKey = `${eventStart.getFullYear()}-${eventStart.getMonth() + 1}-${eventStart.getDate()}`;
      const endDateKey = `${eventEnd.getFullYear()}-${eventEnd.getMonth() + 1}-${eventEnd.getDate()}`;
      
      if (dateKey === endDateKey && startDateKey !== endDateKey) {
        return eventEnd.getHours() === hour;
      } else {
        return eventStart.getHours() <= hour && (eventEnd.getHours() > hour || (eventEnd.getHours() === hour && eventEnd.getMinutes() > 0));
      }
    });
    
    timelineHTML += `
      <div class="day-time-slot">
        <div class="day-time-label">${timeLabel}</div>
        <div class="day-time-content">
          ${eventsInHour.map((event, index) => {
            const eventStart = new Date(event.datetime);
            const eventEnd = event.endDatetime ? new Date(event.endDatetime) : null;
            const startDateKey = `${eventStart.getFullYear()}-${eventStart.getMonth() + 1}-${eventStart.getDate()}`;
            const endDateKey = eventEnd ? `${eventEnd.getFullYear()}-${eventEnd.getMonth() + 1}-${eventEnd.getDate()}` : startDateKey;
            
            let startTime, endTime, timeDisplay;
            
            if (dateKey === endDateKey && startDateKey !== endDateKey) {
              startTime = eventEnd.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
              endTime = '';
              timeDisplay = startTime;
            } else if (dateKey === startDateKey && startDateKey !== endDateKey) {
              startTime = eventStart.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
              endTime = '';
              timeDisplay = startTime;
            } else {
              startTime = eventStart.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
              endTime = eventEnd ? eventEnd.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '';
              timeDisplay = endTime ? `${startTime} - ${endTime}` : startTime;
            }
            
            return `
              <div class="day-event ${index > 0 ? 'overlapping' : ''}" 
                   style="background: ${getEventColor(event.tag)}" 
                   onclick="editEvent('${dateKey}', ${event.id})">
                <strong>${getEventDisplayTitle(event, dateKey)}</strong>
                <span>${timeDisplay} - ${event.type}</span>
              </div>
            `;
          }).join('')}
          ${eventsInHour.length === 0 ? `<div class="day-empty-slot" onclick="openEventModal(${currentDayView.getDate()}, ${currentDayView.getMonth()}, ${currentDayView.getFullYear()}, ${hour})">+</div>` : ''}
        </div>
      </div>
    `;
  }
  
  dayTimeline.innerHTML = timelineHTML;
}

function renderCalendar() {
  const monthYear = document.getElementById('monthYear');
  const calendarDays = document.getElementById('calendarDays');
  
  monthYear.textContent = `${months[displayMonth]} ${displayYear}`;
  calendarDays.innerHTML = '';
  
  const firstDay = new Date(displayYear, displayMonth, 1);
  const lastDay = new Date(displayYear, displayMonth + 1, 0);
  const prevLastDay = new Date(displayYear, displayMonth, 0);
  
  const firstDayIndex = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const lastDayDate = lastDay.getDate();
  const prevLastDayDate = prevLastDay.getDate();
  
  for (let i = firstDayIndex; i > 0; i--) {
    const day = document.createElement('div');
    day.classList.add('day', 'other-month');
    day.textContent = prevLastDayDate - i + 1;
    calendarDays.appendChild(day);
  }
  
  for (let i = 1; i <= lastDayDate; i++) {
    const day = document.createElement('div');
    day.classList.add('day');
    
    const dayNumber = document.createElement('span');
    dayNumber.textContent = i;
    day.appendChild(dayNumber);
    
    const dateKey = `${displayYear}-${displayMonth + 1}-${i}`;
    if (events[dateKey]) {
      const validEvents = events[dateKey].filter(event => {
        const tag = tags.find(t => t.id == event.tag);
        return !event.tag || (tag && tag.visible);
      });
      
      if (validEvents.length > 0) {
        day.classList.add('has-event');
        validEvents.forEach((event) => {
          const eventEl = document.createElement('div');
          eventEl.classList.add('calendar-event');
          eventEl.textContent = getEventDisplayTitle(event, dateKey);
          eventEl.style.backgroundColor = getEventColor(event.tag);
          eventEl.onclick = (e) => {
            e.stopPropagation();
            editEvent(dateKey, event.id);
          };
          day.appendChild(eventEl);
        });
      }
    }
    
    if (i === currentDate.getDate() && 
        displayMonth === currentDate.getMonth() && 
        displayYear === currentDate.getFullYear()) {
      day.classList.add('today');
    }
    
    day.addEventListener('click', () => {
      selectedDate = { day: i, month: displayMonth, year: displayYear };
      openEventModal(i, displayMonth, displayYear);
    });
    
    calendarDays.appendChild(day);
  }
  
  const totalCells = calendarDays.children.length;
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  
  for (let i = 1; i <= remainingCells; i++) {
    const day = document.createElement('div');
    day.classList.add('day', 'other-month');
    day.textContent = i;
    calendarDays.appendChild(day);
  }
  
  renderTodayEvents();
  renderWeekEvents();
}

function getEventColor(tagId) {
  if (!tagId) return '#0d4853';
  const tag = tags.find(t => t.id == tagId);
  return tag && tag.visible ? tag.color : '#0d4853';
}

function getEventDisplayTitle(event, currentDateKey) {
  if (!event.endDatetime) return event.title;
  
  const startDate = new Date(event.datetime);
  const endDate = new Date(event.endDatetime);
  const startDateKey = `${startDate.getFullYear()}-${startDate.getMonth() + 1}-${startDate.getDate()}`;
  const endDateKey = `${endDate.getFullYear()}-${endDate.getMonth() + 1}-${endDate.getDate()}`;
  
  if (startDateKey === endDateKey) return event.title;
  
  if (currentDateKey === startDateKey) return `Inizio (${event.title})`;
  if (currentDateKey === endDateKey) return `Fine (${event.title})`;
  return event.title;
}

function openEventModal(day, month, year, hour = 9) {
  const eventModal = document.getElementById('eventModal');
  const eventTitle = document.getElementById('eventTitle');
  const eventDateTime = document.getElementById('eventDateTime');
  const eventEndDateTime = document.getElementById('eventEndDateTime');
  const eventDescription = document.getElementById('eventDescription');
  const eventTag = document.getElementById('eventTag');
  const deleteBtn = document.getElementById('deleteEvent');
  const allDayEvent = document.getElementById('allDayEvent');
  const startDateLabel = document.getElementById('startDateLabel');
  const endDateLabel = document.getElementById('endDateLabel');
  
  const today = new Date();
  const actualDay = day || today.getDate();
  const actualMonth = month !== undefined ? month : today.getMonth();
  const actualYear = year || today.getFullYear();
  const dateStr = `${actualYear}-${String(actualMonth + 1).padStart(2, '0')}-${String(actualDay).padStart(2, '0')}`;
  const timeStr = `${String(hour).padStart(2, '0')}:00`;
  const endTimeStr = `${String(hour + 1).padStart(2, '0')}:00`;
  
  eventDateTime.type = 'datetime-local';
  eventEndDateTime.type = 'datetime-local';
  eventDateTime.value = `${dateStr}T${timeStr}`;
  eventEndDateTime.value = `${dateStr}T${endTimeStr}`;
  eventTitle.value = '';
  eventDescription.value = '';
  eventTag.value = '';
  allDayEvent.checked = false;
  startDateLabel.textContent = 'Data e Ora Inizio';
  endDateLabel.textContent = 'Data e Ora Fine';
  document.querySelector('input[name="eventType"][value="evento"]').checked = true;
  deleteBtn.style.display = 'none';
  editingEventId = null;
  
  eventModal.style.display = 'block';
}

function editEvent(dateKey, eventId) {
  const event = events[dateKey].find(e => e.id === eventId);
  if (!event) return;
  
  const eventModal = document.getElementById('eventModal');
  const eventTitle = document.getElementById('eventTitle');
  const eventDateTime = document.getElementById('eventDateTime');
  const eventEndDateTime = document.getElementById('eventEndDateTime');
  const eventDescription = document.getElementById('eventDescription');
  const eventTag = document.getElementById('eventTag');
  const deleteBtn = document.getElementById('deleteEvent');
  
  eventTitle.value = event.title;
  eventDateTime.value = event.datetime;
  eventEndDateTime.value = event.endDatetime || '';
  eventDescription.value = event.description;
  eventTag.value = event.tag;
  document.querySelector(`input[name="eventType"][value="${event.type}"]`).checked = true;
  
  deleteBtn.style.display = 'block';
  editingEventId = eventId;
  
  eventModal.style.display = 'block';
}

function saveEvent() {
  const title = document.getElementById('eventTitle').value.trim();
  const datetime = document.getElementById('eventDateTime').value;
  const endDatetime = document.getElementById('eventEndDateTime').value || null;
  const type = document.querySelector('input[name="eventType"]:checked').value;
  const description = document.getElementById('eventDescription').value.trim();
  const tag = document.getElementById('eventTag').value;
  const allDay = document.getElementById('allDayEvent').checked;
  
  if (!datetime) {
    return;
  }
  
  const startDate = new Date(datetime);
  const endDate = endDatetime ? new Date(endDatetime) : startDate;
  
  const newEvent = {
    id: editingEventId || eventIdCounter++,
    title: title || 'Evento senza titolo',
    datetime,
    endDatetime,
    type,
    description,
    tag,
    allDay
  };
  
  if (editingEventId) {
    for (const dateKey in events) {
      events[dateKey] = events[dateKey].filter(e => e.id !== editingEventId);
      if (events[dateKey].length === 0) delete events[dateKey];
    }
  }
  
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
    
    if (!events[dateKey]) {
      events[dateKey] = [];
    }
    
    events[dateKey].push(newEvent);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  document.getElementById('eventModal').style.display = 'none';
  if (currentView === 'month') renderCalendar();
  else if (currentView === 'week') renderWeekViewInline();
  else if (currentView === 'day') renderDayViewInline();
  renderTodayEvents();
  renderWeekEvents();
}

let confirmCallback = null;

function showConfirm(title, message, callback) {
  const modal = document.getElementById('confirmModal');
  const titleEl = document.getElementById('confirmTitle');
  const messageEl = document.getElementById('confirmMessage');
  
  titleEl.textContent = title;
  messageEl.textContent = message;
  confirmCallback = callback;
  modal.style.display = 'block';
}

function deleteEvent(e, dateKey, eventId) {
  e.stopPropagation();
  showConfirm('Elimina evento', 'Sei sicuro di voler eliminare questo evento?', () => {
    for (const key in events) {
      events[key] = events[key].filter(event => event.id !== eventId);
      if (events[key].length === 0) {
        delete events[key];
      }
    }
    if (currentView === 'month') renderCalendar();
    else if (currentView === 'week') renderWeekViewInline();
    else if (currentView === 'day') renderDayViewInline();
    renderTodayEvents();
    renderWeekEvents();
  });
}

function renderTodayEvents() {
  const todayEvents = document.getElementById('todayEvents');
  const today = new Date();
  const todayDateKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  
  const todayEventsList = [];
  const addedEventIds = new Set();
  
  for (const dateKey in events) {
    events[dateKey].forEach(event => {
      if (addedEventIds.has(event.id)) return;
      
      const eventStart = new Date(event.datetime);
      const eventEnd = event.endDatetime ? new Date(event.endDatetime) : eventStart;
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
      if ((eventStart <= endOfToday && eventEnd >= startOfToday)) {
        const tag = tags.find(t => t.id == event.tag);
        if (!event.tag || (tag && tag.visible)) {
          todayEventsList.push({
            ...event,
            displayTitle: getEventDisplayTitle(event, todayDateKey),
            dateKey: todayDateKey
          });
          addedEventIds.add(event.id);
        }
      }
    });
  }
  
  if (todayEventsList.length > 0) {
    todayEvents.innerHTML = todayEventsList.map(event => {
      const eventTime = event.allDay ? 'Tutto il giorno' : new Date(event.datetime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      const tag = tags.find(t => t.id == event.tag);
      const tagName = tag ? tag.name : '';
      return `
        <div class="event" onclick="editEvent('${event.dateKey}', ${event.id})">
          <div class="event-color" style="background: ${getEventColor(event.tag)}"></div>
          <div class="event-info">
            <h4>${event.displayTitle}</h4>
            <span>${eventTime} - ${event.type}${tagName ? ' - ' + tagName : ''}</span>
          </div>
          <button class="delete-event" onclick="deleteEvent(event, '${event.dateKey}', ${event.id})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
    }).join('');
  } else {
    todayEvents.innerHTML = '<div class="no-events">Nessun evento oggi</div>';
  }
}

function renderWeekEvents() {
  const weekEvents = document.getElementById('weekEvents');
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 6);
  
  const weekEventsList = [];
  const addedEventIds = new Set();
  
  for (let i = 1; i <= 6; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + i);
    const targetDateKey = `${targetDate.getFullYear()}-${targetDate.getMonth() + 1}-${targetDate.getDate()}`;
    
    for (const dateKey in events) {
      events[dateKey].forEach(event => {
        if (addedEventIds.has(`${event.id}-${targetDateKey}`)) return;
        
        const eventStart = new Date(event.datetime);
        const eventEnd = event.endDatetime ? new Date(event.endDatetime) : eventStart;
        const startOfTarget = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const endOfTarget = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);
        
        if ((eventStart <= endOfTarget && eventEnd >= startOfTarget)) {
          const tag = tags.find(t => t.id == event.tag);
          if (!event.tag || (tag && tag.visible)) {
            const eventTime = event.allDay ? 'Tutto il giorno' : eventStart.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
            
            const eventTitle = getEventDisplayTitle(event, targetDateKey);
            const tagName = tag ? tag.name : '';
            
            weekEventsList.push({
              id: event.id,
              title: eventTitle,
              time: eventTime,
              type: event.type,
              date: targetDate.getDate(),
              month: months[targetDate.getMonth()].slice(0, 3),
              dateKey: targetDateKey,
              tag: event.tag,
              tagName: tagName
            });
            
            addedEventIds.add(`${event.id}-${targetDateKey}`);
          }
        }
      });
    }
  }
  
  if (weekEventsList.length > 0) {
    weekEvents.innerHTML = weekEventsList.map(item => `
      <div class="event" onclick="editEvent('${item.dateKey}', ${item.id})">
        <div class="event-color" style="background: ${getEventColor(item.tag)}"></div>
        <div class="event-info">
          <h4>${item.title}</h4>
          <span>${item.date} ${item.month} - ${item.time} - ${item.type}${item.tagName ? ' - ' + item.tagName : ''}</span>
        </div>
        <button class="delete-event" onclick="deleteEvent(event, '${item.dateKey}', ${item.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `).join('');
  } else {
    weekEvents.innerHTML = '<div class="no-events">Nessun evento nei prossimi giorni</div>';
  }
}

function renderCalendarList() {
  const calendarList = document.getElementById('calendarList');
  const eventTag = document.getElementById('eventTag');
  
  calendarList.innerHTML = calendars.map(cal => `
    <div class="calendar-item">
      <div class="calendar-color" style="background: ${cal.color}"></div>
      <span>${cal.name}</span>
    </div>
  `).join('');
  
  if (eventTag) {
    eventTag.innerHTML = '<option value="">Seleziona tag</option>' + 
      calendars.map(cal => `<option value="${cal.name}">${cal.name}</option>`).join('');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  renderCalendar();
  renderTodayEvents();
  renderWeekEvents();
  renderDayViewInline();
  
  document.getElementById('prevMonth').addEventListener('click', () => {
    if (currentView === 'month') {
      displayMonth--;
      if (displayMonth < 0) {
        displayMonth = 11;
        displayYear--;
      }
      renderCalendar();
    }
  });
  
  document.getElementById('nextMonth').addEventListener('click', () => {
    if (currentView === 'month') {
      displayMonth++;
      if (displayMonth > 11) {
        displayMonth = 0;
        displayYear++;
      }
      renderCalendar();
    }
  });
  
  document.getElementById('viewSelector').addEventListener('change', (e) => {
    switchView(e.target.value);
  });
  
  document.getElementById('prevWeekInline').addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    renderWeekViewInline();
  });
  
  document.getElementById('nextWeekInline').addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    renderWeekViewInline();
  });
  
  document.getElementById('prevDayInline').addEventListener('click', () => {
    currentDayView.setDate(currentDayView.getDate() - 1);
    renderDayViewInline();
  });
  
  document.getElementById('nextDayInline').addEventListener('click', () => {
    currentDayView.setDate(currentDayView.getDate() + 1);
    renderDayViewInline();
  });
  
  document.getElementById('monthYear').addEventListener('click', () => switchView('month'));
  
  document.getElementById('toggleTags').addEventListener('click', () => {
    tagsVisible = !tagsVisible;
    renderTagsList();
  });
  
  const modal = document.getElementById('tagModal');
  const addBtn = document.getElementById('addTagBtn');
  const closeBtn = document.getElementById('closeTagModal');

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      editingTagId = null;
      document.getElementById('tagModalTitle').textContent = 'Aggiungi Tag';
      document.getElementById('tagName').value = '';
      selectedColor = '#0d4853';
      document.getElementById('customColorPicker').value = '#0d4853';
      document.querySelectorAll('#tagColorGrid .color-option').forEach(o => o.classList.remove('selected'));
      modal.style.display = 'block';
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  document.querySelectorAll('#tagColorGrid .color-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('#tagColorGrid .color-option').forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
      selectedColor = option.dataset.color;
      document.getElementById('customColorPicker').value = selectedColor;
    });
  });

  document.getElementById('customColorPicker').addEventListener('change', (e) => {
    selectedColor = e.target.value;
    document.querySelectorAll('#tagColorGrid .color-option').forEach(o => o.classList.remove('selected'));
  });

  document.getElementById('customColorPicker').addEventListener('input', (e) => {
    selectedColor = e.target.value;
    document.querySelectorAll('#tagColorGrid .color-option').forEach(o => o.classList.remove('selected'));
  });

  document.getElementById('saveTag').addEventListener('click', () => {
    const name = document.getElementById('tagName').value.trim();
    if (name) {
      if (editingTagId) {
        const tag = tags.find(t => t.id == editingTagId);
        if (tag) {
          tag.name = name;
          tag.color = selectedColor;
        }
        editingTagId = null;
      } else {
        tags.push({ 
          id: tagIdCounter++, 
          name, 
          color: selectedColor, 
          visible: true 
        });
      }
      renderTagsList();
      modal.style.display = 'none';
      document.getElementById('tagName').value = '';
      document.getElementById('tagModalTitle').textContent = 'Aggiungi Tag';
      document.querySelectorAll('#tagColorGrid .color-option').forEach(o => o.classList.remove('selected'));
      selectedColor = '#0d4853';
      document.getElementById('customColorPicker').value = '#0d4853';
      if (currentView === 'month') renderCalendar();
      else if (currentView === 'week') renderWeekViewInline();
      else if (currentView === 'day') renderDayViewInline();
    }
  });

  const eventModal = document.getElementById('eventModal');
  const closeEventModal = document.getElementById('closeEventModal');
  const saveEventBtn = document.getElementById('saveEvent');

  closeEventModal.addEventListener('click', () => {
    eventModal.style.display = 'none';
  });

  saveEventBtn.addEventListener('click', function(e) {
    e.preventDefault();
    saveEvent();
  });

  window.addEventListener('click', (e) => {
    if (e.target === eventModal) {
      eventModal.style.display = 'none';
    }
  });

  document.getElementById('allDayEvent').addEventListener('change', function() {
    const eventDateTime = document.getElementById('eventDateTime');
    const eventEndDateTime = document.getElementById('eventEndDateTime');
    const startDateLabel = document.getElementById('startDateLabel');
    const endDateLabel = document.getElementById('endDateLabel');
    
    if (this.checked) {
      const currentStartValue = eventDateTime.value;
      const currentEndValue = eventEndDateTime.value;
      
      eventDateTime.type = 'date';
      eventEndDateTime.type = 'date';
      
      if (currentStartValue) {
        eventDateTime.value = currentStartValue.split('T')[0];
      }
      if (currentEndValue) {
        eventEndDateTime.value = currentEndValue.split('T')[0];
      }
      
      startDateLabel.textContent = 'Data Inizio';
      endDateLabel.textContent = 'Data Fine';
    } else {
      const currentStartValue = eventDateTime.value;
      const currentEndValue = eventEndDateTime.value;
      
      eventDateTime.type = 'datetime-local';
      eventEndDateTime.type = 'datetime-local';
      
      if (currentStartValue) {
        eventDateTime.value = `${currentStartValue}T09:00`;
      }
      if (currentEndValue) {
        eventEndDateTime.value = `${currentEndValue}T10:00`;
      }
      
      startDateLabel.textContent = 'Data e Ora Inizio';
      endDateLabel.textContent = 'Data e Ora Fine';
    }
  });

  document.getElementById('deleteEvent').addEventListener('click', () => {
    if (editingEventId) {
      showConfirm('Elimina evento', 'Sei sicuro di voler eliminare questo evento?', () => {
        for (const dateKey in events) {
          events[dateKey] = events[dateKey].filter(e => e.id !== editingEventId);
          if (events[dateKey].length === 0) {
            delete events[dateKey];
          }
        }
        document.getElementById('eventModal').style.display = 'none';
        if (currentView === 'month') renderCalendar();
        else if (currentView === 'week') renderWeekViewInline();
        else if (currentView === 'day') renderDayViewInline();
        renderTodayEvents();
        renderWeekEvents();
      });
    }
  });

  document.getElementById('confirmYes').addEventListener('click', () => {
    if (confirmCallback) {
      confirmCallback();
      confirmCallback = null;
    }
    document.getElementById('confirmModal').style.display = 'none';
  });

  document.getElementById('confirmNo').addEventListener('click', () => {
    confirmCallback = null;
    document.getElementById('confirmModal').style.display = 'none';
  });

  renderTagsList();
});
function renderTagsList() {
  const tagsList = document.getElementById('tagsList');
  const eventTag = document.getElementById('eventTag');
  
  if (!tagsVisible) {
    tagsList.style.display = 'none';
    return;
  }
  
  tagsList.style.display = 'flex';
  tagsList.innerHTML = tags.map(tag => `
    <div class="tag-item" ondblclick="editTag('${tag.id}')">
      <div class="tag-checkbox ${tag.visible ? 'checked' : ''}" onclick="toggleTag('${tag.id}')">
        ${tag.visible ? '<i class="fas fa-check"></i>' : ''}
      </div>
      <div class="tag-color" style="background: ${tag.color}"></div>
      <span class="tag-name">${tag.name}</span>
      <button class="delete-tag-btn" onclick="deleteTag('${tag.id}')">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `).join('');
  
  if (eventTag) {
    eventTag.innerHTML = '<option value="">Seleziona tag</option>' + 
      tags.map(tag => `<option value="${tag.id}" data-color="${tag.color}">${tag.name}</option>`).join('');
  }
}

function toggleTag(tagId) {
  const tag = tags.find(t => t.id == tagId);
  if (tag) {
    tag.visible = !tag.visible;
    renderTagsList();
    renderTodayEvents();
    renderWeekEvents();
    if (currentView === 'month') renderCalendar();
    else if (currentView === 'week') renderWeekViewInline();
    else if (currentView === 'day') renderDayViewInline();
  }
}
function deleteTag(tagId) {
  showConfirm('Elimina tag', 'Sei sicuro di voler eliminare questo tag? Tutti gli eventi associati verranno rimossi.', () => {
    for (const dateKey in events) {
      events[dateKey] = events[dateKey].filter(event => event.tag != tagId);
      if (events[dateKey].length === 0) {
        delete events[dateKey];
      }
    }
    tags = tags.filter(t => t.id != tagId);
    renderTagsList();
    renderTodayEvents();
    renderWeekEvents();
    if (currentView === 'month') renderCalendar();
    else if (currentView === 'week') renderWeekViewInline();
    else if (currentView === 'day') renderDayViewInline();
  });
}
let editingTagId = null;

function editTag(tagId) {
  const tag = tags.find(t => t.id == tagId);
  if (!tag) return;
  
  editingTagId = tagId;
  document.getElementById('tagModalTitle').textContent = 'Modifica Tag';
  document.getElementById('tagName').value = tag.name;
  selectedColor = tag.color;
  document.getElementById('customColorPicker').value = tag.color;
  
  document.querySelectorAll('#tagColorGrid .color-option').forEach(o => o.classList.remove('selected'));
  const matchingOption = document.querySelector(`#tagColorGrid .color-option[data-color="${tag.color}"]`);
  if (matchingOption) {
    matchingOption.classList.add('selected');
  }
  
  document.getElementById('tagModal').style.display = 'block';
}