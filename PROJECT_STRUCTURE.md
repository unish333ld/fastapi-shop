# Project structure

Проект разделён на два приложения:

```text
project/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy-модели
│   │   ├── schemas/         # Pydantic-схемы API
│   │   ├── repositories/    # Доступ к данным
│   │   ├── services/        # Бизнес-логика
│   │   ├── routes/          # HTTP-эндпоинты
│   │   ├── auth.py          # AuthX-конфигурация и роли
│   │   ├── config.py        # Настройки приложения
│   │   ├── database.py      # Подключение и инициализация БД
│   │   └── main.py          # Точка входа FastAPI
│   ├── run.py               # Запуск backend
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/             # Корневое приложение и провайдеры
│   │   ├── features/        # Функциональные модули предметной области
│   │   │   └── auth/        # Авторизация, AuthPanel и useAuth
│   │   ├── shared/          # Общие настройки и переиспользуемый код
│   │   │   └── config/      # API-конфигурация
│   │   ├── assets/           # Изображения и локальные ресурсы
│   │   ├── index.css         # Глобальные стили
│   │   └── main.tsx          # Точка входа React
│   ├── public/              # Публичные статические файлы
│   └── package.json
└── PROJECT_STRUCTURE.md
```

## Правила размещения

- Новая backend-фича проходит через `routes → services → repositories` и использует схемы из `schemas`.
- Новая frontend-фича получает отдельную папку в `src/features`.
- Общие компоненты и утилиты не помещаются в feature-папку; для них используются `src/shared` или отдельные общие каталоги.
- `app` содержит только сборку приложения, провайдеры и глобальную конфигурацию.
- `venv`, `node_modules`, `dist`, `__pycache__` и другие сгенерированные каталоги не являются исходниками проекта.
