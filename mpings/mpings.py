#!/usr/bin/env python3
import argparse
import subprocess
import re
import time
import sys
import threading
import shutil
from urllib.parse import urlparse
from dataclasses import dataclass, field
from typing import List
from datetime import datetime


def extract_domain(url: str) -> str:
    url = url.strip()
    if not url:
        return url

    if not url.startswith(('http://', 'https://')):
        url = 'http://' + url

    try:
        parsed = urlparse(url)
        domain = parsed.netloc
        if domain:
            domain = domain.split(':')[0]
            return domain
    except:
        pass

    match = re.match(r'^(?:https?://)?(?:www\.)?([^/\s:]+)', url)
    if match:
        return match.group(1)

    return url.split('/')[0].split(':')[0]


@dataclass
class PingStats:
    target: str
    display_target: str = ""
    ip: str = ""
    last: float = 0.0
    avg: float = 0.0
    min_ping: float = float('inf')
    max_ping: float = 0.0
    sent: int = 0
    received: int = 0
    history: List[float] = field(default_factory=list)
    error: str = ""
    lock: threading.Lock = field(default_factory=threading.Lock)

    @property
    def loss_count(self) -> int:
        return self.sent - self.received

    @property
    def loss_percent(self) -> float:
        if self.sent == 0:
            return 0.0
        return (self.loss_count / self.sent) * 100

    def update(self, ping_time: float = None, ip: str = None, error: str = None):
        with self.lock:
            if ip:
                self.ip = ip
            if error:
                self.error = error
                self.sent += 1
                return

            if ping_time is None:
                self.sent += 1
                return

            self.sent += 1
            self.received += 1
            self.last = ping_time
            self.history.append(ping_time)
            if len(self.history) > 60:
                self.history = self.history[-60:]

            if ping_time < self.min_ping:
                self.min_ping = ping_time
            if ping_time > self.max_ping:
                self.max_ping = ping_time

            self.avg = sum(self.history) / len(self.history)
            self.error = ""


def parse_win_ping(output: str) -> dict:
    result = {'ip': None, 'time': None, 'error': None}

    ip_match = re.search(r'Ping(?:ing)?\s+[^\s]+\s+\[([^\]]+)\]', output)
    if ip_match:
        result['ip'] = ip_match.group(1)
    else:
        ip_match = re.search(r'(\d+\.\d+\.\d+\.\d+)', output)
        if ip_match:
            result['ip'] = ip_match.group(1)

    time_match = re.search(r'(?:time|时间)[=<]([0-9.]+)\s*ms', output, re.IGNORECASE)
    if time_match:
        result['time'] = float(time_match.group(1))
    else:
        time_match = re.search(r'=([0-9]+)\s*ms', output)
        if time_match:
            result['time'] = float(time_match.group(1))

    if 'Request timed out' in output or 'timed out' in output or '请求超时' in output:
        result['error'] = 'Timeout'
    elif 'could not find host' in output.lower() or 'unknown host' in output.lower() or '找不到主机' in output:
        result['error'] = 'Unknown host'

    return result


def parse_linux_ping(output: str) -> dict:
    result = {'ip': None, 'time': None, 'error': None}

    ip_match = re.search(r'PING\s+[^\s]+\s+\(([^\)]+)\)', output)
    if ip_match:
        result['ip'] = ip_match.group(1)

    time_match = re.search(r'time[=<]([0-9.]+)\s*ms', output, re.IGNORECASE)
    if time_match:
        result['time'] = float(time_match.group(1))

    if '100% packet loss' in output or '100% loss' in output:
        result['error'] = 'Timeout'
    elif 'unknown host' in output.lower() or 'not known' in output.lower():
        result['error'] = 'Unknown host'

    return result


def ping_target(target: str, timeout: int = 2) -> dict:
    try:
        if sys.platform == 'win32':
            cmd = ['ping', '-n', '1', '-w', str(timeout * 1000), target]
        else:
            cmd = ['ping', '-c', '1', '-W', str(timeout), target]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 5)
        output = result.stdout + result.stderr

        if sys.platform == 'win32':
            return parse_win_ping(output)
        else:
            return parse_linux_ping(output)
    except subprocess.TimeoutExpired:
        return {'ip': None, 'time': None, 'error': 'Timeout'}
    except Exception as e:
        return {'ip': None, 'time': None, 'error': str(e)}


def ping_worker(target: str, stats: PingStats, stop_event: threading.Event):
    while not stop_event.is_set():
        result = ping_target(target)
        stats.update(
            ping_time=result.get('time'),
            ip=result.get('ip'),
            error=result.get('error')
        )
        time.sleep(1)


def draw_line_chart(history: List[float], width: int, height: int = 3) -> List[str]:
    if not history:
        return [' ' * width for _ in range(height)]

    values = history[-width:]
    min_val = min(values) if values else 0
    max_val = max(values) if values else 100

    if min_val == max_val:
        max_val = min_val + 1

    range_val = max_val - min_val
    lines = []

    for row in range(height - 1, -1, -1):
        line = ''
        for val in values:
            if range_val > 0:
                normalized = (val - min_val) / range_val
            else:
                normalized = 0.5
            threshold = row / (height - 1) if height > 1 else 0.5
            if normalized >= threshold:
                line += '█'
            else:
                line += ' '
        line = line[:width].ljust(width)
        lines.append(line)

    return lines


