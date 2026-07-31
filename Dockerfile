# Multi-stage build for the Spring Boot backend
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd -m -u 10001 ebcs
COPY --from=build /workspace/target/ebcs-backend-*.jar app.jar
RUN mkdir -p /var/ebcs-docs && chown -R ebcs:ebcs /app /var/ebcs-docs
USER ebcs
ENV SERVER_PORT=8080
ENV DOC_STORAGE_PATH=/var/ebcs-docs
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=45s --retries=5 \
  CMD wget -q -O - http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
