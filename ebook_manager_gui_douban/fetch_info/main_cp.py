# This is a sample Python script.

# Press ⌃R to execute it or replace it with your code.
# Press Double ⇧ to search everywhere for classes, files, tool windows, actions, and settings.

import time

from book.NewDouban import NewDouban


def gogogo():
    douban = NewDouban()
    s = """艺术小史_从史前岩画到当代艺术 - [英] 夏洛特·马林斯 & 黄格勉.epub
税的荒唐与智慧_历史上的税收故事 - [美] 迈克尔·基恩 & [美] 乔尔·斯莱姆罗德 & 薛凯欣 & 余江.epub
西班牙内战_秩序崩溃与激荡的世界格局 _ 1936-1939（全2册） - [英] 休·托马斯 & 郭建龙 & 李相程 & 朱莹琳.epub
大象的踪迹 - [美] 奈杰尔·罗斯菲尔斯 & 陈珏.epub
天文学家的椅子_19世纪的科学、设计与视觉文化 - [加] 奥马尔·纳西姆 & 高旭东.epub
普朗克传_正直者的困境 - [德] J.l.海耳布朗 & 刘兵.epub
贪婪的代谢 - [美] 萨姆·艾普尔 & 孙亚南.epub
"""
    ss = s.split('\n')
    for name in ss:
        name = name[:name.rfind(".")]
        if "(" in name and ")" in name:
            left = name.index("(")
            if left > -1:
                right = name.rfind(")") + 1
                name = name.replace(name[left:right], '')
        if "（" in name and "）" in name:
            left = name.index("（")
            if left > -1:
                right = name.rfind("）") + 1
                name = name.replace(name[left: right], '')
        if "【" in name and "】" in name:
            left = name.index("【")
            if left > -1:
                right = name.rfind("】") + 1
                name = name.replace(name[left: right], '')
        if "[" in name and "]" in name:
            left = name.index("[")
            if left > -1:
                right = name.rfind("]") + 1
                name = name.replace(name[left: right], '')
        if "《" in name and "》" in name:
            left = name.index("《")
            if left > -1:
                right = name.rfind("》") + 1
                name = name.replace(name[left: right], '')
        result = douban.search(name)
        if len(result) < 1:
            time.sleep(4.313)
            if ":" in name:
                name = name[0:name.index(":")]
                result = douban.search(name)
            elif "：" in name:
                name = name[0:name.index("：")]
                result = douban.search(name)
            else:
                name = name[0:name.rfind("-")]
                result = douban.search(name)
        for book in result:
            summary = book.description.replace('<div class="intro">', '').replace('</div>',
                                                                                  '').replace(
                '<p>', '').replace('</p>', '\n').replace('"', "'")
            isbn = ''
            if "isbn" in book.identifiers:
                isbn = book.identifiers["isbn"]
            tags = "、".join(book.tags).replace("'", '"')
            authors = "、".join(book.authors).replace("'", '')
            title = book.title.replace("'", ' ')
            print(f'{book.rating * 2}\t"{summary}"\t"{title}"\t"{authors}"\t"{isbn}"\t"{book.url}"\t"{tags}"')
        time.sleep(5.513)


# Press the green button in the gutter to run the script.
if __name__ == '__main__':
    gogogo()
