import csv
import json
import os
import re
from collections import defaultdict, Counter
from datetime import datetime

EXCHANGE_RATES = {
    'EUR': 1.0,
    'USD': 0.92,
    'GBP': 1.17,
    'RUB': 0.010,
    'MXN': 0.054,
    'BRL': 0.18,
    'ARS': 0.00095,
    'CLP': 0.0010,
    'COP': 0.00023,
    'PEN': 0.24,
    'CAD': 0.68,
    'AUD': 0.60,
    'NZD': 0.55,
    'JPY': 0.0061,
    'KRW': 0.00068,
    'CNY': 0.13,
    'HKD': 0.118,
    'TWD': 0.029,
    'SGD': 0.69,
    'THB': 0.026,
    'IDR': 0.000059,
    'MYR': 0.20,
    'PHP': 0.016,
    'INR': 0.011,
    'TRY': 0.028,
    'PLN': 0.23,
    'CZK': 0.040,
    'HUF': 0.0026,
    'RON': 0.20,
    'BGN': 0.51,
    'UAH': 0.024,
    'KZT': 0.0019,
    'BYN': 0.29,
    'NOK': 0.088,
    'SEK': 0.088,
    'DKK': 0.134,
    'CHF': 1.05,
    'ILS': 0.24,
    'AED': 0.25,
    'SAR': 0.245,
    'QAR': 0.253,
    'EGP': 0.018,
    'ZAR': 0.050,
    'NAD': 0.050,
    'KES': 0.0068,
    'NGN': 0.00059,
    'GHS': 0.077,
    'UGX': 0.00024,
    'TZS': 0.00036,
}

def convert_to_euro(amount, currency):
    if not amount or not currency:
        return None
    rate = EXCHANGE_RATES.get(currency.upper(), 0)
    if rate == 0:
        return None
    return (amount / 100.0) * rate

def parse_price(price_str):
    if not price_str or price_str == '\\N':
        return None
    try:
        price_data = json.loads(price_str)
        return convert_to_euro(price_data.get('final'), price_data.get('currency'))
    except (json.JSONDecodeError, TypeError):
        return None

