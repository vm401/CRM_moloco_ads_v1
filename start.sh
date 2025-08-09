#!/bin/bash

echo "🚀 Запуск Moloco CRM v1..."

# Остановка старых процессов
echo "🛑 Остановка старых процессов..."
pkill -f "vite\|uvicorn" 2>/dev/null || true

# Запуск backend
echo "🔧 Запуск бекенда на порту 8000..."
cd backend
source moloco_env/bin/activate
nohup python -m uvicorn fastapi_main:app --host 0.0.0.0 --port 8000 --reload > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Бекенд запущен (PID: $BACKEND_PID)"

# Проверка backend
sleep 3
if curl -s http://localhost:8000/reports > /dev/null; then
    echo "✅ Бекенд работает: http://localhost:8000"
else
    echo "❌ Бекенд не отвечает"
    exit 1
fi

# Запуск frontend
echo "🌐 Запуск фронтенда на порту 8081..."
cd ..
nohup npm run dev -- --port 8081 --host > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Фронтенд запущен (PID: $FRONTEND_PID)"

# Проверка frontend
sleep 5
if curl -s http://localhost:8081/ > /dev/null; then
    echo "✅ Фронтенд работает: http://localhost:8081"
else
    echo "❌ Фронтенд не отвечает"
    exit 1
fi

echo ""
echo "🎉 Moloco CRM v1 запущен!"
echo "🌐 Фронтенд: http://localhost:8081"
echo "🔧 Бекенд: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Для остановки: pkill -f 'vite\|uvicorn'"
echo ""

# Показываем процессы
echo "📊 Запущенные процессы:"
ps aux | grep -E "(vite|uvicorn)" | grep -v grep
