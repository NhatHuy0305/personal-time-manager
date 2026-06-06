import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../api/axios';
import AddTaskModal from '../components/AddTaskModal';

const locales = {
  'vi': vi,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CalendarView = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State điều khiển Lịch (Tránh lỗi không chuyển được tháng)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');

  // State quản lý Modal sửa Task
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks', {
        params: { size: 1000 } // Lấy một lượng lớn task để hiển thị trên lịch
      });
      
      let taskList = [];
      if (Array.isArray(response.data)) taskList = response.data; 
      else if (response.data?.content) taskList = response.data.content; 
      else if (response.data?.data) taskList = response.data.data; 

      // Chuyển đổi dữ liệu Task thành định dạng Event của react-big-calendar
      const getMatrixColor = (matrix) => {
        switch (matrix) {
          case 'URGENT_IMPORTANT': return '#ef4444'; // Red
          case 'NOT_URGENT_IMPORTANT': return '#3b82f6'; // Blue
          case 'URGENT_NOT_IMPORTANT': return '#f59e0b'; // Amber
          case 'NOT_URGENT_NOT_IMPORTANT': return '#94a3b8'; // Slate
          default: return '#3b82f6';
        }
      };

      const calendarEvents = taskList
        .filter(t => t.dueDate) // Chỉ lấy các task có hạn chót
        .map(t => {
          const dueDate = new Date(t.dueDate);
          const matrix = t.eisenhowerMatrix || t.eisenhower_matrix;
          return {
            id: t.id,
            title: t.title,
            start: dueDate,
            end: dueDate,
            allDay: false, // Để hiện thị thời gian cụ thể trong ngày/tuần
            resource: t, // Lưu lại nguyên gốc task để dùng khi click
            color: getMatrixColor(matrix), // Lấy màu theo 4 ô ma trận
          };
        });

      setEvents(calendarEvents);
    } catch (error) {
      console.error("Lỗi khi tải lịch:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSelectEvent = (event) => {
    setTaskToEdit(event.resource);
    setIsModalOpen(true);
  };

  const eventStyleGetter = (event, start, end, isSelected) => {
    var backgroundColor = event.color;
    var style = {
      backgroundColor: backgroundColor,
      borderRadius: '6px',
      opacity: event.resource.completed ? 0.5 : 0.9,
      color: 'white',
      border: '0px',
      display: 'block',
      padding: '2px 5px',
      fontSize: '12px',
      fontWeight: '500',
      textDecoration: event.resource.completed ? 'line-through' : 'none'
    };
    return {
      style: style
    };
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-gray-500 font-medium">Đang tải lịch trình...</div>;
  }

  return (
    <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 min-h-screen transition-colors">
      <div className="max-w-7xl mx-auto pb-8">
        <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Lịch trình</h1>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Quản lý và xem các công việc theo thời gian</p>
          </div>
          
          <div className="flex flex-wrap gap-2 md:gap-3 mt-2 md:mt-0 text-[11px] font-medium text-gray-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-md border border-gray-100 dark:border-slate-700 shadow-xs">
              <div className="w-3 h-3 rounded-sm bg-red-500"></div>
              <span>Khẩn & Quan trọng</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-md border border-gray-100 dark:border-slate-700 shadow-xs">
              <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
              <span>Quan trọng, Không khẩn</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-md border border-gray-100 dark:border-slate-700 shadow-xs">
              <div className="w-3 h-3 rounded-sm bg-amber-500"></div>
              <span>Khẩn, Không quan trọng</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-md border border-gray-100 dark:border-slate-700 shadow-xs">
              <div className="w-3 h-3 rounded-sm bg-slate-400"></div>
              <span>Không khẩn, Không quan trọng</span>
            </div>
          </div>
        </header>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xs border border-gray-100/80 dark:border-slate-700 text-gray-800 dark:text-slate-200 transition-colors [&_.rbc-btn-group_button]:dark:text-slate-300 [&_.rbc-toolbar-label]:dark:text-white [&_.rbc-header]:dark:border-slate-700 [&_.rbc-month-view]:dark:border-slate-700 [&_.rbc-day-bg]:dark:border-slate-700 [&_.rbc-month-row]:dark:border-slate-700 [&_.rbc-time-view]:dark:border-slate-700 [&_.rbc-time-header-content]:dark:border-slate-700 [&_.rbc-timeslot-group]:dark:border-slate-700 [&_.rbc-time-content]:dark:border-slate-700 [&_.rbc-off-range-bg]:dark:bg-slate-900/40 [&_.rbc-today]:dark:bg-slate-700/50 [&_.rbc-btn-group_button.rbc-active]:dark:bg-slate-700 [&_.rbc-btn-group_button.rbc-active]:dark:text-white [&_.rbc-btn-group_button:hover]:dark:bg-slate-700/50">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            culture="vi"
            style={{ height: '75vh' }}
            date={currentDate}
            onNavigate={(newDate) => setCurrentDate(newDate)}
            view={currentView}
            onView={(newView) => setCurrentView(newView)}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            messages={{
              next: "Tiếp",
              previous: "Trước",
              today: "Hôm nay",
              month: "Tháng",
              week: "Tuần",
              day: "Ngày",
              agenda: "Lịch trình",
              date: "Ngày",
              time: "Thời gian",
              event: "Sự kiện",
              noEventsInRange: "Không có công việc nào trong khoảng thời gian này.",
              showMore: total => `+ Xem thêm (${total})`
            }}
            popup // Hiển thị popup nếu có nhiều sự kiện trong cùng 1 ngày
          />
        </div>
      </div>

      {/* MODAL SỬA TASK */}
      {isModalOpen && (
        <AddTaskModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onTaskAdded={fetchTasks} 
          taskToEdit={taskToEdit} 
        />
      )}
    </div>
  );
};

export default CalendarView;