def clean_language(lang):
    lang = re.sub(r'<[^>]+>', '', lang)
    lang = lang.strip()
    lang_mapping = {
        'English': 'English',
        'Englisch': 'English',
        'английский': 'English',
        'Angielski': 'English',
        'French': 'French',
        'Französisch': 'French',
        'французский': 'French',
        'Francuski': 'French',
        'German': 'German',
        'Deutsch': 'German',
        'немецкий': 'German',
        'Niemiecki': 'German',
        'Italian': 'Italian',
        'Italienisch': 'Italian',
        'итальянский': 'Italian',
        'Włoski': 'Italian',
        'Spanish - Spain': 'Spanish',
        'Spanish': 'Spanish',
        'Spanisch': 'Spanish',
        'испанский': 'Spanish',
        'Hiszpański': 'Spanish',
        'Simplified Chinese': 'Chinese (Simplified)',
        'Chinese (Simplified)': 'Chinese (Simplified)',
        'китайский (упр.)': 'Chinese (Simplified)',
        'Chiński uproszczony': 'Chinese (Simplified)',
        'Traditional Chinese': 'Chinese (Traditional)',
        'Chinese (Traditional)': 'Chinese (Traditional)',
        'китайский (трад.)': 'Chinese (Traditional)',
        'Chiński tradycyjny': 'Chinese (Traditional)',
        'Korean': 'Korean',
        'Koreanisch': 'Korean',
        'корейский': 'Korean',
        'Koreański': 'Korean',
        'Russian': 'Russian',
        'Russisch': 'Russian',
        'русский': 'Russian',
        'Rosyjski': 'Russian',
        'Japanese': 'Japanese',
        'Japanisch': 'Japanese',
        'японский': 'Japanese',
        'Japoński': 'Japanese',
        'Dutch': 'Dutch',
        'Niederländisch': 'Dutch',
        'нидерландский': 'Dutch',
        'Holenderski': 'Dutch',
        'Danish': 'Danish',
        'Dänisch': 'Danish',
        'датский': 'Danish',
        'Duński': 'Danish',
        'Finnish': 'Finnish',
        'Finnisch': 'Finnish',
        'финский': 'Finnish',
        'Fiński': 'Finnish',
        'Norwegian': 'Norwegian',
        'Norwegisch': 'Norwegian',
        'норвежский': 'Norwegian',
        'Norweski': 'Norwegian',
        'Swedish': 'Swedish',
        'Schwedisch': 'Swedish',
        'шведский': 'Swedish',
        'Szwedzki': 'Swedish',
        'Polish': 'Polish',
        'Polnisch': 'Polish',
        'польский': 'Polish',
        'Polski': 'Polish',
        'Portuguese - Portugal': 'Portuguese',
        'Portuguese': 'Portuguese',
        'Portugiesisch': 'Portuguese',
        'португальский': 'Portuguese',
        'Portugalski': 'Portuguese',
        'Portuguese - Brazil': 'Portuguese (Brazil)',
        'Portuguese Brazil': 'Portuguese (Brazil)',
        'бр. португальский': 'Portuguese (Brazil)',
        'Portugalski brazylijski': 'Portuguese (Brazil)',
        'Turkish': 'Turkish',
        'Türkisch': 'Turkish',
        'турецкий': 'Turkish',
        'Turecki': 'Turkish',
        'Czech': 'Czech',
        'Tschechisch': 'Czech',
        'чешский': 'Czech',
        'Czeski': 'Czech',
        'Hungarian': 'Hungarian',
        'Ungarisch': 'Hungarian',
        'венгерский': 'Hungarian',
        'Węgierski': 'Hungarian',
        'Greek': 'Greek',
        'Griechisch': 'Greek',
        'греческий': 'Greek',
        'Grecki': 'Greek',
        'Thai': 'Thai',
        'Thailändisch': 'Thai',
        'тайский': 'Thai',
        'Tajski': 'Thai',
        'Bulgarian': 'Bulgarian',
        'Bulgarisch': 'Bulgarian',
        'болгарский': 'Bulgarian',
        'Bułgarski': 'Bulgarian',
        'Romanian': 'Romanian',
        'Rumänisch': 'Romanian',
        'румынский': 'Romanian',
        'Rumuński': 'Romanian',
        'Ukrainian': 'Ukrainian',
        'Ukrainisch': 'Ukrainian',
        'украинский': 'Ukrainian',
        'Ukraiński': 'Ukrainian',
        'Vietnamese': 'Vietnamese',
        'Vietnamesisch': 'Vietnamese',
        'вьетнамский': 'Vietnamese',
        'Wietnamski': 'Vietnamese',
        'Spanish - Latin America': 'Spanish (Latin America)',
        'Spanish Latin America': 'Spanish (Latin America)',
        'испанский (латиноам.)': 'Spanish (Latin America)',
        'Hiszpański latynoamerykański': 'Spanish (Latin America)',
        'Indonesian': 'Indonesian',
        'Indonesisch': 'Indonesian',
        'индонезийский': 'Indonesian',
        'Indonezyjski': 'Indonesian',
    }
    return lang_mapping.get(lang, lang)

def parse_languages(languages_str):
    if not languages_str or languages_str == '\\N':
        return []
    langs = re.split(r'[,\，]', languages_str)
    cleaned_langs = []
    for lang in langs:
        cleaned = clean_language(lang)
        if cleaned and cleaned not in cleaned_langs:
            cleaned_langs.append(cleaned)
    return cleaned_langs

