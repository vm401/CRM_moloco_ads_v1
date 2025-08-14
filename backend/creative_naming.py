"""
Universal Creative Naming System (Система шифрования названий креативов)
Универсальная система для двустороннего шифрования названий креативов

Format: geo_slot_approach_comment_number

Features:
1. Internal "clean" naming (for us) - максимально информативный
2. External masked naming (for partners) - чтобы не спалили единую систему
3. Universal decoding - works with both clean codes and files with .mp4 extension
"""

import base64
import hashlib
import random
import string
import re
from typing import Dict, List, Tuple, Optional, Any
import json
import os
from datetime import datetime

class CreativeNamingSystem:
    """Универсальная система шифрования названий креативов"""
    
    def __init__(self, save_to_file=True):
        self.save_to_file = save_to_file
        self.dict_file = "dict.json"
        self.history_file = "naming_history.json"
        
        # Словарь для двустороннего шифрования
        self.cipher_dict = {
            # Geographic codes (GEO)
            'BD': 'q4', 'GR': 'ns', 'US': 'e5', 'BR': 'x7', 'IN': 'w9', 'UK': 'm2',
            'DE': 'k8', 'FR': 'j6', 'IT': 'h3', 'ES': 'g1', 'CA': 'f4', 'AU': 'd2',
            'JP': 'c7', 'KR': 'b9', 'TH': 'a1', 'VN': 'z5', 'PH': 'y8', 'ID': 'x3',
            'MY': 'w6', 'SG': 'v9', 'TW': 'u2', 'HK': 't5', 'MX': 's8', 'CO': 'r1',
            
            # Slot/Game types (SLOT)
            'plinko': 'mn', 'chicken': 'lp', 'slots': '7V', 'poker': 'kj', 'crash': 'hg',
            'blackjack': 'fd', 'roulette': 'sa', 'baccarat': 'qw', 'mines': 'er', 'wheel': 'ty',
            'aviator': 'ui', 'keno': 'op', 'limbo': 'as', 'dice': 'df', 'hilo': 'gh',
            'towers': 'jk', 'stairs': 'zx', 'balloon': 'cv', 'goal': 'bn', 'scratch': 'nm',
            
            # Approaches (APPROACH)
            'timer': '08', 'couple': 'lu', 'prank': 'd9', 'fake': 'c8', 'review': 'b7',
            'tutorial': 'a6', 'reaction': '95', 'unboxing': '84', 'challenge': '73',
            'lifestyle': '62', 'travel': '51', 'cooking': '40', 'gym': '39', 'car': '28',
            'adapt': '4c', 'native': '3b', 'banner': '2a', 'video': '19', 'carousel': '08',
            
            # Comments (COMMENT) 
            'nekittopchik': '3', 'topchik': '4', 'bomb': '5', 'fire': '6', 'mega': '7',
            'super': '8', 'ultra': '9', 'best': '1', 'new': '2', 'hot': '0',
            'cool': 'a', 'nice': 'b', 'good': 'c', 'great': 'd', 'awesome': 'e',
            'perfect': 'f', 'amazing': 'g', 'fantastic': 'h', 'incredible': 'i', 'wonderful': 'j',
            
            # Numbers (NUMBER)
            '1': '1', '2': '2', '3': '3', '4': '4', '5': '5',
            '6': '6', '7': '7', '8': '8', '9': '9', '0': '0'
        }
        
        # Создаем обратный словарь для расшифровки
        self.reverse_cipher_dict = {v: k for k, v in self.cipher_dict.items()}
        
        # Словарь соответствий: короткий код -> оригинальное название
        self.code_to_name = {}
        
        # Стили маскировки для разных платформ
        self.masking_styles = {
            1: 'iphone',    # iPhone style: lowercase + numbers
            2: 'blogger',   # Blogger style: mix case + numbers  
            3: 'random'     # Random style: random chars
        }
        
        # Расширения файлов, которые нужно игнорировать при расшифровке
        self.ignore_extensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.jpg', '.png', '.gif']
        
        # История шифрования/расшифровки для сохранения
        self.naming_history = []
        
        # Загружаем существующие данные
        if self.save_to_file:
            self._load_from_files()

    def _generate_internal_key(self, original_name: str) -> str:
        """Генерирует внутренний ключ (длинный) для нас"""
        # Создаем хеш от оригинального названия
        hash_obj = hashlib.sha256(original_name.encode('utf-8'))
        hash_hex = hash_obj.hexdigest()
        
        # Берем первые 30 символов и делаем mix case
        internal_key = ''
        for i, char in enumerate(hash_hex[:30]):
            if i % 2 == 0:
                internal_key += char.upper()
            else:
                internal_key += char.lower()
        
        return internal_key

    def _apply_masking_style(self, coded_name: str, style: int) -> str:
        """Применяет стиль маскировки к закодированному названию"""
        if style == 1:  # iPhone style
            return coded_name.lower()
        elif style == 2:  # Blogger style  
            result = ''
            for i, char in enumerate(coded_name):
                if i % 3 == 0:
                    result += char.upper()
                else:
                    result += char.lower()
            return result
        elif style == 3:  # Random style
            result = ''
            for char in coded_name:
                if random.choice([True, False]):
                    result += char.upper()
                else:
                    result += char.lower()
            return result
        else:
            return coded_name

    def encode_creative_name(self, name: str, masking_style: int = 1) -> Dict[str, str]:
        """
        Шифрует название креатива
        
        Args:
            name: Название в формате geo_slot_approach_comment_number
            masking_style: 1=iphone, 2=blogger, 3=random
            
        Returns:
            Dict с внешним (для партнеров) и внутренним (для нас) кодами
        """
        try:
            # Парсим название по формату geo_slot_approach_comment_number
            parts = name.lower().split('_')
            if len(parts) < 3:
                raise ValueError(f"Неверный формат названия: {name}. Ожидается: geo_slot_approach_comment_number")
            
            geo = parts[0]
            slot = parts[1] 
            approach = parts[2] if len(parts) > 2 else ''
            comment = parts[3] if len(parts) > 3 else ''
            number = parts[4] if len(parts) > 4 else '1'
            
            # Шифруем каждую часть
            coded_parts = []
            
            # GEO
            if geo in self.cipher_dict:
                coded_parts.append(self.cipher_dict[geo])
            else:
                # Автоматически создаем новый код для неизвестного гео
                new_geo_code = self._generate_new_code(geo, 2)
                self.add_cipher_mapping(geo, new_geo_code)
                coded_parts.append(new_geo_code)
                print(f"🆕 Создан новый код для GEO '{geo}' -> '{new_geo_code}'")
            
            # SLOT  
            if slot in self.cipher_dict:
                coded_parts.append(self.cipher_dict[slot])
            else:
                # Автоматически создаем новый код для неизвестного слота
                new_slot_code = self._generate_new_code(slot, 2)
                self.add_cipher_mapping(slot, new_slot_code)
                coded_parts.append(new_slot_code)
                print(f"🆕 Создан новый код для SLOT '{slot}' -> '{new_slot_code}'")
            
            # APPROACH
            if approach and approach in self.cipher_dict:
                coded_parts.append(self.cipher_dict[approach])
            elif approach:
                new_approach_code = self._generate_new_code(approach, 2)
                self.add_cipher_mapping(approach, new_approach_code)
                coded_parts.append(new_approach_code)
                print(f"🆕 Создан новый код для APPROACH '{approach}' -> '{new_approach_code}'")
            
            # COMMENT
            if comment and comment in self.cipher_dict:
                coded_parts.append(self.cipher_dict[comment])
            elif comment:
                new_comment_code = self._generate_new_code(comment, 1)
                self.add_cipher_mapping(comment, new_comment_code)
                coded_parts.append(new_comment_code)
                print(f"🆕 Создан новый код для COMMENT '{comment}' -> '{new_comment_code}'")
                
            # NUMBER
            if number in self.cipher_dict:
                coded_parts.append(self.cipher_dict[number])
            else:
                coded_parts.append(number[:1])  # Числа оставляем как есть
            
            # Создаем внешний код (короткий, для партнеров)
            external_code = ''.join(coded_parts)
            external_code = self._apply_masking_style(external_code, masking_style)
            
            # Создаем внутренний код (длинный, для нас)
            internal_code = self._generate_internal_key(name)
            
            result = {
                'external': external_code,
                'internal': internal_code,
                'original': name,
                'style': masking_style
            }
            
            # Создаем соответствие для расшифровки (сохраняем связь короткий код -> оригинал)
            self._save_code_mapping(external_code, name)
            
            # Сохраняем в историю (БЕЗ показа длинного кода)
            self._add_to_history('encode', name, external_code, True)
            
            return result
            
        except Exception as e:
            result = {
                'error': f'Ошибка шифрования: {str(e)}',
                'original': name
            }
            # Сохраняем ошибку в историю
            self._add_to_history('encode', name, f"ERROR: {str(e)}", False)
            return result

    def _remove_file_extension(self, code: str) -> str:
        """Удаляет расширение файла из кода"""
        code_clean = code
        for ext in self.ignore_extensions:
            if code_clean.lower().endswith(ext.lower()):
                code_clean = code_clean[:-len(ext)]
                print(f"🔧 Removed extension {ext} from {code} -> {code_clean}")
                break
        return code_clean

    def decode_creative_name(self, code: str) -> Dict[str, Any]:
        """
        Расшифровывает код креатива (универсально - с .mp4 и без)
        
        Args:
            code: Зашифрованный код (может содержать .mp4 или другое расширение)
            
        Returns:
            Dict с расшифрованным названием или ошибкой
        """
        try:
            # УНИВЕРСАЛЬНАЯ ОБРАБОТКА: убираем расширение файла если есть
            clean_code = self._remove_file_extension(code)
            print(f"🔍 Decoding: {code} -> clean: {clean_code}")
            
            # Пробуем расшифровать как внутренний код (длинный)
            internal_result = self._decode_internal_code(clean_code)
            if internal_result['success']:
                self._add_to_history('decode', code, internal_result['decoded_name'], True)
                return internal_result
            
            # Пробуем расшифровать как внешний код (короткий)
            external_result = self._decode_external_code(clean_code)
            if external_result['success']:
                self._add_to_history('decode', code, external_result['decoded_name'], True)
                return external_result
            
            # Если не получилось расшифровать
            result = {
                'success': False,
                'error': f'Unknown code format: {clean_code}',
                'original_input': code,
                'clean_code': clean_code,
                'decoded_name': None
            }
            self._add_to_history('decode', code, f"ERROR: {result['error']}", False)
            return result
            
        except Exception as e:
            result = {
                'success': False,
                'error': f'Ошибка расшифровки: {str(e)}',
                'original_input': code
            }
            self._add_to_history('decode', code, f"EXCEPTION: {str(e)}", False)
            return result

    def _decode_internal_code(self, code: str) -> Dict[str, Any]:
        """Пытается расшифровать как внутренний (длинный) код"""
        # Внутренние коды имеют длину 30 символов и содержат микс регистров
        if len(code) == 30 and any(c.isupper() for c in code) and any(c.islower() for c in code):
            # Это внутренний код - нужно найти соответствующее оригинальное название
            # Для демонстрации возвращаем успешный результат
            # В реальной системе здесь была бы база данных соответствий
            return {
                'success': True,
                'decoded_name': '[INTERNAL_CODE_MATCHED]',
                'type': 'internal',
                'code': code
            }
        
        return {'success': False}

    def _decode_external_code(self, code: str) -> Dict[str, Any]:
        """Пытается расшифровать как внешний (короткий) код"""
        try:
            # ПРИОРИТЕТ 1: Проверяем сохраненные соответствия (точное совпадение)
            if code.lower() in self.code_to_name:
                original_name = self.code_to_name[code.lower()]
                return {
                    'success': True,
                    'decoded_name': original_name,
                    'type': 'external_saved',
                    'code': code,
                    'method': 'direct_mapping'
                }
            
            # ПРИОРИТЕТ 2: Разбор по частям если нет точного соответствия
            # Внешние коды короткие (обычно 6-12 символов)
            if len(code) > 15:
                return {'success': False}
            
            # Нормализуем код (приводим к нижнему регистру для поиска)
            normalized_code = code.lower()
            
            # Пытаемся разобрать код по частям
            decoded_parts = []
            remaining_code = normalized_code
            
            print(f"🔧 Trying to decode external code: {remaining_code}")
            
            # Ищем совпадения в обратном словаре
            found_parts = []
            i = 0
            while i < len(remaining_code) and len(found_parts) < 5:
                # Пробуем найти части разной длины (от 3 до 1 символа)
                found = False
                for length in [3, 2, 1]:
                    if i + length <= len(remaining_code):
                        part = remaining_code[i:i+length]
                        if part in self.reverse_cipher_dict:
                            found_parts.append(self.reverse_cipher_dict[part])
                            print(f"✅ Found part: {part} -> {self.reverse_cipher_dict[part]}")
                            i += length
                            found = True
                            break
                
                if not found:
                    # Если не нашли, помечаем как неизвестную часть
                    unknown_part = remaining_code[i:i+2] if i+2 <= len(remaining_code) else remaining_code[i:]
                    found_parts.append(f'[UNKNOWN:{unknown_part}]')
                    print(f"❌ Unknown part: {unknown_part}")
                    i += len(unknown_part)
            
            if found_parts:
                # Формируем расшифрованное название
                decoded_name = '_'.join(found_parts)
                return {
                    'success': True,
                    'decoded_name': decoded_name,
                    'type': 'external',
                    'code': code,
                    'parts_found': len([p for p in found_parts if not p.startswith('[UNKNOWN')])
                }
            
            return {'success': False}
            
        except Exception as e:
            print(f"❌ Error in external decode: {e}")
            return {'success': False}

    def batch_encode(self, names: List[str], masking_style: int = 1) -> List[Dict[str, str]]:
        """Шифрует список названий"""
        results = []
        for name in names:
            result = self.encode_creative_name(name, masking_style)
            results.append(result)
        return results

    def batch_decode(self, codes: List[str]) -> List[Dict[str, Any]]:
        """Расшифровывает список кодов"""
        results = []
        for code in codes:
            result = self.decode_creative_name(code)
            results.append(result)
        return results

    def get_cipher_dictionary(self) -> Dict[str, str]:
        """Возвращает словарь шифрования для просмотра"""
        return self.cipher_dict.copy()

    def add_cipher_mapping(self, original: str, cipher: str) -> bool:
        """Добавляет новую пару шифрование-расшифровка"""
        try:
            self.cipher_dict[original.lower()] = cipher.lower()
            self.reverse_cipher_dict[cipher.lower()] = original.lower()
            if self.save_to_file:
                self._save_dict_to_file()
            return True
        except:
            return False

    def _load_from_files(self):
        """Загружает данные из JSON файлов"""
        try:
            # Загружаем словарь шифрования
            if os.path.exists(self.dict_file):
                with open(self.dict_file, 'r', encoding='utf-8') as f:
                    saved_dict = json.load(f)
                    # Обновляем только новые записи, не перезаписываем базовые
                    for key, value in saved_dict.items():
                        if key not in self.cipher_dict:
                            self.cipher_dict[key] = value
                            self.reverse_cipher_dict[value] = key
                print(f"📚 Загружен словарь из {self.dict_file}")
            
            # Загружаем историю
            if os.path.exists(self.history_file):
                with open(self.history_file, 'r', encoding='utf-8') as f:
                    self.naming_history = json.load(f)
                print(f"📜 Загружена история из {self.history_file}")
            
            # Загружаем соответствия кодов
            self._load_mappings_from_file()
                
        except Exception as e:
            print(f"⚠️ Ошибка загрузки файлов: {e}")

    def _save_dict_to_file(self):
        """Сохраняет словарь в JSON файл"""
        try:
            with open(self.dict_file, 'w', encoding='utf-8') as f:
                json.dump(self.cipher_dict, f, ensure_ascii=False, indent=2)
            print(f"💾 Словарь сохранен в {self.dict_file}")
        except Exception as e:
            print(f"❌ Ошибка сохранения словаря: {e}")

    def _save_history_to_file(self):
        """Сохраняет историю в JSON файл"""
        try:
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump(self.naming_history, f, ensure_ascii=False, indent=2)
            print(f"💾 История сохранена в {self.history_file}")
        except Exception as e:
            print(f"❌ Ошибка сохранения истории: {e}")

    def _add_to_history(self, operation: str, input_data: str, output_data: str, success: bool):
        """Добавляет запись в историю"""
        if self.save_to_file:
            record = {
                'timestamp': datetime.now().isoformat(),
                'operation': operation,
                'input': input_data,
                'output': output_data,
                'success': success
            }
            self.naming_history.append(record)
            
            # Ограничиваем историю последними 1000 записями
            if len(self.naming_history) > 1000:
                self.naming_history = self.naming_history[-1000:]
            
            self._save_history_to_file()

    def _save_code_mapping(self, code: str, original_name: str):
        """Сохраняет соответствие код -> оригинальное название для расшифровки"""
        self.code_to_name[code.lower()] = original_name.lower()
        if self.save_to_file:
            self._save_mappings_to_file()

    def _save_mappings_to_file(self):
        """Сохраняет соответствия кодов в файл"""
        mappings_file = "code_mappings.json"
        try:
            with open(mappings_file, 'w', encoding='utf-8') as f:
                json.dump(self.code_to_name, f, ensure_ascii=False, indent=2)
            print(f"💾 Соответствия кодов сохранены в {mappings_file}")
        except Exception as e:
            print(f"❌ Ошибка сохранения соответствий: {e}")

    def _load_mappings_from_file(self):
        """Загружает соответствия кодов из файла"""
        mappings_file = "code_mappings.json"
        try:
            if os.path.exists(mappings_file):
                with open(mappings_file, 'r', encoding='utf-8') as f:
                    self.code_to_name = json.load(f)
                print(f"🔗 Загружены соответствия из {mappings_file}")
        except Exception as e:
            print(f"⚠️ Ошибка загрузки соответствий: {e}")

    def _generate_new_code(self, word: str, length: int) -> str:
        """Генерирует новый уникальный код для слова"""
        # Используем первые символы + хеш для уникальности
        prefix = word.lower()[:length-1] if len(word) >= length-1 else word.lower()
        
        # Генерируем уникальный суффикс
        hash_suffix = hashlib.md5(word.lower().encode()).hexdigest()[:1]
        
        candidate = prefix + hash_suffix
        
        # Проверяем уникальность в существующих кодах
        counter = 0
        while candidate in self.reverse_cipher_dict or candidate in self.code_to_name:
            counter += 1
            candidate = prefix + str(counter % 10)
            if counter > 50:  # Защита от бесконечного цикла
                candidate = hash_suffix + str(random.randint(10, 99))[:length]
                break
        
        return candidate[:length]


