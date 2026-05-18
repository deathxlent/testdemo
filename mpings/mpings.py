#!/usr/bin/env python3
import argparse
import subprocess
import re
import time
import sys
import threading
from dataclasses import dataclass, field
from typing import List, Optional
from datetime import datetime

try:
    import readchar
except ImportError:
    readchar = None


@dataclass
class PingStats:
    target: str
    ip: str = ""
    last: float = 0.0
    avg: float = 0.0
    min_ping: float = float('inf')
    max_ping: float = 0.0
    sent: int = 0
    received: int = 0
    loss_percent: float = 0.0
    history: List[float] = field(default_factory=list)
    error: str = ""
    
    def add_result(self, ping_time: float, ip: str = ""):
        self.last = ping_time
        self.sent += 1
        self.received += 1
        if ip:
            self.ip = ip
        
        self.history.append(ping_time)
        if len(self.history) > 60:
            self.history = self.history[-60:]
        
        self.min_ping = min(self.min_ping, ping_time)
        self.max_ping = max(self.max_ping, ping_time)
        
        if self.received > 0:
            self.avg = sum(self.history) / len(self.history)
        
        if self.sent > 0:
            self.loss_percent = ((self.sent - self.received) / self.sent) * 100
    
    def add_timeout(self):
        self.sent += 1
        if self.sent > 0:
            self.loss_percent = ((self.sent - self.received) / self.sent) * 100


def parse_ping_output(output: str, target: str) -> PingStats:
    stats = PingStats(target=target)
    
    ip_match = re.search(r'Pinging\s+[^\s]+\s+\[([^\]]+)\]', output)
    if ip_match:
        stats.ip = ip_match.group(1)
    else:
        ip_match = re.search(r'PING\s+[^\s]+\s+\(([^\)]+)\)', output)
        if ip_match:
            stats.ip = ip_match.group(1)
    
    times = re.findall(r'time[=<]([0-9.]+)\s*ms', output, re.IGNORECASE)
    if not times:
        times = re.findall(r'time[=<]([0-9.]+)', output, re.IGNORECASE)
    
    sent_match = re.search(r'Sent\s*=\s*(\d+)', output, re.IGNORECASE)
    received_match = re.search(r'Received\s*=\s*(\d+)', output, re.IGNORECASE)
    lost_match = re.search(r'Lost\s*=\s*(\d+)', output, re.IGNORECASE)
    loss_percent_match = re.search(r'\((\d+)%\s*loss\)', output, re.IGNORECASE)
    
    if sent_match:
        stats.sent = int(sent_match.group(1))
    if received_match:
        stats.received = int(received_match.group(1))
    if lost_match:
        lost = int(lost_match.group(1))
        stats.sent = stats.received + lost
    if loss_percent_match:
        stats.loss_percent = float(loss_percent_match.group(1))
    elif stats.sent > 0:
        stats.loss_percent = ((stats.sent - stats.received) / stats.sent) * 100
    
    if times:
        ping_times = [float(t) for t in times]
        for ping_time in ping_times:
            stats.add_result(ping_time, stats.ip)
    
    timeout_count = output.count('Request timed out') + output.count('timed out')
    for _ in range(timeout_count):
        stats.add_timeout()
    
    return stats


def ping_target(target: str, count: int = 1, timeout: int = 2) -> PingStats:
    try:
        if sys.platform == 'win32':
            cmd = ['ping', '-n', str(count), '-w', str(timeout * 1000), target]
        else:
            cmd = ['ping', '-c', str(count), '-W', str(timeout), target]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 5)
        output = result.stdout + result.stderr
        
        stats = parse_ping_output(output, target)
        if not stats.ip and result.returncode == 0:
            stats.ip = "Resolved"
        
        return stats
    except subprocess.TimeoutExpired:
        stats = PingStats(target=target)
        stats.add_timeout()
        stats.error = "Timeout"
        return stats
    except Exception as e:
        stats = PingStats(target=target)
        stats.error = str(e)
        return stats


def draw_line_chart(history: List[float], width: int = 40, height: int = 5) -> str:
    if not history:
        return " " * width
    
    min_val = min(history) if history else 0
    max_val = max(history) if history else 100
    
    if min_val == max_val:
        max_val = min_val + 1
    
    range_val = max_val - min_val
    
    lines = []
    for row in range(height - 1, -1, -1):
        line = ""
        threshold = min_val + (row / (height - 1)) * range_val if height > 1 else min_val
        
        for val in history[-width:]:
            if val >= threshold:
                line += "█"
            else:
                line += " "
        
        lines.append(line)
    
    return "\n".join(lines)


def format_number(num: float) -> str:
    if num == float('inf'):
        return "N/A"
    if num >= 1000:
        return f"{num:.0f}"
    elif num >= 100:
        return f"{num:.1f}"
    elif num >= 10:
        return f"{num:.2f}"
    else:
        return f"{num:.3f}"


