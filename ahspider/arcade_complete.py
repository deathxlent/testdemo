import requests
from bs4 import BeautifulSoup
import time
import sys
import os
import json
from collections import Counter
from urllib.parse import urljoin

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

BASE_URL = "https://www.arcade-history.com"
FORM_URL = f"{BASE_URL}/index.php?page=database"

TARGET_TYPES = [
    "Arcade Video game",
    "Console (dedicated)",
    "UNIX soft.",
    "DEC PDP-10 soft.",
    "UNIVAC I soft.",
    "CDC 6600 soft.",
    "HP 2000 soft.",
    "Honeywell 6060 soft.",
    "BASIC soft. type-in",
    "PLATO soft.",
    "IBM System/360 soft.",
    "Burroughs Large Systems soft.",
    "Raytheon 704 soft.",
    "HP 3000 soft.",
    "DEC GT40 soft.",
    "Magnavox Odyssey card"
]

REQUEST_DELAY = 1
PROGRESS_DIR = "progress"

CLEAN_PATTERNS = [
    'ℹ️ Info',
    '✏️ Edit',
    '📤 Upload',
    'Edit',
    'Upload',
    'Info',
]


def get_session():
    session = requests.Session()
    session.headers.update(HEADERS)
    return session


def clean_text(text):
    if not text:
        return text
    
    lines = text.split('\n')
    cleaned_lines = []
    
    for line in lines:
        stripped_line = line.strip()
        if not stripped_line:
            continue
        
        should_skip = False
        for pattern in CLEAN_PATTERNS:
            if stripped_line == pattern or stripped_line.startswith(pattern):
                should_skip = True
                break
        
        if not should_skip:
            cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines)


