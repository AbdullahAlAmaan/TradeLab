"""
Numpy type conversion utilities for database compatibility.
This file forces Railway to rebuild and ensures numpy types are converted.
"""

print("🚀 DEBUG: Loading numpy_fix.py...")
import numpy as np
print("🚀 DEBUG: numpy_fix.py loaded successfully")

def convert_numpy_types(obj):
    """Convert numpy types to Python native types for database compatibility."""
    if isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: convert_numpy_types(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    else:
        return obj

def safe_float(value):
    """Safely convert any value to float, handling numpy types."""
    print(f"🚀 DEBUG: safe_float called with value: {value}, type: {type(value)}")
    if value is None:
        return 0.0
    if isinstance(value, np.floating):
        result = float(value)
        print(f"🚀 DEBUG: Converted numpy float {value} to {result}")
        return result
    result = float(value)
    print(f"🚀 DEBUG: Converted {value} to {result}")
    return result

def safe_int(value):
    """Safely convert any value to int, handling numpy types."""
    if value is None:
        return 0
    if isinstance(value, np.integer):
        return int(value)
    return int(value)
