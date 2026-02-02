import sys
import os

# Add the current directory to sys.path to ensure 'app' can be imported
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# Also add the parent directory if needed
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

try:
    from app.database import SessionLocal
    from app.models import RevisaoItem as RevisaoItemModel
    from app.models import RevisaoPeriodo as RevisaoPeriodoModel
    from sqlalchemy import text
except ImportError as e:
    print(f"Import Error: {e}")
    # Try adding 'backend' to path explicitly
    sys.path.append(os.path.join(parent_dir, 'backend'))
    from app.database import SessionLocal
    from app.models import RevisaoItem as RevisaoItemModel
    from app.models import RevisaoPeriodo as RevisaoPeriodoModel
    from sqlalchemy import text

def debug_depreciated():
    print("Starting debug script...")
    db = SessionLocal()
    try:
        print("Connected to DB successfully.")
        
        # Check Periods
        periods = db.query(RevisaoPeriodoModel).all()
        print(f"Total periods: {len(periods)}")
        for p in periods:
            print(f"Period ID: {p.id}, Company: {p.empresa_id}, Status: {p.status}")
        
        # Get all items
        items = db.query(RevisaoItemModel).all()
        print(f"Total items in DB: {len(items)}")
        
        # Group by Period
        items_by_period = {}
        for it in items:
            pid = it.periodo_id
            if pid not in items_by_period:
                items_by_period[pid] = []
            items_by_period[pid].append(it)
            
        for pid, p_items in items_by_period.items():
            print(f"\n--- Analyzing Period {pid} ({len(p_items)} items) ---")
            
            # Simulate Dashboard Logic for this period
            asset_groups = {}
            for it in p_items:
                key = str(it.numero_imobilizado or '')
                if key not in asset_groups:
                    asset_groups[key] = []
                asset_groups[key].append(it)
            
            main_items = []
            for it in p_items:
                try:
                    sub_str = str(it.sub_numero) if it.sub_numero is not None else "0"
                    sub = float(sub_str) 
                    if sub == 0:
                        main_items.append(it)
                except:
                    pass
            
            fully_depreciated_count = 0
            
            for main_item in main_items:
                key = str(main_item.numero_imobilizado or '')
                group = asset_groups.get(key, [])
                
                total_value = 0.0
                for part in group:
                    val = part.valor_contabil
                    if val is None:
                        val = 0.0
                    else:
                        try:
                            val = float(val)
                        except:
                            val = 0.0
                    total_value += val
                
                if abs(total_value) < 0.01:
                    fully_depreciated_count += 1
            
            print(f"  Main items: {len(main_items)}")
            print(f"  Fully depreciated: {fully_depreciated_count}")
        
    except Exception as e:
        print(f"Error during execution: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_depreciated()
