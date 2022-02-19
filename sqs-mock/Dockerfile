# Reference: https://github.com/s12v/elasticmq-docker/blob/master/Dockerfile

# FROM openjdk:8-jre-alpine
FROM arm64v8/openjdk:8-jre-alpine

ARG VERSION=0.15.8

EXPOSE 9324
EXPOSE 9325

ADD https://s3-eu-west-1.amazonaws.com/softwaremill-public/elasticmq-server-${VERSION}.jar /elasticmq-server.jar

COPY elasticmq.conf /etc/elasticmq/elasticmq.conf

VOLUME /etc/elasticmq

CMD ["java", "-Djava.net.preferIPv4Stack=true", "-Dconfig.file=/etc/elasticmq/elasticmq.conf", "-jar", "/elasticmq-server.jar"]