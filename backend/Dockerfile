# Stage 1: Build ứng dụng bằng Maven
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
# Copy file pom và tải các thư viện trước (giúp cache layer tốt hơn)
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy toàn bộ source code và build
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Chạy ứng dụng với JRE tinh gọn
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
# Lấy file .jar đã build từ Stage 1
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]