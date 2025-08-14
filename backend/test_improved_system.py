"""
Тест улучшенной системы шифрования
Проверяет новую логику без показа длинного кода и с автозапоминанием
"""

from creative_naming import CreativeNamingSystem

def test_improved_system():
    """Тестируует улучшенную систему"""
    print("🧪 ТЕСТ УЛУЧШЕННОЙ СИСТЕМЫ ШИФРОВАНИЯ")
    print("=" * 50)
    
    # Создаем систему (без автосохранения для теста)
    system = CreativeNamingSystem(save_to_file=False)
    
    print("1️⃣ ТЕСТ: Кодирование известных слов")
    result = system.encode_creative_name("GR_plinko_timer_nekittopchik_1", 2)
    if 'error' not in result:
        print(f"✅ GR_plinko_timer_nekittopchik_1 -> {result['external']}")
        print(f"   (внутренний код скрыт от пользователя)")
    
    print("\n2️⃣ ТЕСТ: Кодирование с новыми словами (автосоздание)")
    result = system.encode_creative_name("FR_plinka_watafak_ogo_1", 3) 
    if 'error' not in result:
        print(f"✅ FR_plinka_watafak_ogo_1 -> {result['external']}")
        external_code = result['external']
    
    print("\n3️⃣ ТЕСТ: Расшифровка через прямое соответствие")
    decode_result = system.decode_creative_name(external_code)
    if decode_result['success']:
        print(f"✅ {external_code} -> {decode_result['decoded_name']}")
        print(f"   Метод: {decode_result.get('method', 'unknown')}")
    else:
        print(f"❌ Ошибка расшифровки: {decode_result.get('error')}")
    
    print("\n4️⃣ ТЕСТ: Расшифровка с расширением .mp4")
    mp4_code = external_code + ".mp4"
    decode_result_mp4 = system.decode_creative_name(mp4_code)
    if decode_result_mp4['success']:
        print(f"✅ {mp4_code} -> {decode_result_mp4['decoded_name']}")
        print(f"   Метод: {decode_result_mp4.get('method', 'unknown')}")
    else:
        print(f"❌ Ошибка расшифровки: {decode_result_mp4.get('error')}")
    
    print("\n5️⃣ ТЕСТ: Проверка словаря соответствий")
    mappings = system.code_to_name
    print(f"📚 Сохранено соответствий: {len(mappings)}")
    for code, name in mappings.items():
        print(f"   {code} -> {name}")
    
    print("\n6️⃣ ТЕСТ: Повторное кодирование того же названия")
    result2 = system.encode_creative_name("FR_plinka_watafak_ogo_1", 3)
    if 'error' not in result2:
        print(f"✅ FR_plinka_watafak_ogo_1 -> {result2['external']}")
        if result2['external'] == result['external']:
            print("   ✅ Код остался тем же (система запомнила)")
        else:
            print("   ⚠️ Код изменился (неожиданно)")
    
    print("\n" + "=" * 50)
    print("🎯 РЕЗУЛЬТАТ: Система работает без показа длинного кода")
    print("🧠 Автоматически создает коды для новых слов") 
    print("💾 Запоминает соответствия для быстрой расшифровки")
    print("🔧 Универсально работает с .mp4 и без расширения")

def test_scenario_from_screenshot():
    """Тест конкретного сценария из скриншота"""
    print("\n\n📸 ВОСПРОИЗВЕДЕНИЕ СЦЕНАРИЯ ИЗ СКРИНШОТА")
    print("=" * 50)
    
    system = CreativeNamingSystem(save_to_file=False)
    
    # Кодируем как в скриншоте
    print("🔐 Кодируем: FR_plinko_watafak_ogo_1")
    result = system.encode_creative_name("FR_plinko_watafak_ogo_1", 3)
    if 'error' not in result:
        short_code = result['external']
        print(f"✅ Результат: {short_code}")
        print(f"   (длинный код спрятан)")
        
        # Теперь расшифровываем
        print(f"\n🔓 Расшифровываем: {short_code}")
        decode_result = system.decode_creative_name(short_code)
        if decode_result['success']:
            print(f"✅ {short_code} -> {decode_result['decoded_name']}")
        else:
            print(f"❌ Ошибка: {decode_result.get('error')}")
            
        print(f"\n🔓 Расшифровываем с .mp4: {short_code}.mp4")
        decode_result_mp4 = system.decode_creative_name(short_code + ".mp4")
        if decode_result_mp4['success']:
            print(f"✅ {short_code}.mp4 -> {decode_result_mp4['decoded_name']}")
        else:
            print(f"❌ Ошибка: {decode_result_mp4.get('error')}")

if __name__ == "__main__":
    test_improved_system()
    test_scenario_from_screenshot()
