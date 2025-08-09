# Moloco Ads Reporting CRM v1.0

Полнофункциональная CRM система для анализа рекламных кампаний Moloco.

## 🚀 Быстрый запуск

```bash
# Запуск проекта
./start.sh

# Остановка
pkill -f 'vite|uvicorn'
```

## 🌐 Доступ

- **Frontend**: http://localhost:8081
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📁 Структура проекта

```
moloco-crm-v1/
├── src/                    # React frontend
│   ├── components/         # UI компоненты
│   ├── pages/             # Страницы приложения
│   └── layouts/           # Макеты
├── backend/               # FastAPI backend
│   ├── fastapi_main.py    # Основное API
│   ├── moloco_processor.py # Обработка данных
│   └── uploads/           # Загруженные файлы
└── start.sh              # Скрипт запуска
```

## ⚡ Возможности

- 📊 **Dashboard** - Реальная аналитика и метрики
- 📱 **App Inventory** - Управление приложениями
- 📤 **Upload Data** - Загрузка CSV файлов
- 🎯 **Campaigns** - Управление кампаниями
- 🎨 **Creatives** - Креативы и материалы
- 🔄 **Exchanges** - Биржи трафика

## 🛠 Технологии

**Frontend:**
- React 18 + TypeScript
- Vite (сборщик)
- Tailwind CSS + ShadCN UI
- React Router
- TanStack Query

**Backend:**
- FastAPI + Python
- SQLite база данных
- Pandas для анализа данных
- Uvicorn сервер

## 📝 Разработка

```bash
# Установка зависимостей frontend
npm install

# Установка зависимостей backend
cd backend
source moloco_env/bin/activate
pip install -r requirements.txt

# Запуск в dev режиме
npm run dev              # Frontend на :8081
python -m uvicorn fastapi_main:app --reload  # Backend на :8000
```

---

*Создано для эффективного анализа рекламных кампаний Moloco* 🎯