# 🚀 CoFoundly API

![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![NestJS](https://img.shields.io/badge/NestJS-v11-red)

Backend-репозиторий для сервиса **CoFoundly**, разработанный с использованием современного стека на **NestJS**

Production-версия доступна по адресу https://cofoundly-api.infinitum.su

Frontend-репозиторий проекта располагается на https://github.com/Ximeo-dev/CoFoundlyWebsite.git

## 🧰 Стек технологий

- **NestJS 11** — модульный и масштабируемый Node.js-фреймворк
- **Prisma** — ORM для PostgreSQL
- **JWT & Passport** — авторизация и аутентификация
- **Argon2** — хеширование паролей
- **Redis (ioredis)** — кеширование и хранение временных данных
- **AWS S3 (SDK v3)** — хранение изображений
- **Multer + Sharp** — загрузка и обработка изображений
- **Nodemailer + Handlebars** — email-уведомления
- **Telegram (grammY + @grammyjs/nestjs)** — интеграция Telegram-бота
- **Socket.IO (WebSocket)** — real-time взаимодействие
- **Swagger** — документация API
- **GitHub Actions** — CI/CD: автодеплой на сервер
- **Docker + Docker Compose** — контейнеризация и локальная разработка
- **PM2** — процесс-менеджер для продакшн-сервера
- **Nginx** — прокси-сервер и SSL

## 📁 Структура проекта

```bash
src/
├── auth/           # JWT Авторизация, Guards, стратегии
├── config/         # Конфигурация окружения
├── constants/      # Глобальные константы
├── entities/       # Модуль для работы с некоторыми сущностями
├── exceptions/     # Кастомные исключения
├── images/         # Загрузка и обработка изображений
├── mail/           # Email-сервис
├── middlewares/    # Кастомные middleware
├── pipes/          # Валидация и преобразование
├── prisma/         # ORM и работа с БД
├── profile/        # Работа с профилем пользователя и проектами
├── redis/          # Redis-интеграция
├── s3/             # Работа с S3 storage
├── security/       # Безопасность, 2FA
├── swipe/          # Механика свайпов
├── telegram/       # Telegram-бот и обработка сообщений
├── user/           # Пользовательская логика
├── utils/          # Утилиты и вспомогательные функции
├── ws/             # Модуль с WebSocket-шлюзами
├── app.controller.ts
├── app.module.ts
└── main.ts
```

## 🛠️ Структура проекта

```bash
# Клонируем репозиторий
git clone https://github.com/Ximeo-dev/CoFoundlyBackend.git
cd CoFoundlyBackend

# Установка зависимостей
npm install

# Настройка окружения
cp .env.example .env
cp .env.example .dev.env

# Генерация Prisma клиента
npx prisma generate

# Миграции
npx prisma migrate dev

# Запуск проекта
npm run start:dev
```

## 📄 Документация
Swagger-документация доступна по адресу: https://cofoundly-api.infinitum.su/docs

Или http://localhost:3000/docs для приложения, запущенного локально

## 🧪 Тестирование
Используется Jest для юнит тестирования
```bash
npm run test
```
