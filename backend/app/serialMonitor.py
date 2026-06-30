import serial
import json
import time
import os

# --- Configuration ---
# Common Linux ports: '/dev/ttyUSB0' or '/dev/ttyACM0'
SERIAL_PORT = 'COM7'
BAUD_RATE = 115200
JSON_FILE = 'sensor_data.json'

def parse_and_save():
    # Check if port exists before starting
    if not os.path.exists(SERIAL_PORT):
        print(f"Error: {SERIAL_PORT} not found. Try 'ls /dev/tty*' to find your ESP32.")
        return

    try:
        # Initialize Serial Connection
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        # Flush the buffer to discard old/partial data from boot
        ser.reset_input_buffer() 
        print(f"Connected to {SERIAL_PORT} at {BAUD_RATE} baud.")
        
        while True:
            if ser.in_waiting > 0:
                try:
                    line = ser.readline().decode('utf-8', errors='ignore').strip()
                    
                    if not line:
                        continue

                    parts = line.split(',')
                    
                    if len(parts) == 7:
                        data_dict = {
                            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                            "so2_ugm": float(parts[0]),
                            "h2s_ugm": float(parts[1]),
                            "h2s_temp": float(parts[2]),
                            "h2s_hum": float(parts[3]),
                            "wind_speed": float(parts[4]),
                            "bus_voltage_v": float(parts[5]),
                            "current_ma": float(parts[6])
                        }
                        
                        save_to_json(data_dict)
                        print(f"Data Logged: SO2: {parts[0]} | Temp: {parts[2]}°C")
                        
                except ValueError:
                    print(f"Skipping malformed line: {line}")
                except Exception as e:
                    print(f"Unexpected error: {e}")

    except serial.SerialException as e:
        print(f"Serial Error: {e}")
        print("Hint: Try 'sudo chmod 666 /dev/ttyUSB0' to fix permission issues.")
    except KeyboardInterrupt:
        print("\nLogging stopped by user.")
    finally:
        if 'ser' in locals() and ser.is_open:
            ser.close()

def save_to_json(new_data):
    """Appends data to a JSON list in a file."""
    data_list = []
    if os.path.exists(JSON_FILE):
        with open(JSON_FILE, 'r') as f:
            try:
                data_list = json.load(f)
            except json.JSONDecodeError:
                data_list = []

    data_list.append(new_data)

    with open(JSON_FILE, 'w') as f:
        json.dump(data_list, f, indent=4)

if __name__ == "__main__":
    parse_and_save()