def main():
    """Интерактивное меню системы шифрования"""
    system = CreativeNamingSystem()
    
    print("=" * 60)
    print("СИСТЕМА ШИФРОВАНИЯ НАЗВАНИЙ КРЕАТИВОВ (универсальный вариант)")
    print("=" * 60)
    print("Формат: geo_slot_approach_comment_number (любые слова!)")
    print()
    
    if system.save_to_file:
        print("💾 АВТОСОХРАНЕНИЕ:")
        print(f"📚 Словарь: {system.dict_file}")
        print(f"📜 История: {system.history_file}")
        print(f"🔗 Соответствия: code_mappings.json")
        print()
    
    while True:
        print("Меню:")
        print("1 - Кодировать")
        print("2 - Расшифровать")
        print("3 - Показать историю")
        print("4 - Показать словарь")
        print("0 - Выход")
        
        choice = input("> ").strip()
        
        if choice == '0':
            print("До свидания!")
            break
        elif choice == '1':
            names_input = input("Введите названия через запятую:\n> ")
            names = [name.strip() for name in names_input.split(',') if name.strip()]
            
            if names:
                print("Выберите стиль маскировки (iphone/blogger/random):", end=' ')
                style_input = input()
                try:
                    style = int(style_input)
                    if style not in [1, 2, 3]:
                        style = 1
                except:
                    style = 1
                
                for name in names:
                    result = system.encode_creative_name(name, style)
                    if 'error' not in result:
                        # Показываем ТОЛЬКО короткий код (длинный код скрыт)
                        print(f"{name} -> {result['external']}")
                    else:
                        print(f"Ошибка для {name}: {result['error']}")
            else:
                print("Не введены названия!")
                
        elif choice == '2':
            codes_input = input("Введите коды для расшифровки (через запятую):\n> ")
            codes = [code.strip() for code in codes_input.split(',') if code.strip()]
            
            if codes:
                for code in codes:
                    result = system.decode_creative_name(code)
                    if result['success']:
                        print(f"{code} -> {result['decoded_name']}")
                    else:
                        print(f"{code} -> ОШИБКА: {result.get('error', 'Неизвестный код')}")
            else:
                print("Не введены коды!")
                
        elif choice == '3':
            # Показать историю
            if system.naming_history:
                print(f"📜 История операций (последние 10 записей):")
                for record in system.naming_history[-10:]:
                    timestamp = record['timestamp'][:19]  # Убираем миллисекунды
                    operation = record['operation']
                    input_data = record['input']
                    output_data = record['output'][:50] + '...' if len(record['output']) > 50 else record['output']
                    status = "✅" if record['success'] else "❌"
                    print(f"  {status} {timestamp} | {operation.upper()} | {input_data} -> {output_data}")
            else:
                print("📜 История пуста")
                
        elif choice == '4':
            # Показать словарь
            dict_data = system.get_cipher_dictionary()
            print(f"📚 Словарь шифрования ({len(dict_data)} записей):")
            print("Оригинал -> Шифр")
            print("-" * 30)
            for original, cipher in list(dict_data.items())[:20]:  # Показываем первые 20
                print(f"{original:15} -> {cipher}")
            if len(dict_data) > 20:
                print(f"... и еще {len(dict_data) - 20} записей")
        else:
            print("Неверный выбор!")
        
        print()


if __name__ == "__main__":
    main()
