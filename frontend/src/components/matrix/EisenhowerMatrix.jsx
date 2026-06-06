import React, { useEffect, useState } from 'react';
import { taskApi } from '../../api/taskApi';

const EisenhowerMatrix = () => {
    const [matrix, setMatrix] = useState({
        doFirst: [],
        schedule: [],
        delegate: [],
        eliminate: []
    });
    const [loading, setLoading] = useState(true);

    // 👇 1. THÊM STATE ĐỂ QUẢN LÝ RIÊNG BÀN PHÍM CHO 4 Ô INPUT
    const [inputValues, setInputValues] = useState({
        DO_FIRST: '',
        SCHEDULE: '',
        DELEGATE: '',
        ELIMINATE: ''
    });

    useEffect(() => {
        fetchMatrixData();
    }, []);

    const fetchMatrixData = async () => {
        try {
            setLoading(true);
            const response = await taskApi.getEisenhowerMatrix();
            setMatrix(response.data);
        } catch (error) {
            console.error("Lỗi khi tải ma trận Eisenhower:", error);
        } finally {
            setLoading(false);
        }
    };

    const getFutureDate = (daysToAdd) => {
        const date = new Date();
        date.setDate(date.getDate() + daysToAdd);
        return date.toISOString();
    };

    // 👇 2. HÀM CẬP NHẬT CHỮ LÊN MÀN HÌNH KHI BẠN GÕ
    const handleInputChange = (e, matrixType) => {
        setInputValues(prev => ({
            ...prev,
            [matrixType]: e.target.value
        }));
    };

    const handleQuickAdd = async (e, matrixType) => {
        if (e.key === 'Enter') {
            // Lấy nội dung trực tiếp từ state thay vì thuộc tính của e
            const title = inputValues[matrixType].trim();

            if (title !== '') {
                let priority = 1;
                let dueDate = null;

                switch (matrixType) {
                    case 'DO_FIRST': priority = 4; dueDate = getFutureDate(1); break;
                    case 'SCHEDULE': priority = 3; dueDate = getFutureDate(7); break;
                    case 'DELEGATE': priority = 2; dueDate = getFutureDate(1); break;
                    case 'ELIMINATE': priority = 1; dueDate = null; break;
                    default: break;
                }

                try {
                    await taskApi.createTask({
                        title: title,
                        priority: priority,
                        dueDate: dueDate
                    });
                    
                    // 👇 3. XÓA CHỮ TRONG Ô SAU KHI TẠO THÀNH CÔNG
                    setInputValues(prev => ({ ...prev, [matrixType]: '' }));
                    fetchMatrixData(); 
                    
                } catch (error) {
                    console.error("❌ Lỗi khi gọi API createTask:", error);
                    alert("Không thể tạo task, hãy xem tab Console/Network!");
                }
            }
        }
    };

    const renderQuadrant = (title, tasks, bgHeaderColor, borderClass, matrixType) => (
        <div className={`flex flex-col border-2 rounded-xl overflow-hidden shadow-sm ${borderClass} bg-white h-full min-h-[300px]`}>
            <div className={`px-4 py-3 font-bold text-gray-800 ${bgHeaderColor}`}>
                {title} <span className="text-sm font-normal text-gray-600">({tasks.length})</span>
            </div>
            
            <div className="p-3 flex-1 overflow-y-auto">
                <ul className="space-y-2">
                    {tasks.map(task => (
                        <li key={task.id} className="p-3 border rounded-lg hover:shadow-md bg-gray-50 border-gray-200 flex items-center gap-2">
                            <input type="checkbox" className="w-4 h-4 rounded text-blue-600" />
                            <div>
                                <div className="font-semibold text-gray-800 text-sm">{task.title}</div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* 👇 4. CẬP NHẬT THẺ INPUT: Bắt buộc có value, onChange và fix CSS nổi lên trên (z-10) 👇 */}
            <div className="p-3 border-t bg-gray-50 relative z-10">
                <input 
                    type="text" 
                    placeholder="+ Thêm nhanh (Gõ & Enter)" 
                    value={inputValues[matrixType]} 
                    onChange={(e) => handleInputChange(e, matrixType)}
                    onKeyDown={(e) => handleQuickAdd(e, matrixType)}
                    className="w-full text-sm text-gray-900 bg-white border border-dashed border-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all cursor-text"
                />
            </div>
        </div>
    );

    if (loading) return <div className="text-center py-10 font-medium text-gray-500">Đang tải ma trận...</div>;

    return (
        <div className="p-4 bg-gray-50 rounded-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Ma Trận Eisenhower</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderQuadrant("1. KHẨN CẤP & QUAN TRỌNG", matrix.doFirst, "bg-red-50 border-t-4 border-red-500", "border-gray-200", "DO_FIRST")}
                {renderQuadrant("2. KHÔNG KHẨN CẤP NHƯNG QUAN TRỌNG", matrix.schedule, "bg-blue-50 border-t-4 border-blue-500", "border-gray-200", "SCHEDULE")}
                {renderQuadrant("3. KHẨN CẤP NHƯNG KHÔNG QUAN TRỌNG", matrix.delegate, "bg-yellow-50 border-t-4 border-yellow-500", "border-gray-200", "DELEGATE")}
                {renderQuadrant("4. KHÔNG KHẨN CẤP & KHÔNG QUAN TRỌNG", matrix.eliminate, "bg-gray-50 border-t-4 border-gray-500", "border-gray-200", "ELIMINATE")}
            </div>
        </div>
    );
};

export default EisenhowerMatrix;