import os
import shutil
import sys
from pathlib import Path
from datetime import datetime
from PIL import Image

# ===== تنظیمات =====
INPUT_DIR = r"."                    # پوشه ورودی
OUTPUT_FORMAT = "WEBP"              # فرمت خروجی
QUALITY = 85                        # کیفیت (1-100)
BACKUP_DIR_NAME = "_img_backup"     # نام پوشه بکاپ
INPUT_EXTENSIONS = {".png", ".jpg", ".jpeg"}   # پسوندهای ورودی
# ===================================


def convert_and_replace(input_dir: str):
    input_path = Path(input_dir).resolve()
    
    if not input_path.exists():
        print(f"❌ پوشه پیدا نشد: {input_path}")
        return
    
    # ساخت پوشه بکاپ با تاریخ و ساعت
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_root = input_path.parent / f"{BACKUP_DIR_NAME}_{timestamp}"
    backup_root.mkdir(parents=True, exist_ok=True)
    print(f"📦 پوشه بکاپ ساخته شد: {backup_root}\n")
    
    # پیدا کردن همه فایل‌های تصویری
    image_files = []
    for p in input_path.rglob("*"):
        if not p.is_file():
            continue
        # نادیده گرفتن پوشه بکاپ
        if BACKUP_DIR_NAME in p.parts:
            continue
        if p.suffix.lower() in INPUT_EXTENSIONS:
            image_files.append(p)
    
    if not image_files:
        print("⚠️  هیچ فایل PNG یا JPG پیدا نشد.")
        return
    
    # شمارش به تفکیک فرمت
    png_count = sum(1 for f in image_files if f.suffix.lower() == ".png")
    jpg_count = sum(1 for f in image_files if f.suffix.lower() in (".jpg", ".jpeg"))
    
    print(f"🔍 {len(image_files)} فایل پیدا شد:")
    print(f"   • PNG: {png_count}")
    print(f"   • JPG/JPEG: {jpg_count}\n")
    
    success = 0
    failed = 0
    total_original = 0
    total_new = 0
    
    for img_file in image_files:
        try:
            relative = img_file.relative_to(input_path)
            
            # 1️⃣ بکاپ گرفتن
            backup_file = backup_root / relative
            backup_file.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(img_file, backup_file)
            
            # 2️⃣ تبدیل به WebP
            out_file = img_file.with_suffix(f".{OUTPUT_FORMAT.lower()}")
            
            with Image.open(img_file) as img:
                # آماده‌سازی حالت تصویر
                if OUTPUT_FORMAT.upper() == "WEBP":
                    if img.mode == "P":
                        img = img.convert("RGBA")
                    elif img.mode == "CMYK":
                        img = img.convert("RGB")
                elif OUTPUT_FORMAT.upper() == "JPEG":
                    if img.mode in ("RGBA", "LA", "P"):
                        bg = Image.new("RGB", img.size, (255, 255, 255))
                        img_rgba = img.convert("RGBA")
                        bg.paste(img_rgba, mask=img_rgba.split()[-1])
                        img = bg
                    else:
                        img = img.convert("RGB")
                
                save_kwargs = {"quality": QUALITY, "method": 6}
                img.save(out_file, OUTPUT_FORMAT, **save_kwargs)
            
            # 3️⃣ حذف فایل اصلی
            img_file.unlink()
            
            # محاسبه صرفه‌جویی
            original_size = backup_file.stat().st_size
            new_size = out_file.stat().st_size
            total_original += original_size
            total_new += new_size
            percent = ((original_size - new_size) / original_size) * 100 if original_size else 0
            
            icon = "🟦" if img_file.suffix.lower() == ".png" else "🟨"
            print(f"{icon} {relative}")
            print(f"   {original_size/1024:.1f} KB → {new_size/1024:.1f} KB ({percent:+.1f}%)")
            success += 1
        
        except Exception as e:
            print(f"❌ خطا در {img_file.name}: {e}")
            # در صورت خطا، فایل اصلی را بازگردان
            try:
                backup_file = backup_root / img_file.relative_to(input_path)
                if backup_file.exists() and not img_file.exists():
                    shutil.copy2(backup_file, img_file)
                    print(f"   ↩️  فایل اصلی بازگردانده شد.")
            except Exception:
                pass
            failed += 1
    
    # گزارش نهایی
    print("\n" + "=" * 55)
    print(f"📊 نتیجه: {success} موفق | {failed} ناموفق")
    if total_original > 0:
        saved = total_original - total_new
        percent = (saved / total_original) * 100
        print(f"💾 حجم اصلی: {total_original/1024/1024:.2f} MB")
        print(f"💾 حجم جدید: {total_new/1024/1024:.2f} MB")
        print(f"🎉 صرفه‌جویی: {saved/1024/1024:.2f} MB ({percent:.1f}%)")
    print(f"📦 بکاپ در: {backup_root}")


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else INPUT_DIR
    print("⚠️  هشدار: فایل‌های PNG و JPG اصلی حذف و با WebP جایگزین می‌شوند!")
    print("   (بکاپ به صورت خودکار گرفته می‌شود)\n")
    
    confirm = input("ادامه می‌دهید؟ (yes/no): ").strip().lower()
    if confirm in ("yes", "y", "بله"):
        convert_and_replace(target)
    else:
        print("لغو شد.")
