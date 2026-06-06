# Stage 1: Biên dịch mã nguồn ReactJS
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Cấu hình Web Server Nginx để phục vụ file tĩnh
FROM nginx:alpine
# Xóa cấu hình mặc định của Nginx
RUN rm /etc/nginx/conf.d/default.conf
# Copy file cấu hình custom
COPY nginx.conf /etc/nginx/conf.d/

# Copy thư mục build từ Stage 1 (Vite mặc định build ra thư mục 'dist')
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]