def get_price_range(euro_price):
    if euro_price is None:
        return None
    if euro_price == 0:
        return '0€'
    range_index = int(euro_price // 50)
    lower = range_index * 50
    upper = lower + 50
    return f'{lower}-{upper}€'

def parse_date(date_str):
    if not date_str or date_str == '\\N':
        return None
    try:
        return datetime.strptime(date_str, '%Y-%m-%d')
    except ValueError:
        return None

def load_data(csv_path):
    games = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            release_date = parse_date(row['release_date'])
            if release_date is None:
                continue
            price_euro = parse_price(row['price_overview'])
            is_free = row['is_free'] == '1'
            if is_free:
                price_euro = 0.0
            elif price_euro is None:
                price_euro = 0.0
            languages = parse_languages(row['languages'])
            game = {
                'app_id': row['app_id'],
                'name': row['name'],
                'release_date': release_date,
                'year': release_date.year,
                'is_free': is_free,
                'price_euro': price_euro,
                'languages': languages,
                'type': row['type'] if row['type'] and row['type'] != '\\N' else 'unknown'
            }
            games.append(game)
    return games

def aggregate_by_year(games):
    yearly_data = defaultdict(lambda: {
        'games': [],
        'free_count': 0,
        'paid_count': 0,
        'type_counts': Counter(),
        'price_ranges': Counter(),
        'monthly_total': defaultdict(float),
        'monthly_count': defaultdict(int),
        'language_counts': Counter(),
        'lang_support_counts': Counter(),
        'total_amount': 0.0,
    })
    
    for game in games:
        year = game['year']
        yd = yearly_data[year]
        yd['games'].append(game)
        
        if game['is_free']:
            yd['free_count'] += 1
        else:
            yd['paid_count'] += 1
        
        yd['type_counts'][game['type']] += 1
        
        price_range = get_price_range(game['price_euro'])
        if price_range:
            yd['price_ranges'][price_range] += 1
        
        month_key = game['release_date'].strftime('%Y-%m')
        yd['monthly_total'][month_key] += game['price_euro']
        yd['monthly_count'][month_key] += 1
        
        for lang in game['languages']:
            yd['language_counts'][lang] += 1
        
        lang_count = len(game['languages'])
        yd['lang_support_counts'][lang_count] += 1
        
        yd['total_amount'] += game['price_euro']
    
    return yearly_data

COLORS = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FF6384', '#C9CBCF', '#7BC225', '#E7E9ED',
    '#D4A5A5', '#A8D8EA', '#AA96DA', '#FCBAD3', '#FFFFD2',
    '#88D8B0', '#FFE98A', '#FF6F69', '#4ECDC4', '#C7F464',
]

def generate_pie_chart(labels, values, title, chart_id):
    colors = COLORS[:len(labels)]
    return f'''
    <div class="chart-container">
        <h3>{title}</h3>
        <canvas id="{chart_id}"></canvas>
    </div>
    <script>
        new Chart(document.getElementById('{chart_id}'), {{
            type: 'pie',
            data: {{
                labels: {json.dumps(labels, ensure_ascii=False)},
                datasets: [{{
                    data: {json.dumps(values)},
                    backgroundColor: {json.dumps(colors)},
                    borderWidth: 2,
                    borderColor: '#fff'
                }}]
            }},
            options: {{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {{
                    legend: {{
                        position: 'right',
                        labels: {{
                            padding: 15,
                            font: {{ size: 12 }}
                        }}
                    }}
                }}
            }}
        }});
    </script>
    '''

def generate_bar_chart(labels, values, title, chart_id, x_label='', y_label=''):
    colors = COLORS[:len(labels)]
    return f'''
    <div class="chart-container">
        <h3>{title}</h3>
        <canvas id="{chart_id}"></canvas>
    </div>
    <script>
        new Chart(document.getElementById('{chart_id}'), {{
            type: 'bar',
            data: {{
                labels: {json.dumps(labels, ensure_ascii=False)},
                datasets: [{{
                    label: '{y_label}',
                    data: {json.dumps(values)},
                    backgroundColor: {json.dumps(colors)},
                    borderWidth: 1,
                    borderColor: '#333'
                }}]
            }},
            options: {{
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'y',
                plugins: {{
                    legend: {{ display: false }}
                }},
                scales: {{
                    x: {{
                        beginAtZero: true,
                        title: {{ display: true, text: '{x_label}' }}
                    }},
                    y: {{
                        title: {{ display: true, text: '{y_label}' }}
                    }}
                }}
            }}
        }});
    </script>
    '''