def render_target(stats: PingStats, width: int, chart_width: int = 40) -> str:
    lines = []
    
    border = "╔" + "═" * (width - 2) + "╗"
    lines.append(border)
    
    title = f" Target: {stats.target}"
    title = title[:width - 2].ljust(width - 2)
    lines.append(f"║{title}║")
    
    lines.append("╠" + "═" * (width - 2) + "╣")
    
    if stats.error:
        error_line = f" Error: {stats.error}"[:width - 2].ljust(width - 2)
        lines.append(f"║{error_line}║")
    else:
        last_str = format_number(stats.last) if stats.last > 0 else "N/A"
        avg_str = format_number(stats.avg) if stats.avg > 0 else "N/A"
        min_str = format_number(stats.min_ping) if stats.min_ping != float('inf') else "N/A"
        max_str = format_number(stats.max_ping)
        
        info_lines = [
            f" Last: {last_str:>10} ms",
            f" Avg:  {avg_str:>10} ms",
            f" Min:  {min_str:>10} ms",
            f" Max:  {max_str:>10} ms",
            f" IP:   {stats.ip[:20] if stats.ip else 'N/A':<20}",
            f" LOSS: {stats.loss_percent:>5.1f}% ({stats.sent - stats.received}/{stats.sent})",
        ]
        
        for info in info_lines:
            info = info[:width - 2].ljust(width - 2)
            lines.append(f"║{info}║")
    
    lines.append("╠" + "═" * (width - 2) + "╣")
    
    chart_title = " Last Chart:"
    chart_title = chart_title[:width - 2].ljust(width - 2)
    lines.append(f"║{chart_title}║")
    
    chart_area_width = width - 2
    chart = draw_line_chart(stats.history, width=chart_area_width, height=5)
    for chart_line in chart.split('\n'):
        chart_line = chart_line[:width - 2].ljust(width - 2)
        lines.append(f"║{chart_line}║")
    
    lines.append("╚" + "═" * (width - 2) + "╝")
    
    return "\n".join(lines)


def clear_screen():
    if sys.platform == 'win32':
        print("\033[2J\033[H", end="")
    else:
        print("\033[2J\033[H", end="")
    sys.stdout.flush()


def move_cursor_home():
    if sys.platform == 'win32':
        print("\033[H", end="")
    else:
        print("\033[H", end="")
    sys.stdout.flush()


def ping_worker(target: str, stats: PingStats, stop_event: threading.Event):
    while not stop_event.is_set():
        result = ping_target(target, count=1, timeout=2)
        
        if result.last > 0:
            stats.last = result.last
            stats.avg = result.avg
            stats.min_ping = min(stats.min_ping, result.last) if stats.min_ping != float('inf') else result.last
            stats.max_ping = max(stats.max_ping, result.last)
            stats.history = result.history
            stats.ip = result.ip if result.ip else stats.ip
            stats.sent = result.sent
            stats.received = result.received
            stats.loss_percent = result.loss_percent
        elif result.error:
            stats.error = result.error
        
        time.sleep(1)


def main():
    parser = argparse.ArgumentParser(
        description='Multi-target ping monitor',
        usage='mpings target1 target2 [target3 ...]'
    )
    parser.add_argument('targets', nargs='+', help='Targets to ping (URLs or IP addresses)')
    
    args = parser.parse_args()
    
    if not args.targets:
        parser.print_help()
        sys.exit(1)
    
    print("Starting mpings...")
    print(f"Monitoring {len(args.targets)} target(s)")
    print("Press Ctrl+C to exit\n")
    time.sleep(1)
    
    stats_list: List[PingStats] = []
    stop_events: List[threading.Event] = []
    threads: List[threading.Thread] = []
    
    for target in args.targets:
        stats = PingStats(target=target)
        stats_list.append(stats)
        stop_event = threading.Event()
        stop_events.append(stop_event)
        
        thread = threading.Thread(target=ping_worker, args=(target, stats, stop_event), daemon=True)
        thread.start()
        threads.append(thread)
    
    try:
        num_targets = len(args.targets)
        
        if sys.platform == 'win32':
            import os
            os.system('')
        
        while True:
            move_cursor_home()
            
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            print(f"mpings - {now} | Targets: {num_targets} | Press Ctrl+C to exit")
            print("=" * 80)
            print()
            
            try:
                terminal_width = 120
            except:
                terminal_width = 120
            
            box_width = min(80, terminal_width // num_targets - 2)
            if box_width < 40:
                box_width = 40
                num_per_row = max(1, terminal_width // (box_width + 2))
            else:
                num_per_row = num_targets
            
            for i, stats in enumerate(stats_list):
                output = render_target(stats, box_width)
                
                if i > 0 and i % num_per_row == 0:
                    print()
                
                if i % num_per_row != 0:
                    print("  ", end="")
                
                print(output, end="")
                
                if i < len(stats_list) - 1 and (i + 1) % num_per_row != 0:
                    print("  ", end="")
            
            print("\n")
            print("Stats update every 1 second...")
            
            time.sleep(1)
    
    except KeyboardInterrupt:
        print("\n\nStopping...")
        for stop_event in stop_events:
            stop_event.set()
        
        time.sleep(0.5)
        
        print("\nFinal Statistics:")
        print("=" * 80)
        for stats in stats_list:
            print(f"\n{stats.target}:")
            print(f"  IP: {stats.ip}")
            print(f"  Last: {stats.last:.2f} ms")
            print(f"  Avg: {stats.avg:.2f} ms")
            print(f"  Min: {stats.min_ping:.2f} ms" if stats.min_ping != float('inf') else "  Min: N/A")
            print(f"  Max: {stats.max_ping:.2f} ms")
            print(f"  Loss: {stats.loss_percent:.1f}%")
        
        print("\nGoodbye!")


if __name__ == "__main__":
    main()
