import pandas as pd
import numpy as np
import warnings
from pmdarima import auto_arima
from sklearn.metrics import mean_absolute_percentage_error

warnings.filterwarnings("ignore")

def read_data(file_path):
    data = pd.read_csv(file_path).fillna(0)
    return data

def compute_moving_average(series, periods=3):
    # Fill NaNs with zero
    series_filled = pd.Series(np.nan_to_num(series, nan=0))
    return (series_filled.shift(periods-1) + series_filled.shift(periods) + series_filled.shift(periods+1)) / periods

def calculate_mape(actual, forecast):
    actual, forecast = np.array(actual), np.array(forecast)
    if actual.shape != forecast.shape:
        forecast = forecast[:len(actual)]
    nonzero_mask = actual != 0
    if len(actual.shape) != len(nonzero_mask.shape):
        nonzero_mask = nonzero_mask.reshape(actual.shape)
    if not np.any(nonzero_mask):
        return np.nan
    return mean_absolute_percentage_error(actual[nonzero_mask], forecast[nonzero_mask]) * 100

def build_auto_arima(series):
    model = auto_arima(series.fillna(0), seasonal=False, stepwise=True, suppress_warnings=True)
    return model

def forecast_model(model, periods):
    forecasted_values = model.predict(n_periods=periods)
    return [max(0, int(round(value))) for value in forecasted_values]

def save_forecast(forecasted_data, output_path):
    forecasted_data.to_csv(output_path, index=False)

def main():

    print("Starting AMS Forecasting...")

    file_path = "C:\\User\\administrator.AMSLINDIA\\invopbackend-master\\backend\\uploads\\ams.csv"
    output_path = "C:\\User\\administrator.AMSLINDIA\\invopbackend-master\\backend\\forecast.csv"
    
    # file_path = "C:\\Users\\Rishi\\Desktop\\Freelance_Projects\\backend_invop\\uploads\\ams.csv"
    # output_path = "C:\\Users\\Rishi\\Desktop\\Freelance_Projects\\backend_invop\\forecast.csv"

    data = read_data(file_path)
    if 'TimeID' not in data.columns:
        data.insert(0, 'TimeID', range(1, len(data) + 1))

    forecast_results = []

    for column in data.columns[1:]:
        series = data[column]

        # Ensure there are at least 12 periods of data for modeling
        if len(series) >= 12:
            # Compute 3MA forecast for n+1, n, and n-2
            ma3_n1_forecast = [max(0, int(round(value))) for value in compute_moving_average(series).iloc[-3:].values]
            ma3_n_forecast = ma3_n1_forecast[-1]  # n period forecast
            ma3_n2_forecast = ma3_n1_forecast[0]  # n-2 period forecast

            # Build AutoARIMA model and forecast
            arima_model = build_auto_arima(series)
            arima_forecast = forecast_model(arima_model, 2)

            actuals = series.iloc[-2:].values  # Actual values for comparison

            # Calculate MAPE for 3MA and AutoARIMA
            ma3_mape = calculate_mape(actuals, ma3_n1_forecast)
            arima_mape = calculate_mape(actuals, arima_forecast)

            forecast_results.extend([
                {'Product': column, 'TimeID': max(data['TimeID']) + 1, 'Model': '3MA', 'Forecast': ma3_n_forecast, 'MAPE': ma3_mape},
                {'Product': column, 'TimeID': max(data['TimeID']) + 2, 'Model': '3MA', 'Forecast': ma3_n1_forecast[-1], 'MAPE': ma3_mape},
                {'Product': column, 'TimeID': max(data['TimeID']) + 3, 'Model': '3MA', 'Forecast': ma3_n2_forecast, 'MAPE': ma3_mape},
                {'Product': column, 'TimeID': max(data['TimeID']) + 1, 'Model': 'AutoARIMA', 'Forecast': arima_forecast[0], 'MAPE': arima_mape},
                {'Product': column, 'TimeID': max(data['TimeID']) + 2, 'Model': 'AutoARIMA', 'Forecast': arima_forecast[1], 'MAPE': arima_mape}
            ])

    forecast_df = pd.DataFrame(forecast_results)
    save_forecast(forecast_df, output_path)

if __name__ == "__main__":
    main()