def generate_line_chart(labels, values, title, chart_id, x_label='', y_label=''):
    return f'''
    <div class="chart-container">
        <h3>{title}</h3>
        <canvas id="{chart_id}"></canvas>
    </div>
    <script>
        new Chart(document.getElementById('{chart_id}'), {{
            type: 'line',
            data: {{
                labels: {json.dumps(labels, ensure_ascii=False)},
                datasets: [{{
                    label: '{y_label}',
                    data: {json.dumps(values)},
                    borderColor: '#36A2EB',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }}]
            }},
            options: {{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {{
                    legend: {{ display: false }}
                }},
                scales: {{
                    x: {{
                        title: {{ display: true, text: '{x_label}' }}
                    }},
                    y: {{
                        beginAtZero: true,
                        title: {{ display: true, text: '{y_label}' }}
                    }}
                }}
            }}
        }});
    </script>
    '''

def generate_year_html(year, data, output_dir):
    sorted_months = sorted(data['monthly_total'].keys())
    monthly_amounts = [round(data['monthly_total'][m], 2) for m in sorted_months]
    
    type_items = sorted(data['type_counts'].items(), key=lambda x: -x[1])
    type_labels = [t[0] for t in type_items]
    type_values = [t[1] for t in type_items]
    
    price_ranges_order = []
    for i in range(0, 21):
        lower = i * 50
        upper = lower + 50
        key = f'{lower}-{upper}€'
        if key in data['price_ranges']:
            price_ranges_order.append(key)
    if '0€' in data['price_ranges'] and '0€' not in price_ranges_order:
        price_ranges_order.insert(0, '0€')
    
    price_range_labels = price_ranges_order
    price_range_values = [data['price_ranges'].get(k, 0) for k in price_ranges_order]
    
    lang_items = data['language_counts'].most_common(20)
    lang_labels = [l[0] for l in lang_items]
    lang_values = [l[1] for l in lang_items]
    
    lang_support_items = sorted(data['lang_support_counts'].items(), key=lambda x: x[0])
    lang_support_labels = [f'{l[0]} 种语言' if l[0] != 0 else '无语言信息' for l in lang_support_items]
    lang_support_values = [l[1] for l in lang_support_items]
    
    total_games = data['free_count'] + data['paid_count']
    
    html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Steam 游戏统计 - {year}年</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #e0e0e0;
            min-height: 100vh;
            padding: 20px;
        }}
        .container {{
            max-width: 1400px;
            margin: 0 auto;
        }}
        header {{
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }}
        h1 {{
            font-size: 2.5em;
            color: #4ECDC4;
            margin-bottom: 10px;
            text-shadow: 0 0 20px rgba(78, 205, 196, 0.3);
        }}
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }}
        .stat-card {{
            background: rgba(255, 255, 255, 0.08);
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: transform 0.3s, box-shadow 0.3s;
        }}
        .stat-card:hover {{
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(78, 205, 196, 0.2);
            border-color: rgba(78, 205, 196, 0.3);
        }}
        .stat-card h3 {{
            font-size: 0.9em;
            color: #aaa;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        .stat-card .value {{
            font-size: 2em;
            font-weight: bold;
            color: #4ECDC4;
        }}
        .charts-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 30px;
        }}
        .chart-container {{
            background: rgba(255, 255, 255, 0.05);
            padding: 25px;
            border-radius: 15px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }}
        .chart-container h3 {{
            text-align: center;
            margin-bottom: 20px;
            color: #FFCE56;
            font-size: 1.2em;
        }}
        canvas {{
            max-height: 400px !important;
        }}
        .back-link {{
            display: inline-block;
            margin-bottom: 20px;
            padding: 12px 25px;
            background: linear-gradient(135deg, #4ECDC4, #44a08d);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            transition: transform 0.3s, box-shadow 0.3s;
        }}
        .back-link:hover {{
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(78, 205, 196, 0.4);
        }}
        @media (max-width: 768px) {{
            .charts-grid {{
                grid-template-columns: 1fr;
            }}
            h1 {{
                font-size: 1.8em;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <a href="index.html" class="back-link">← 返回总览</a>
        <header>
            <h1>🎮 Steam 游戏统计 - {year}年</h1>
        </header>
        
        <div class="stats-grid">
            <div class="stat-card">
                <h3>游戏总数</h3>
                <div class="value">{total_games}</div>
            </div>
            <div class="stat-card">
                <h3>免费游戏</h3>
                <div class="value">{data['free_count']}</div>
            </div>
            <div class="stat-card">
                <h3>收费游戏</h3>
                <div class="value">{data['paid_count']}</div>
            </div>
            <div class="stat-card">
                <h3>总价值 (€)</h3>
                <div class="value">{round(data['total_amount'], 2)}</div>
            </div>
        </div>
        
        <div class="charts-grid">
            {generate_pie_chart(['免费', '收费'], [data['free_count'], data['paid_count']], '免费 vs 收费游戏占比', 'chart-free-paid')}
            {generate_pie_chart(type_labels, type_values, '游戏类型分布', 'chart-types')}
            {generate_bar_chart(price_range_labels, price_range_values, '价格区间分布 (€50为单位)', 'chart-price-ranges', '游戏数量', '价格区间')}
            {generate_line_chart(sorted_months, monthly_amounts, '月度金额变化趋势', 'chart-monthly', '月份', '总金额 (€)')}
            {generate_bar_chart(lang_labels, lang_values, '各语言支持占比 (Top 20)', 'chart-langs', '游戏数量', '语言')}
            {generate_bar_chart(lang_support_labels, lang_support_values, '支持语言种类分布', 'chart-lang-support', '游戏数量', '支持语言数')}
        </div>
    </div>
</body>
</html>
    '''
    
    output_path = os.path.join(output_dir, f'stats_{year}.html')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
    return output_path

def generate_index_html(yearly_data, output_dir):
    years = sorted(yearly_data.keys(), reverse=True)
    
    year_cards = ''
    for year in years:
        data = yearly_data[year]
        total_games = data['free_count'] + data['paid_count']
        year_cards += f'''
        <a href="stats_{year}.html" class="year-card">
            <div class="year-header">
                <span class="year">{year}</span>
                <span class="arrow">→</span>
            </div>
            <div class="year-stats">
                <div class="year-stat">
                    <span class="year-stat-label">游戏数</span>
                    <span class="year-stat-value">{total_games}</span>
                </div>
                <div class="year-stat">
                    <span class="year-stat-label">免费</span>
                    <span class="year-stat-value">{data['free_count']}</span>
                </div>
                <div class="year-stat">
                    <span class="year-stat-label">收费</span>
                    <span class="year-stat-value">{data['paid_count']}</span>
                </div>
                <div class="year-stat">
                    <span class="year-stat-label">总价值</span>
                    <span class="year-stat-value">€{round(data['total_amount'], 0)}</span>
                </div>
            </div>
        </a>
        '''
    
    all_games_count = sum(d['free_count'] + d['paid_count'] for d in yearly_data.values())
    all_free_count = sum(d['free_count'] for d in yearly_data.values())
    all_paid_count = sum(d['paid_count'] for d in yearly_data.values())
    all_total_amount = sum(d['total_amount'] for d in yearly_data.values())
    
    html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Steam 游戏统计总览</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            color: #e0e0e0;
            min-height: 100vh;
            padding: 20px;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}
        header {{
            text-align: center;
            margin-bottom: 50px;
            padding: 40px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }}
        h1 {{
            font-size: 3em;
            color: #4ECDC4;
            margin-bottom: 15px;
            text-shadow: 0 0 30px rgba(78, 205, 196, 0.4);
        }}
        .subtitle {{
            font-size: 1.2em;
            color: #aaa;
        }}
        .overview-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 25px;
            margin-bottom: 50px;
        }}
        .overview-card {{
            background: linear-gradient(135deg, rgba(78, 205, 196, 0.1), rgba(68, 160, 141, 0.1));
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            border: 1px solid rgba(78, 205, 196, 0.2);
            transition: transform 0.3s;
        }}
        .overview-card:hover {{
            transform: translateY(-5px);
        }}
        .overview-card h3 {{
            font-size: 0.95em;
            color: #aaa;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }}
        .overview-card .value {{
            font-size: 2.5em;
            font-weight: bold;
            color: #4ECDC4;
        }}
        h2 {{
            text-align: center;
            color: #FFCE56;
            margin-bottom: 30px;
            font-size: 1.8em;
        }}
        .years-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 25px;
        }}
        .year-card {{
            display: block;
            background: rgba(255, 255, 255, 0.05);
            padding: 25px;
            border-radius: 15px;
            text-decoration: none;
            color: inherit;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
        }}
        .year-card:hover {{
            transform: translateY(-8px) scale(1.02);
            background: rgba(78, 205, 196, 0.1);
            border-color: rgba(78, 205, 196, 0.4);
            box-shadow: 0 15px 40px rgba(78, 205, 196, 0.2);
        }}
        .year-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }}
        .year {{
            font-size: 2em;
            font-weight: bold;
            color: #4ECDC4;
        }}
        .arrow {{
            font-size: 1.5em;
            color: #FFCE56;
            transition: transform 0.3s;
        }}
        .year-card:hover .arrow {{
            transform: translateX(5px);
        }}
        .year-stats {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }}
        .year-stat {{
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 10px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
        }}
        .year-stat-label {{
            font-size: 0.8em;
            color: #888;
            margin-bottom: 5px;
        }}
        .year-stat-value {{
            font-size: 1.3em;
            font-weight: bold;
            color: #e0e0e0;
        }}
        @media (max-width: 768px) {{
            h1 {{
                font-size: 2em;
            }}
            .years-grid {{
                grid-template-columns: 1fr;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🎮 Steam 游戏统计总览</h1>
            <p class="subtitle">按年份浏览游戏数据统计与可视化分析</p>
        </header>
        
        <div class="overview-grid">
            <div class="overview-card">
                <h3>统计年份</h3>
                <div class="value">{len(years)}</div>
            </div>
            <div class="overview-card">
                <h3>游戏总数</h3>
                <div class="value">{all_games_count}</div>
            </div>
            <div class="overview-card">
                <h3>免费游戏</h3>
                <div class="value">{all_free_count}</div>
            </div>
            <div class="overview-card">
                <h3>收费游戏</h3>
                <div class="value">{all_paid_count}</div>
            </div>
            <div class="overview-card">
                <h3>总价值 (€)</h3>
                <div class="value">{round(all_total_amount, 2)}</div>
            </div>
            <div class="overview-card">
                <h3>时间跨度</h3>
                <div class="value">{min(years)}-{max(years)}</div>
            </div>
        </div>
        
        <h2>📅 按年份浏览</h2>
        <div class="years-grid">
            {year_cards}
        </div>
    </div>
</body>
</html>
    '''
    
    output_path = os.path.join(output_dir, 'index.html')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
    return output_path

def main():
    csv_path = 'games.csv'
    output_dir = 'stats'
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    print('正在加载数据...')
    games = load_data(csv_path)
    print(f'已加载 {len(games)} 条游戏数据')
    
    print('正在按年份聚合数据...')
    yearly_data = aggregate_by_year(games)
    
    years = sorted(yearly_data.keys())
    print(f'统计年份: {min(years)} - {max(years)}')
    
    print('正在生成各年份统计页面...')
    for year in years:
        path = generate_year_html(year, yearly_data[year], output_dir)
        print(f'  已生成: {path}')
    
    print('正在生成总索引页面...')
    index_path = generate_index_html(yearly_data, output_dir)
    print(f'  已生成: {index_path}')
    
    print(f'\n完成！所有页面已生成在 {os.path.abspath(output_dir)} 目录中')
    print(f'请打开 {os.path.abspath(index_path)} 开始浏览')

if __name__ == '__main__':
    main()
