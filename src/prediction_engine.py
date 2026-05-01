import pandas as pd
import numpy as np

def _get_year_columns(df: pd.DataFrame) -> list:
    """
    Helper method to dynamically find year columns in the DataFrame.
    It first searches for columns that are purely digits (e.g., '2019', '2020').
    If none are found, it assumes any column not named 'chapter' or 'topic' is a year column.
    """
    year_cols = [c for c in df.columns if str(c).isdigit()]
    if not year_cols:
        year_cols = [c for c in df.columns if str(c).lower() not in ('chapter', 'topic')]
    return year_cols

def predict_topics(df: pd.DataFrame) -> pd.DataFrame:
    """
    Part 1: Rule-Based Prediction
    
    Predicts the importance of chapters based on their frequency of appearance across years.
    
    Logic:
    - Appears in 4+ years -> "High"
    - Appears in 2-3 years -> "Medium"
    - Appears in 1 year -> "Low"
    - Appears in 0 years -> "Very Low"
    
    Args:
        df: Input pandas DataFrame where rows are chapters, columns are years, and 
            values are keyword hit counts.
            
    Returns:
        pandas DataFrame with columns: ['chapter', 'appearances', 'prediction']
        Sorted by appearances descending.
    """
    # Use a copy to avoid mutating the original dataframe and avoid SettingWithCopyWarning
    df = df.copy()
    
    year_cols = _get_year_columns(df)
    
    if 'chapter' in df.columns:
        chapters = df['chapter']
    else:
        # Fallback to index if 'chapter' column doesn't exist
        chapters = df.index
        
    # Extract only the year columns, convert to numeric, and fill missing values with 0
    df_years = df[year_cols].apply(pd.to_numeric, errors='coerce').fillna(0)
    
    # Vectorized: count of years where keyword hit count > 0
    counts = (df_years > 0).sum(axis=1).values
    
    # Optimized bucketing of counts using pd.cut
    # Using specific boundaries for intervals:
    # (-inf, 0.5] -> 0
    # (0.5, 1.5]  -> 1
    # (1.5, 3.5]  -> 2, 3
    # (3.5, inf)  -> 4+
    labels = ["Very Low", "Low", "Medium", "High"]
    predictions = pd.cut(counts, bins=[-float('inf'), 0.5, 1.5, 3.5, float('inf')], labels=labels)
    
    result = pd.DataFrame({
        'chapter': chapters,
        'appearances': counts,
        'prediction': predictions
    })
    
    # Sort output by appearances (descending) setup
    result = result.sort_values(by='appearances', ascending=False)
    
    # Reset index to provide a clean dataframe
    return result.reset_index(drop=True)

def trend_prediction(df: pd.DataFrame, threshold: float = 0.5) -> pd.DataFrame:
    """
    Part 2: Linear Trend Prediction
    
    Predicts the future trend direction of chapters using linear regression.
    
    Trend Classification:
    - slope > threshold -> "Increasing"
    - slope < -threshold -> "Decreasing"
    - otherwise -> "Stable"
    
    Args:
        df: Input pandas DataFrame where rows are chapters, columns are years.
        threshold: The threshold slope to classify a trend as Increasing/Decreasing.
        
    Returns:
        pandas DataFrame with columns: ['chapter', 'slope', 'predicted_next_year', 'trend']
    """
    df = df.copy()
    year_cols = _get_year_columns(df)
    num_years = len(year_cols)
    
    if 'chapter' in df.columns:
        chapters = df['chapter']
    else:
        chapters = df.index
        
    # Clean up data: ensure floats, fill NaN explicitly with 0
    df_years = df[year_cols].apply(pd.to_numeric, errors='coerce').fillna(0)
    y_values = df_years.values
    
    # Edge case: If there are less than 2 years of data, we cannot reliably compute a linear trend.
    if num_years < 2:
        return pd.DataFrame({
            'chapter': chapters,
            'slope': 0.0,
            'predicted_next_year': y_values[:, -1] if num_years == 1 else 0.0,
            'trend': "Stable"
        }).reset_index(drop=True)

    # Convert year columns into a numeric array (x-axis)
    # E.g., for 3 years: x = [0, 1, 2]
    x = np.arange(num_years)
    
    # Vectorized linear regression (np.polyfit supports 1D x and 2D y)
    # y_values.T shape: (num_years, num_chapters), so it fits all chapters efficiently at once.
    # Returns coefficients array: row 0 is slopes, row 1 is intercepts
    coefs = np.polyfit(x, y_values.T, deg=1)
    slopes = coefs[0, :]
    intercepts = coefs[1, :]
    
    # Predict next year's value (x = num_years)
    # e.g., if x is [0, 1, 2], next_x is 3
    predicted_next_year = slopes * num_years + intercepts
    
    # Keyword hit counts realistically cannot be negative, optionally clip to 0:
    # predicted_next_year = np.maximum(predicted_next_year, 0.0)
    
    # Determine trend labels based on slope and threshold
    conditions = [
        slopes > threshold,
        slopes < -threshold
    ]
    choices = ["Increasing", "Decreasing"]
    trends = np.select(conditions, choices, default="Stable")
    
    result = pd.DataFrame({
        'chapter': chapters,
        'slope': slopes,
        'predicted_next_year': predicted_next_year,
        'trend': trends
    })
    
    return result.reset_index(drop=True)
