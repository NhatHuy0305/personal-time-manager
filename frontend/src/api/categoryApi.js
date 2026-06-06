import api from './axios';

// Lấy danh sách danh mục của user hiện tại
export const getCategories = () => api.get('/categories');

// Tạo danh mục mới { name, colorCode }
export const createCategory = (categoryData) => api.post('/categories', categoryData);

// Cập nhật danh mục { name, colorCode }
export const updateCategory = (id, categoryData) => api.put(`/categories/${id}`, categoryData);

// Xóa danh mục
export const deleteCategory = (id) => api.delete(`/categories/${id}`);