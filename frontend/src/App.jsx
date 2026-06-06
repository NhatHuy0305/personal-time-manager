import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MainLayout from './components/MainLayout'; // Import Layout chứa Sidebar
import Dashboard from './pages/Dashboard';     // Import Dashboard thật
import TaskList from './pages/TaskList';        // Import TaskList chuẩn
import CalendarView from './pages/CalendarView'; // Import CalendarView
import HabitTracker from './pages/HabitTracker'; // Import HabitTracker
import PomodoroPage from './pages/PomodoroPage'; // Import PomodoroPage
import ReportPage from './pages/ReportPage';     // Import ReportPage

function App() {
  // Hàm bảo vệ: Nếu chưa có token thì đá về trang Login
  const ProtectedRoute = ({ children }) => {
    const isAuthenticated = !!localStorage.getItem('token');
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <Routes>
        {/* Trang Login tách biệt, không chứa Sidebar */}
        <Route path="/login" element={<Login />} />

        {/* Tất cả các trang bên trong route này sẽ có Sidebar nhờ MainLayout */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Khi vào "/" sẽ tự điều hướng vào "/dashboard" */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* Các trang con render tại vị trí <Outlet /> trong MainLayout */}
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* ĐÃ CHUYỂN ROUTE TASKS VÀO ĐÂY: Sẽ có Sidebar và được bảo vệ bởi Token */}
          <Route path="tasks" element={<TaskList />} />
          
          {/* Lịch trình */}
          <Route path="calendar" element={<CalendarView />} />
          
          {/* Các trang khác */}
          <Route path="habits" element={<HabitTracker />} />
          <Route path="pomodoro" element={<PomodoroPage />} />
          <Route path="reports" element={<ReportPage />} />
        </Route>

        {/* Redirect nếu vào link lạ (Bắt buộc phải để ở ĐƯỜNG CÙNG của danh sách Routes) */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;