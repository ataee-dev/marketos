import json
from collections import defaultdict
import time

# --- تنظیمات ---
MAIN_FILE = 'cars_specs_only.json'        # فایل اصلی
MANUAL_FILE = 'manual_specs.json'         # فایل داده‌های دستی
OUTPUT_FILE = 'cars_specs_only.json'      # خروجی (همون فایل اصلی)


def merge_manual_specs(main_file, manual_file, output_file):
    """ادغام داده‌های دستی با داده‌های اسکرپ شده و ذخیره در فایل اصلی."""
    
    print("=" * 70)
    print("ادغام داده‌های دستی با دیتابیس اصلی")
    print("=" * 70)
    
    # 1. خواندن فایل اصلی
    try:
        with open(main_file, 'r', encoding='utf-8') as f:
            main_data = json.load(f)
    except FileNotFoundError:
        print(f"❌ فایل '{main_file}' پیدا نشد.")
        return
    except json.JSONDecodeError as e:
        print(f"❌ فایل '{main_file}' معتبر نیست: {e}")
        return
    
    # 2. خواندن فایل داده‌های دستی
    try:
        with open(manual_file, 'r', encoding='utf-8') as f:
            manual_data = json.load(f)
    except FileNotFoundError:
        print(f"❌ فایل '{manual_file}' پیدا نشد.")
        return
    except json.JSONDecodeError as e:
        print(f"❌ فایل '{manual_file}' معتبر نیست: {e}")
        return
    
    main_cars = main_data.get('cars', [])
    manual_cars = manual_data.get('cars', [])
    
    print(f"✓ {len(main_cars)} خودرو در فایل اصلی")
    print(f"✓ {len(manual_cars)} خودرو در فایل داده‌های دستی")
    print()
    
    # 3. ساخت ایندکس بر اساس ID
    manual_index = {c['id']: c for c in manual_cars}
    
    # 4. ادغام
    print("📝 در حال ادغام...")
    
    merged_count = 0
    added_count = 0
    skipped_count = 0
    merged_details = []
    
    for car in main_cars:
        car_id = car.get('id')
        
        if car_id in manual_index:
            manual = manual_index[car_id]
            
            # آمار قبل
            before_specs = len(car.get('specifications', {}))
            before_features = len(car.get('features', {}))
            
            # ادغام مشخصات فنی (داده دستی اولویت داره)
            if 'specifications' in manual:
                if 'specifications' not in car or not car['specifications']:
                    car['specifications'] = manual['specifications']
                else:
                    # ادغام: داده‌های دستی روی داده‌های اسکرپ شده اضافه میشن
                    car['specifications'].update(manual['specifications'])
            
            # ادغام امکانات
            if 'features' in manual:
                if 'features' not in car or not car['features']:
                    car['features'] = manual['features']
                else:
                    car['features'].update(manual['features'])
            
            # آمار بعد
            after_specs = len(car.get('specifications', {}))
            after_features = len(car.get('features', {}))
            
            # افزودن منبع
            car['manual_source'] = True
            car['manual_specs_added'] = after_specs - before_specs
            car['manual_features_added'] = after_features - before_features
            
            merged_count += 1
            merged_details.append({
                "id": car_id,
                "name": car.get('name'),
                "category": car.get('category'),
                "specs_added": after_specs - before_specs,
                "features_added": after_features - before_features,
            })
            
            print(f"  ✓ {car.get('name', car_id)[:40]:40s}  +{after_specs - before_specs} مشخصه، +{after_features - before_features} ویژگی")
        else:
            skipped_count += 1
    
    # 5. خودروهایی که در فایل اصلی نیستن ولی در داده‌های دستی هستن
    main_ids = {c.get('id') for c in main_cars}
    new_cars = [c for c in manual_cars if c['id'] not in main_ids]
    
    if new_cars:
        print(f"\n📌 خودروهای جدید (فقط در داده‌های دستی):")
        for new_car in new_cars:
            main_cars.append(new_car)
            added_count += 1
            print(f"  + {new_car.get('name', new_car['id'])}")
    
    # 6. بازسازی آمار کلی
    print("\n📊 در حال بازسازی آمار...")
    
    total_specs = sum(len(c.get('specifications', {})) for c in main_cars)
    total_features = sum(len(c.get('features', {})) for c in main_cars)
    total_feature_list = sum(len(c.get('feature_list', [])) for c in main_cars)
    total_descriptions = sum(len(c.get('description', [])) for c in main_cars)
    
    # گروه‌بندی مجدد
    by_category = defaultdict(list)
    for car in main_cars:
        by_category[car.get('category', 'سایر')].append(car)
    
    by_group = defaultdict(list)
    for car in main_cars:
        by_group[car.get('group', 'unknown')].append(car)
    
    # کیفیت
    quality_stats = {
        'complete': [],      # 15+ مورد
        'partial': [],       # 5-14 مورد
        'minimal': [],       # 1-4 مورد
        'no_specs': [],      # 0 مورد
    }
    
    for car in main_cars:
        count = (len(car.get('specifications', {})) + 
                 len(car.get('features', {})) + 
                 len(car.get('feature_list', [])))
        item = {
            "id": car.get('id'),
            "name": car.get('name'),
            "category": car.get('category'),
            "specs_count": count,
        }
        if count >= 15:
            quality_stats['complete'].append(item)
        elif count >= 5:
            quality_stats['partial'].append(item)
        elif count >= 1:
            quality_stats['minimal'].append(item)
        else:
            quality_stats['no_specs'].append(item)
    
    # آمار دسته‌بندی
    category_stats = {}
    for cat, cat_cars in by_category.items():
        specs_total = sum(len(c.get('specifications', {})) for c in cat_cars)
        features_total = sum(len(c.get('features', {})) for c in cat_cars)
        category_stats[cat] = {
            "count": len(cat_cars),
            "total_specifications": specs_total,
            "total_features": features_total,
            "avg_specifications": round(specs_total / len(cat_cars), 1),
            "avg_features": round(features_total / len(cat_cars), 1),
        }
    
    # 7. به‌روزرسانی فایل اصلی
    main_data['cars'] = main_cars
    main_data['byCategory'] = dict(by_category)
    main_data['byGroup'] = dict(by_group)
    main_data['categories'] = sorted(list(by_category.keys()))
    main_data['groups'] = sorted(list(by_group.keys()))
    
    main_data['stats'] = {
        "total_cars": len(main_cars),
        "total_specifications": total_specs,
        "total_features": total_features,
        "total_feature_list": total_feature_list,
        "total_descriptions": total_descriptions,
        "categories_count": len(by_category),
        "groups_count": len(by_group),
        "quality": {
            "complete": len(quality_stats['complete']),
            "partial": len(quality_stats['partial']),
            "minimal": len(quality_stats['minimal']),
            "no_specs": len(quality_stats['no_specs']),
        }
    }
    
    main_data['categoryStats'] = category_stats
    
    main_data['qualityReport'] = {
        "complete": sorted(quality_stats['complete'], key=lambda x: -x['specs_count']),
        "partial": sorted(quality_stats['partial'], key=lambda x: -x['specs_count']),
        "minimal": sorted(quality_stats['minimal'], key=lambda x: -x['specs_count']),
        "no_specs": quality_stats['no_specs'],
    }
    
    # متادیتا
    if 'metadata' not in main_data:
        main_data['metadata'] = {}
    
    main_data['metadata']['last_manual_merge'] = time.strftime("%Y-%m-%dT%H:%M:%S")
    main_data['metadata']['manual_merge_summary'] = {
        "merged_count": merged_count,
        "added_count": added_count,
        "skipped_count": skipped_count,
    }
    
    # 8. ذخیره
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(main_data, f, ensure_ascii=False, indent=2)
        print(f"\n✓ فایل ذخیره شد: {output_file}")
    except IOError as e:
        print(f"❌ خطا در ذخیره: {e}")
        return
    
    # 9. نمایش خلاصه
    print("\n" + "=" * 70)
    print("📊 خلاصه ادغام")
    print("=" * 70)
    print(f"✓ خودروهای ادغام شده:     {merged_count}")
    print(f"✓ خودروهای جدید اضافه شده: {added_count}")
    print(f"✓ خودروهای بدون تغییر:    {skipped_count}")
    print()
    print("📈 آمار به‌روز شده:")
    print(f"   • کل خودروها:          {len(main_cars)}")
    print(f"   • کل مشخصات فنی:       {total_specs}")
    print(f"   • کل امکانات:          {total_features}")
    print(f"   • کل توضیحات:          {total_descriptions}")
    print()
    print("⭐ کیفیت داده‌ها (پس از ادغام):")
    print(f"   🌟 کامل (15+):         {len(quality_stats['complete'])}")
    print(f"   ✅ جزئی (5-14):         {len(quality_stats['partial'])}")
    print(f"   ⚠️  حداقلی (1-4):       {len(quality_stats['minimal'])}")
    print(f"   ❌ بدون مشخصه:         {len(quality_stats['no_specs'])}")
    print("=" * 70)
    print(f"\n✨ فایل نهایی: {output_file}")


if __name__ == "__main__":
    merge_manual_specs(MAIN_FILE, MANUAL_FILE, OUTPUT_FILE)
