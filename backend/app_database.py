import json
import os
from typing import Dict, List, Optional

class AppDatabase:
    def __init__(self):
        self.db_file = "app_database.json"
        self.apps = self.load_database()
        
    def load_database(self) -> Dict:
        """Загружает базу данных приложений"""
        if os.path.exists(self.db_file):
            try:
                with open(self.db_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                return self.get_default_apps()
        return self.get_default_apps()
    
    def save_database(self):
        """Сохраняет базу данных"""
        with open(self.db_file, 'w', encoding='utf-8') as f:
            json.dump(self.apps, f, ensure_ascii=False, indent=2)
    
    def get_default_apps(self) -> Dict:
        """Возвращает стандартную базу приложений"""
        return {
            "997700435": {
                "name": "Bubble Pop - Shoot Bubbles",
                "category": "Puzzle Games",
                "subcategory": "Bubble Shooter",
                "platform": "iOS",
                "rating": 4.2,
                "downloads": "1M+",
                "price": "Free",
                "developer": "Pop Games Studio",
                "description": "Classic bubble shooter game with colorful graphics",
                "tags": ["puzzle", "bubble", "casual", "family"]
            },
            "997362197": {
                "name": "InShot - Video Editor",
                "category": "Productivity",
                "subcategory": "Video Editing",
                "platform": "iOS",
                "rating": 4.5,
                "downloads": "10M+",
                "price": "Free",
                "developer": "InShot Inc.",
                "description": "Professional video editor with filters and effects",
                "tags": ["video", "editing", "social media", "filters"]
            },
            "993090598": {
                "name": "Ludo King",
                "category": "Board Games",
                "subcategory": "Classic Board",
                "platform": "iOS",
                "rating": 4.1,
                "downloads": "50M+",
                "price": "Free",
                "developer": "Gametion Technologies",
                "description": "Classic Ludo board game with multiplayer",
                "tags": ["board", "multiplayer", "classic", "family"]
            },
            "Wt0m9nSXAGYByPqs": {
                "name": "Road Gold",
                "category": "Racing Games",
                "subcategory": "Arcade Racing",
                "platform": "Android",
                "rating": 4.3,
                "downloads": "5M+",
                "price": "Free",
                "developer": "Racing Studio",
                "description": "High-speed racing with gold collection",
                "tags": ["racing", "arcade", "speed", "gold"]
            }
        }
    
    def get_app_info(self, app_id: str) -> Optional[Dict]:
        """Получает информацию о приложении по ID"""
        return self.apps.get(app_id)
    
    def get_apps_by_category(self, category: str) -> List[Dict]:
        """Получает все приложения по категории"""
        return [
            {"id": app_id, **app_data}
            for app_id, app_data in self.apps.items()
            if app_data.get("category") == category
        ]
    
    def get_all_categories(self) -> List[str]:
        """Получает все уникальные категории"""
        return list(set(app.get("category") for app in self.apps.values()))
    
    def search_apps(self, query: str) -> List[Dict]:
        """Поиск приложений по названию или описанию"""
        results = []
        query_lower = query.lower()
        
        for app_id, app_data in self.apps.items():
            if (query_lower in app_data.get("name", "").lower() or
                query_lower in app_data.get("description", "").lower() or
                query_lower in " ".join(app_data.get("tags", [])).lower()):
                results.append({"id": app_id, **app_data})
        
        return results
    
    def add_app(self, app_id: str, app_data: Dict):
        """Добавляет новое приложение в базу"""
        self.apps[app_id] = app_data
        self.save_database()
    
    def update_app(self, app_id: str, app_data: Dict):
        """Обновляет информацию о приложении"""
        if app_id in self.apps:
            self.apps[app_id].update(app_data)
            self.save_database()
    
    def get_app_statistics(self) -> Dict:
        """Получает статистику по приложениям"""
        categories = {}
        platforms = {}
        
        for app_data in self.apps.values():
            category = app_data.get("category", "Unknown")
            platform = app_data.get("platform", "Unknown")
            
            categories[category] = categories.get(category, 0) + 1
            platforms[platform] = platforms.get(platform, 0) + 1
        
        return {
            "total_apps": len(self.apps),
            "categories": categories,
            "platforms": platforms
        }

# Глобальный экземпляр базы данных
app_db = AppDatabase() 