def format_number(num: float) -> str:
    if num == float('inf') or num == 0:
        return 'N/A'
    if num >= 1000:
        return f'{num:.0f}'
    elif num >= 100:
        return f'{num:.1f}'
    elif num >= 10:
        return f'{num:.2f}'
    else:
        return f'{num:.3f}'


def render_box_lines(stats: PingStats, box_width: int) -> List[str]:
    inner_width = box_width - 2
    lines = []

    lines.append('╔' + '═' * inner_width + '╗')

    display_name = stats.display_target if stats.display_target else stats.target
    title = f' Target: {display_name}'[:inner_width].ljust(inner_width)
    lines.append(f'║{title}║')

    lines.append('╠' + '═' * inner_width + '╣')

    if stats.error:
        error_line = f' Error: {stats.error}'[:inner_width].ljust(inner_width)
        lines.append(f'║{error_line}║')
    else:
        last_str = format_number(stats.last) if stats.last > 0 else 'N/A'
        avg_str = format_number(stats.avg) if stats.avg > 0 else 'N/A'
        min_str = format_number(stats.min_ping) if stats.min_ping != float('inf') else 'N/A'
        max_str = format_number(stats.max_ping) if stats.max_ping > 0 else 'N/A'
        ip_str = stats.ip[:inner_width - 6] if stats.ip else 'N/A'

        info = [
            f' Last: {last_str:>10} ms',
            f' Avg:  {avg_str:>10} ms',
            f' Min:  {min_str:>10} ms',
            f' Max:  {max_str:>10} ms',
            f' IP:   {ip_str}',
            f' LOSS: {stats.loss_percent:>5.1f}% ({stats.loss_count}/{stats.sent})',
        ]

        for line in info:
            lines.append(f'║{line[:inner_width].ljust(inner_width)}║')

    lines.append('╠' + '═' * inner_width + '╣')

    chart_title = ' Last Chart:'[:inner_width].ljust(inner_width)
    lines.append(f'║{chart_title}║')

    chart = draw_line_chart(stats.history, width=inner_width, height=3)
    for chart_line in chart:
        lines.append(f'║{chart_line}║')

    lines.append('╚' + '═' * inner_width + '╝')

    return lines


def render_all(stats_list: List[PingStats], terminal_width: int) -> str:
    num_targets = len(stats_list)
    if num_targets == 0:
        return ''

    box_width = min(55, max(42, terminal_width // num_targets - 2))
    num_per_row = min(num_targets, max(1, (terminal_width) // (box_width + 2)))

    if num_per_row > num_targets:
        num_per_row = num_targets

    all_box_lines = []
    for stats in stats_list:
        all_box_lines.append(render_box_lines(stats, box_width))

    output_lines = []

    for row_start in range(0, num_targets, num_per_row):
        row_end = min(row_start + num_per_row, num_targets)
        row_boxes = all_box_lines[row_start:row_end]
        max_lines = max(len(box) for box in row_boxes)

        for line_idx in range(max_lines):
            row_line = ''
            for box in row_boxes:
                if line_idx < len(box):
                    row_line += box[line_idx]
                else:
                    row_line += ' ' * box_width
                row_line += '  '
            output_lines.append(row_line.rstrip())

    return '\n'.join(output_lines)


def clear_screen():
    print('\033[2J\033[H', end='')
    sys.stdout.flush()


def move_cursor_home():
    print('\033[H', end='')
    sys.stdout.flush()


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

    if sys.platform == 'win32':
        import os
        os.system('')

    clear_screen()
    print('Starting mpings...')
    print(f'Monitoring {len(args.targets)} target(s)')
    print('Press Ctrl+C to exit\n')
    time.sleep(1)

    stats_list: List[PingStats] = []
    stop_events: List[threading.Event] = []
    threads: List[threading.Thread] = []

    for target in args.targets:
        domain = extract_domain(target)
        stats = PingStats(target=domain, display_target=target)
        stats_list.append(stats)
        stop_event = threading.Event()
        stop_events.append(stop_event)

        thread = threading.Thread(target=ping_worker, args=(domain, stats, stop_event), daemon=True)
        thread.start()
        threads.append(thread)

    try:
        while True:
            clear_screen()

            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            num_targets = len(args.targets)
            print(f'mpings - {now} | Targets: {num_targets} | Press Ctrl+C to exit')
            print('=' * 80)
            print()

            try:
                terminal_width = shutil.get_terminal_size().columns
            except:
                terminal_width = 120

            output = render_all(stats_list, terminal_width)
            print(output)
            print()
            print('Stats update every 1 second...')

            time.sleep(1)

    except KeyboardInterrupt:
        print('\n\nStopping...')
        for stop_event in stop_events:
            stop_event.set()

        time.sleep(0.5)

        print('\nFinal Statistics:')
        print('=' * 80)
        for stats in stats_list:
            display_name = stats.display_target if stats.display_target else stats.target
            print(f'\n{display_name}:')
            print(f'  Domain: {stats.target}')
            print(f'  IP: {stats.ip}')
            print(f'  Last: {stats.last:.2f} ms' if stats.last > 0 else '  Last: N/A')
            print(f'  Avg: {stats.avg:.2f} ms' if stats.avg > 0 else '  Avg: N/A')
            print(f'  Min: {stats.min_ping:.2f} ms' if stats.min_ping != float('inf') else '  Min: N/A')
            print(f'  Max: {stats.max_ping:.2f} ms' if stats.max_ping > 0 else '  Max: N/A')
            print(f'  Loss: {stats.loss_percent:.1f}% ({stats.loss_count}/{stats.sent})')

        print('\nGoodbye!')


if __name__ == '__main__':
    main()