def save_progress(year, data):
    if not os.path.exists(PROGRESS_DIR):
        os.makedirs(PROGRESS_DIR)
    
    progress_file = os.path.join(PROGRESS_DIR, f"{year}_progress.json")
    with open(progress_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_progress(year):
    progress_file = os.path.join(PROGRESS_DIR, f"{year}_progress.json")
    if not os.path.exists(progress_file):
        return None
    
    try:
        with open(progress_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"加载进度文件失败: {e}", file=sys.stderr)
        return None


def delete_progress(year):
    progress_file = os.path.join(PROGRESS_DIR, f"{year}_progress.json")
    if os.path.exists(progress_file):
        os.remove(progress_file)


def get_year_mapping(session):
    response = session.get(FORM_URL)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    year_select = soup.find('select', {'name': 'annee'})
    year_to_id = {}
    
    if year_select:
        options = year_select.find_all('option')
        for opt in options:
            year_text = opt.text.strip()
            year_id = opt.get('value', '')
            if year_text.isdigit():
                year_to_id[year_text] = year_id
    
    return year_to_id


def fetch_list_page(session, year_id, position=1):
    post_data = {
        'annee': year_id,
        'listtypes': '',
        'export': '1',
        'reissue': '1',
        'mamed': '1',
        'position': position
    }
    response = session.post(FORM_URL, data=post_data)
    response.raise_for_status()
    return BeautifulSoup(response.text, 'html.parser')


def parse_list_page(soup):
    all_games = []
    filtered_games = []
    table = soup.find('table')
    
    if not table:
        return all_games, filtered_games, 1
    
    rows = table.find_all('tr')[1:]
    
    for row in rows:
        cells = row.find_all('td')
        if len(cells) >= 4:
            game_type = cells[0].get_text(strip=True)
            title_link = cells[1].find('a')
            if title_link:
                title = title_link.get_text(strip=True)
                game_url = urljoin(BASE_URL, title_link.get('href', ''))
            else:
                title = cells[1].get_text(strip=True)
                game_url = ''
            
            publisher = cells[3].get_text(strip=True)
            
            game = {
                'type': game_type,
                'title': title,
                'publisher': publisher,
                'url': game_url,
                'cartouche_text': ''
            }
            
            all_games.append(game)
            
            if game_type in TARGET_TYPES:
                filtered_games.append(game)
    
    total_pages = get_total_pages(soup)
    return all_games, filtered_games, total_pages


def get_total_pages(soup):
    page_links = soup.find_all('a', href=lambda x: x and 'position=' in x)
    if page_links:
        try:
            last_page_text = page_links[-2].get_text(strip=True)
            last_page_text = last_page_text.replace('[', '').replace(']', '')
            return int(last_page_text)
        except (ValueError, IndexError):
            pass
    return 1


def fetch_detail_page(session, game_url, trytimes=0):
    if not game_url:
        return ''
    
    time.sleep(REQUEST_DELAY)
    try:
        response = session.get(game_url, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        cartouche_div = soup.find('div', class_='cartouche')
        if cartouche_div:
            text = cartouche_div.get_text(separator='\n', strip=True)
            return clean_text(text)
        return ''
    except Exception as e:
        print(f"获取详情页失败 {game_url}: {e}", file=sys.stderr)
        if trytimes < 2:
            trytimes += 1
            time.sleep(3)
            return fetch_detail_page(session, game_url, trytimes)
        return ''


def export_html(games, year):
    filename = f"{year}.html"
    html_content = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Arcade History - {year}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        h1 {{ color: #333; }}
        table {{ border-collapse: collapse; width: 100%; margin-top: 20px; }}
        th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; vertical-align: top; }}
        th {{ background-color: #4CAF50; color: white; }}
        tr:nth-child(even) {{ background-color: #f2f2f2; }}
        tr:hover {{ background-color: #ddd; }}
        a {{ color: #1a73e8; text-decoration: none; }}
        a:hover {{ text-decoration: underline; }}
        .cartouche-text {{ font-size: 0.9em; color: #666; white-space: pre-wrap; max-height: 200px; overflow-y: auto; }}
    </style>
</head>
<body>
    <h1>Arcade History - {year} 年游戏列表</h1>
    <p>共 {count} 条记录</p>
    <table>
        <thead>
            <tr>
                <th>Type</th>
                <th>Title</th>
                <th>Publisher</th>
                <th>URL</th>
                <th>Cartouche Text</th>
            </tr>
        </thead>
        <tbody>
""".format(year=year, count=len(games))
    
    for game in games:
        html_content += """            <tr>
                <td>{type}</td>
                <td>{title}</td>
                <td>{publisher}</td>
                <td><a href="{url}" target="_blank">Link</a></td>
                <td class="cartouche-text">{cartouche}</td>
            </tr>
""".format(
            type=game['type'],
            title=game['title'].replace('<', '&lt;').replace('>', '&gt;'),
            publisher=game['publisher'].replace('<', '&lt;').replace('>', '&gt;'),
            url=game['url'],
            cartouche=game['cartouche_text'].replace('<', '&lt;').replace('>', '&gt;')
        )
    
    html_content += """        </tbody>
    </table>
</body>
</html>
"""
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"HTML文件已导出: {filename}")


def export_txt(games, year):
    filename = f"{year}.txt"
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(f"Arcade History - {year} 年游戏列表\n")
        f.write(f"共 {len(games)} 条记录\n")
        f.write("=" * 80 + "\n\n")
        
        for i, game in enumerate(games, 1):
            f.write(f"[{i}] {game['title']}\n")
            f.write(f"    Type: {game['type']}\n")
            f.write(f"    Publisher: {game['publisher']}\n")
            f.write(f"    URL: {game['url']}\n")
            f.write(f"    Cartouche Text:\n")
            f.write(f"        {game['cartouche_text'].replace(chr(10), chr(10) + '        ')}\n")
            f.write("\n" + "-" * 80 + "\n\n")
    
    print(f"TXT文件已导出: {filename}")


def print_stats(type_counter, publisher_counter, year):
    print("\n" + "=" * 80)
    print(f"统计结果 - {year} 年")
    print("=" * 80)
    
    print("\n【按类型统计】")
    print("-" * 50)
    total_games = sum(type_counter.values())
    print(f"游戏总数: {total_games}")
    print()
    
    sorted_types = sorted(type_counter.items(), key=lambda x: x[1], reverse=True)
    max_type_count = max(type_counter.values()) if type_counter else 1
    for i, (game_type, count) in enumerate(sorted_types, 1):
        percentage = (count / total_games * 100) if total_games > 0 else 0
        bar = "█" * int(count / max_type_count * 30)
        print(f"{i:2d}. {game_type:<35} {count:5d}  ({percentage:5.1f}%) {bar}")
    
    print("\n" + "=" * 80)
    print("\n【按发行商统计】(前30名)")
    print("-" * 50)
    
    sorted_publishers = sorted(publisher_counter.items(), key=lambda x: x[1], reverse=True)
    max_pub_count = max(publisher_counter.values()) if publisher_counter else 1
    for i, (publisher, count) in enumerate(sorted_publishers[:30], 1):
        percentage = (count / total_games * 100) if total_games > 0 else 0
        bar = "█" * int(count / max_pub_count * 30)
        print(f"{i:2d}. {publisher:<45} {count:4d}  ({percentage:5.1f}%) {bar}")
    
    if len(sorted_publishers) > 30:
        print(f"\n... 还有 {len(sorted_publishers) - 30} 个发行商")
    
    print(f"\n发行商总数: {len(publisher_counter)}")
    print("=" * 80)


def export_stats_to_html(type_counter, publisher_counter, year):
    filename = f"{year}_stats.html"
    
    total_games = sum(type_counter.values())
    
    html_content = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>统计结果 - {year} 年</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        h1 {{ color: #333; text-align: center; }}
        h2 {{ color: #4CAF50; margin-top: 30px; }}
        .summary {{ background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }}
        table {{ border-collapse: collapse; width: 100%; margin-top: 10px; }}
        th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
        th {{ background-color: #4CAF50; color: white; }}
        tr:nth-child(even) {{ background-color: #f2f2f2; }}
        tr:hover {{ background-color: #ddd; }}
        .bar {{ background: #4CAF50; height: 20px; }}
        .bar-container {{ width: 200px; background: #eee; }}
        .num {{ text-align: center; }}
    </style>
</head>
<body>
    <h1>统计结果 - {year} 年</h1>
    
    <div class="summary">
        <strong>游戏总数:</strong> {total_games} &nbsp;&nbsp;&nbsp;
        <strong>发行商总数:</strong> {publisher_count}
    </div>
    
    <h2>按类型统计</h2>
    <table>
        <thead>
            <tr>
                <th>排名</th>
                <th>类型</th>
                <th>数量</th>
                <th>占比</th>
                <th>分布</th>
            </tr>
        </thead>
        <tbody>
""".format(year=year, total_games=total_games, publisher_count=len(publisher_counter))
    
    sorted_types = sorted(type_counter.items(), key=lambda x: x[1], reverse=True)
    max_type_count = max(type_counter.values()) if type_counter else 1
    for i, (game_type, count) in enumerate(sorted_types, 1):
        percentage = (count / total_games * 100) if total_games > 0 else 0
        bar_width = (count / max_type_count * 100) if max_type_count > 0 else 0
        html_content += """            <tr>
                <td class="num">{rank}</td>
                <td>{type}</td>
                <td class="num">{count}</td>
                <td class="num">{percentage:.1f}%</td>
                <td><div class="bar-container"><div class="bar" style="width:{bar_width}%"></div></div></td>
            </tr>
""".format(rank=i, type=game_type, count=count, percentage=percentage, bar_width=bar_width)
    
    html_content += """        </tbody>
    </table>
    
    <h2>按发行商统计</h2>
    <table>
        <thead>
            <tr>
                <th>排名</th>
                <th>发行商</th>
                <th>数量</th>
                <th>占比</th>
                <th>分布</th>
            </tr>
        </thead>
        <tbody>
"""
    
    sorted_publishers = sorted(publisher_counter.items(), key=lambda x: x[1], reverse=True)
    max_pub_count = max(publisher_counter.values()) if publisher_counter else 1
    for i, (publisher, count) in enumerate(sorted_publishers, 1):
        percentage = (count / total_games * 100) if total_games > 0 else 0
        bar_width = (count / max_pub_count * 100) if max_pub_count > 0 else 0
        html_content += """            <tr>
                <td class="num">{rank}</td>
                <td>{publisher}</td>
                <td class="num">{count}</td>
                <td class="num">{percentage:.1f}%</td>
                <td><div class="bar-container"><div class="bar" style="width:{bar_width}%"></div></div></td>
            </tr>
""".format(rank=i, publisher=publisher, count=count, percentage=percentage, bar_width=bar_width)
    
    html_content += """        </tbody>
    </table>
</body>
</html>
"""
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"统计HTML文件已导出: {filename}")


def main():
    print("=" * 60)
    print("Arcade History 完整爬虫程序")
    print("=" * 60)
    
    year = input("请输入要抓取的年份: ").strip()
    if not year.isdigit():
        print("错误: 年份必须是数字!")
        return
    
    session = get_session()
    
    print("\n正在获取年份映射...")
    year_mapping = get_year_mapping(session)
    
    if year not in year_mapping:
        print(f"错误: 未找到年份 {year}")
        print(f"可用年份范围: {min(year_mapping.keys())} - {max(year_mapping.keys())}")
        return
    
    year_id = year_mapping[year]
    print(f"年份 {year} 对应的ID: {year_id}")
    
    filtered_games = []
    type_counter = Counter()
    publisher_counter = Counter()
    completed_urls = set()
    start_position = 1
    
    existing_progress = load_progress(year)
    if existing_progress:
        print(f"\n发现未完成的抓取进度!")
        print(f"  - 已完成页数: {existing_progress.get('position', 0)}")
        print(f"  - 已抓取游戏数: {len(existing_progress.get('games', []))}")
        resume = input("是否继续抓取? (y/n): ").strip().lower()
        if resume == 'y' or resume == 'yes':
            filtered_games = existing_progress.get('games', [])
            start_position = existing_progress.get('position', 1) + 1
            completed_urls = set(existing_progress.get('completed_urls', []))
            
            for game in filtered_games:
                type_counter[game['type']] += 1
                publisher_counter[game['publisher']] += 1
            
            print(f"将从第 {start_position} 页继续抓取...")
        else:
            print("将重新开始抓取...")
            delete_progress(year)
    
    print(f"\n开始抓取 {year} 年的数据...")
    print(f"将从所有类型中筛选: {', '.join(TARGET_TYPES)}")
    print()
    
    position = start_position
    max_retries = 3
    retry_count = 0
    total_pages = None
    
    while True:
        print(f"第 {position} 页...", end='', flush=True)
        
        try:
            soup = fetch_list_page(session, year_id, position)
            all_games_page, filtered_games_page, total_pages = parse_list_page(soup)
            
            print(f" 本页共 {len(all_games_page)} 条, 符合条件 {len(filtered_games_page)} 条, 共 {total_pages} 页")
            
            page_games = []
            for game in filtered_games_page:
                if game['url'] and game['url'] not in completed_urls:
                    cartouche_text = fetch_detail_page(session, game['url'])
                    game['cartouche_text'] = cartouche_text
                    completed_urls.add(game['url'])
                elif game['url'] in completed_urls:
                    print(f"    跳过已抓取: {game['title']}")
                
                type_counter[game['type']] += 1
                publisher_counter[game['publisher']] += 1
                page_games.append(game)
            
            filtered_games.extend(page_games)
            
            progress_data = {
                'year': year,
                'position': position,
                'total_pages': total_pages,
                'games': filtered_games,
                'completed_urls': list(completed_urls),
                'type_counter': dict(type_counter),
                'publisher_counter': dict(publisher_counter)
            }
            save_progress(year, progress_data)
            
            retry_count = 0
            
            if position >= total_pages:
                break
            
            position += 1
            time.sleep(REQUEST_DELAY)
            
        except Exception as e:
            print(f" 错误: {e}")
            retry_count += 1
            if retry_count >= max_retries:
                print(f"第 {position} 页重试 {max_retries} 次仍失败，已保存进度")
                print(f"下次运行时可选择继续抓取")
                break
            print(f"将在 5 秒后重试 ({retry_count}/{max_retries})...")
            time.sleep(5)
    
    print("\n" + "=" * 60)
    print(f"抓取完成! 共获取 {len(filtered_games)} 条符合条件的记录")
    print("=" * 60)
    
    if filtered_games:
        export_txt(filtered_games, year)
        print_stats(type_counter, publisher_counter, year)
        export_stats_to_html(type_counter, publisher_counter, year)
        delete_progress(year)
        print("进度文件已清理")
    else:
        print("未找到任何符合条件的数据")


if __name__ == "__main__":
    main()
