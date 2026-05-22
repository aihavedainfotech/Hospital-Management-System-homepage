import datetime

def normalize_time(time_data):
    """
    Standardizes various time formats (datetime.time, 'HH:MM:SS', 'h:mm AM/PM')
    into a consistent 'h:mm AM/PM' string for comparison.
    """
    if not time_data:
        return ""
        
    if isinstance(time_data, datetime.time):
        t = time_data
    elif isinstance(time_data, str):
        try:
            # Try parsing 'HH:MM:SS' or 'HH:MM'
            t = datetime.datetime.strptime(time_data, '%H:%M:%S').time()
        except ValueError:
            try:
                t = datetime.datetime.strptime(time_data, '%H:%M').time()
            except ValueError:
                try:
                    # Try parsing 'h:mm AM/PM'
                    t = datetime.datetime.strptime(time_data, '%I:%M %p').time()
                except ValueError:
                    return str(time_data)
    else:
        return str(time_data)
        
    # Format to 'h:mm AM/PM' without leading zero for hours
    hour = t.hour
    ampm = 'AM' if hour < 12 else 'PM'
    disp_hour = hour % 12
    if disp_hour == 0: disp_hour = 12
    return f"{disp_hour}:{t.minute:02d} {ampm}"

def generate_slots_from_timings(timing_str, interval=15):
    """Generate time slots from timing string using the given interval (minutes)"""
    # Defaults
    start_minutes = 10 * 60  # 10:00 AM
    end_minutes = 19 * 60    # 7:00 PM
    if not interval or interval <= 0:
        interval = 15
    
    if timing_str:
        try:
            # Handle multi-range or comma-separated timings
            timing_str = timing_str.lower().replace('to', '-').replace(',', ';')
            ranges = timing_str.split(';')
            for r in ranges:
                parts = r.split('-')
                if len(parts) == 2:
                    def parse_time_helper(s):
                        s = s.strip()
                        import re
                        # Format 1: 10:30 AM
                        match = re.search(r'(\d+)(?::(\d+))?\s*(am|pm)', s)
                        if match:
                            h = int(match.group(1))
                            m = int(match.group(2)) if match.group(2) else 0
                            p = match.group(3)
                            if p == 'pm' and h < 12: h += 12
                            if p == 'am' and h == 12: h = 0
                            return h * 60 + m
                        # Format 2: 18:00 or 10
                        match = re.search(r'(\d+)(?::(\d+))?', s)
                        if match:
                            h = int(match.group(1))
                            m = int(match.group(2)) if match.group(2) else 0
                            # Guessing logic for simple numbers
                            if h < 7: h += 12 # Assume PM for low numbers like 1, 2, 3
                            return h * 60 + m
                        return None
                    
                    s = parse_time_helper(parts[0])
                    e = parse_time_helper(parts[1])
                    if s is not None and e is not None:
                        start_minutes = s
                        end_minutes = e
                        break # For now, just take the first valid range
        except:
            pass
            
    slots = []
    for t in range(start_minutes, end_minutes, interval):
        h = t // 60
        m = t % 60
        ampm = 'PM' if h >= 12 else 'AM'
        dh = h % 12
        if dh == 0: dh = 12
        time_str = f"{dh}:{m:02d} {ampm}"
        slots.append({'time': time_str, 'available': True})
    return slots

def parse_slot_time(s):
    """Convert 'h:mm AM/PM' string to minutes from midnight"""
    import re
    match = re.search(r'(\d+):(\d+)\s*(am|pm)', s.lower())
    if not match: return 0
    h = int(match.group(1))
    m = int(match.group(2))
    p = match.group(3)
    if p == 'pm' and h < 12: h += 12
    if p == 'am' and h == 12: h = 0
    return h * 60 + m
