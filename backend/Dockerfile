# ─── Build stage ───
FROM golang:1.25-alpine AS builder

WORKDIR /app
RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o bin/api ./cmd/api

# ─── Dev stage (with air for live reload) ───
FROM golang:1.25-alpine AS dev

WORKDIR /app
RUN go install github.com/air-verse/air@latest
RUN go install github.com/pressly/goose/v3/cmd/goose@latest

COPY go.mod go.sum ./
RUN go mod download

CMD ["air"]

# ─── Production stage ───
FROM alpine:3.19 AS production

RUN apk --no-cache add ca-certificates
WORKDIR /app

COPY --from=builder /app/bin/api .
EXPOSE 8080

CMD ["./api"]