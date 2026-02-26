import React, { useState, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useApp } from '../context/AppContext';
import { getChoreEvents } from '../api';
import ChoreForm from './ChoreForm';
import ChorePopover from './ChorePopover';

export default function CalendarView() {
  const { calendarRef, refreshCalendar } = useApp();
  const [choreForm, setChoreForm] = useState(null); // null | { mode: 'create'|'edit', defaultDate?, choreId? }
  const [popover, setPopover] = useState(null); // null | { event, jsEvent }

  const fetchEvents = useCallback(async (fetchInfo, successCallback, failureCallback) => {
    try {
      const start = fetchInfo.startStr.slice(0, 10);
      const end = fetchInfo.endStr.slice(0, 10);
      const { events } = await getChoreEvents(start, end);
      successCallback(
        events.map(e => ({
          id: e.id,
          title: e.assigneeName ? `${e.title} (${e.assigneeName})` : e.title,
          start: e.occurrenceDate,
          allDay: true,
          backgroundColor: e.completed ? '#9ca3af' : e.color,
          borderColor: e.completed ? '#6b7280' : e.color,
          textColor: '#fff',
          classNames: e.completed ? ['event-completed'] : [],
          extendedProps: e,
        }))
      );
    } catch (err) {
      console.error(err);
      failureCallback(err);
    }
  }, []);

  const handleEventClick = useCallback(({ event, jsEvent }) => {
    jsEvent.preventDefault();
    setPopover({ event, jsEvent });
  }, []);

  const handleDateClick = useCallback(({ dateStr }) => {
    setChoreForm({ mode: 'create', defaultDate: dateStr });
  }, []);

  const handleFormClose = (saved) => {
    setChoreForm(null);
    if (saved) refreshCalendar();
  };

  const handlePopoverClose = (changed) => {
    setPopover(null);
    if (changed) refreshCalendar();
  };

  const handleEditFromPopover = (choreId) => {
    setPopover(null);
    setChoreForm({ mode: 'edit', choreId });
  };

  return (
    <div className="calendar-container">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek,dayGridDay',
        }}
        events={fetchEvents}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        height="100%"
        eventDisplay="block"
        dayMaxEvents={4}
      />

      {choreForm && (
        <ChoreForm
          mode={choreForm.mode}
          defaultDate={choreForm.defaultDate}
          choreId={choreForm.choreId}
          onClose={handleFormClose}
        />
      )}

      {popover && (
        <ChorePopover
          event={popover.event}
          jsEvent={popover.jsEvent}
          onClose={handlePopoverClose}
          onEdit={handleEditFromPopover}
        />
      )}

      <button
        className="fab-add"
        title="Add chore"
        onClick={() => setChoreForm({ mode: 'create' })}
      >
        +
      </button>
    </div>
  );
}
