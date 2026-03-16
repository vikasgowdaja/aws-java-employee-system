FROM maven:3.9.8-eclipse-temurin-21 AS builder
WORKDIR /app

COPY server/pom.xml ./
COPY server/src ./src
RUN mvn -B -DskipTests clean package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
