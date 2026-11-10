"""Build the team guide from the repository's Russian Markdown instructions.

Run from any folder: python scripts/build_team_pdf.py
Install scripts/requirements-docs.txt first. Fonts: Windows Arial/Consolas or Linux DejaVu.
This script is documentation tooling, not part of the application runtime.
"""

from __future__ import annotations

import html
import re
import textwrap
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    LongTable,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output/pdf/rzt-team-guide.pdf"
NAVY = colors.HexColor("#18293D")
TEAL = colors.HexColor("#007E83")
LIGHT = colors.HexColor("#EDF4F6")
GREY = colors.HexColor("#5D6F80")
WIDTH = A4[0] - 40 * mm


def register_fonts() -> None:
    """Embed readable Cyrillic fonts without copying system fonts into the repository."""
    choices = [
        (Path("C:/Windows/Fonts"), "arial.ttf", "arialbd.ttf", "consola.ttf"),
        (Path("/usr/share/fonts/truetype/dejavu"), "DejaVuSans.ttf", "DejaVuSans-Bold.ttf", "DejaVuSansMono.ttf"),
    ]
    for folder, regular, bold, mono in choices:
        if all((folder / name).exists() for name in (regular, bold, mono)):
            for family, name in (("Body", regular), ("BodyBold", bold), ("Mono", mono)):
                pdfmetrics.registerFont(TTFont(family, str(folder / name)))
            pdfmetrics.registerFontFamily("Body", normal="Body", bold="BodyBold", italic="Body", boldItalic="BodyBold")
            return
    raise RuntimeError("Install Arial/Consolas on Windows or fonts-dejavu-core on Linux.")


def normalized(value: str) -> str:
    """Use consistent printable punctuation in the export."""
    return value.replace("\u2011", "-").replace("\u2013", "-").replace("\u2014", "-").replace("\u00a0", " ")


def inline(value: str) -> str:
    """Render only the inline Markdown features used by our own documentation."""
    value = html.escape(normalized(value))
    value = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", lambda match: (
        f'<link href="{match[2]}" color="#007E83">{match[1]}</link>'
        if match[2].startswith("https://") else match[1]
    ), value)
    value = re.sub(r"`([^`]+)`", r'<font name="Mono" size="8.6">\1</font>', value)
    return re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", value)


def styles():
    """Keep typography centralized so the guide can be regenerated consistently."""
    result = getSampleStyleSheet()
    result.add(ParagraphStyle("Text", fontName="Body", fontSize=10, leading=14.3, textColor=NAVY, spaceAfter=6, allowWidows=0, allowOrphans=0))
    result.add(ParagraphStyle("Section", parent=result["Text"], fontName="BodyBold", fontSize=23, leading=28, spaceAfter=15, keepWithNext=True))
    result.add(ParagraphStyle("Sub", parent=result["Text"], fontName="BodyBold", fontSize=13.2, leading=17, spaceBefore=12, spaceAfter=7, keepWithNext=True))
    result.add(ParagraphStyle("Func", parent=result["Text"], fontName="BodyBold", fontSize=10.3, leading=14.4, spaceBefore=9, keepWithNext=True, wordWrap="CJK"))
    result.add(ParagraphStyle("Cell", parent=result["Text"], fontSize=8.2, leading=11.5, spaceAfter=0, wordWrap="CJK"))
    result.add(ParagraphStyle("CellHead", parent=result["Cell"], fontName="BodyBold", textColor=colors.white))
    result.add(ParagraphStyle("GuideCode", fontName="Mono", fontSize=7.3, leading=10.5, backColor=LIGHT, borderPadding=7, spaceBefore=5, spaceAfter=9))
    result.add(ParagraphStyle("Small", parent=result["Text"], fontSize=8.4, leading=12, textColor=GREY))
    result.add(ParagraphStyle("BulletText", parent=result["Text"], leftIndent=11, firstLineIndent=-9))
    result.add(ParagraphStyle("Cover", parent=result["Section"], fontSize=36, leading=41, spaceAfter=22))
    return result


class Guide(SimpleDocTemplate):
    """Collect section titles for a clickable table of contents."""

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and hasattr(flowable, "section_key"):
            title = flowable.getPlainText()
            self.canv.bookmarkPage(flowable.section_key)
            self.canv.addOutlineEntry(title, flowable.section_key, level=0)
            self.notify("TOCEntry", (0, title, self.page, flowable.section_key))


def page_frame(canvas, document) -> None:
    """Draw fixed headers and footers outside the content frame."""
    canvas.saveState()
    canvas.setFillColor(TEAL)
    canvas.rect(0, A4[1] - 3 * mm, A4[0], 3 * mm, fill=1, stroke=0)
    canvas.setFont("BodyBold", 8)
    canvas.setFillColor(GREY)
    canvas.drawString(20 * mm, A4[1] - 15 * mm, "RZT / ПЛАН КОМАНДЫ / 09.11.2026")
    canvas.setStrokeColor(colors.HexColor("#D7E3E9"))
    canvas.line(20 * mm, 17 * mm, A4[0] - 20 * mm, 17 * mm)
    canvas.setFont("Body", 8)
    canvas.drawString(20 * mm, 12 * mm, "Каркас 0.0.0  |  Цель: ручной lyrics-video v0.0.1")
    canvas.drawRightString(A4[0] - 20 * mm, 12 * mm, str(document.page))
    canvas.restoreState()


def table(rows: list[list[str]], style, source: str):
    """Wrap every table cell and repeat the header on subsequent pages."""
    count = len(rows[0])
    weights = {2: [0.30, 0.70], 3: [0.22, 0.49, 0.29], 4: [0.16, 0.21, 0.42, 0.21], 5: [0.10, 0.19, 0.32, 0.22, 0.17]}.get(count, [1 / count] * count)
    if source == "api.md":
        weights = [0.45, 0.40, 0.15]
    elif source == "team.md" and count == 4:
        weights = [0.08, 0.25, 0.42, 0.25]
    elif source == "backlog.md":
        weights = [0.14, 0.18, 0.50, 0.18]
    padding = 4 if source in {"backlog.md", "api.md"} else 6
    data = [[Paragraph(inline(cell), style["CellHead" if i == 0 else "Cell"]) for cell in row] for i, row in enumerate(rows)]
    result = LongTable(data, colWidths=[WIDTH * weight for weight in weights], repeatRows=1, hAlign="LEFT")
    result.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT, colors.white]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), padding),
        ("BOTTOMPADDING", (0, 0), (-1, -1), padding),
        ("LINEBELOW", (0, 0), (-1, -1), 0.35, colors.HexColor("#D7E3E9")),
    ]))
    return [result, Spacer(1, 8)]


def markdown(path: Path, style, section_number: int):
    """Convert the repository's simple Markdown blocks to splittable PDF flowables."""
    if path.name in {"start-here.md", "api.md", "backlog.md"}:
        style = styles()
        for key in ("Text", "BulletText"):
            style[key].fontSize = 9.4
            style[key].leading = 13
            style[key].spaceAfter = 4
        style["Sub"].fontSize = 12
        style["Sub"].leading = 15
        style["Sub"].spaceBefore = 8
        style["Sub"].spaceAfter = 5
        if path.name == "backlog.md":
            for key in ("Cell", "CellHead"):
                style[key].fontSize = 7.8
                style[key].leading = 10.2
    content = path.read_text(encoding="utf-8").splitlines()
    output = []
    index = 0
    while index < len(content):
        line = content[index].strip()
        if not line:
            index += 1
            continue
        if line.startswith("```"):
            language = line[3:].strip()
            code = []
            index += 1
            while index < len(content) and not content[index].startswith("```"):
                code.extend(textwrap.wrap(normalized(content[index]), width=103, replace_whitespace=False, drop_whitespace=False) or [""])
                index += 1
            if language == "mermaid":
                output.append(Paragraph("Поток: React → Caddy → FastAPI → Redis/RQ → worker → FFmpeg. API и worker используют общие SQLite и /data.", style["Text"]))
            else:
                output.append(KeepTogether([Preformatted("\n".join(code), style["GuideCode"])]))
            index += 1
            continue
        if line.startswith("|"):
            rows = []
            while index < len(content) and content[index].strip().startswith("|"):
                row = [cell.strip() for cell in content[index].strip().strip("|").split("|")]
                if not all(re.fullmatch(r":?-+:?", cell) for cell in row):
                    rows.append(row)
                index += 1
            output.extend(table(rows, style, path.name))
            continue
        match = re.match(r"^(#{1,4})\s+(.*)", line)
        if match:
            level, title = len(match[1]), match[2]
            paragraph = Paragraph(inline(title), style["Section" if level == 1 else "Sub" if level == 2 else "Func"])
            if level == 1:
                paragraph.section_key = f"section-{section_number}"
            output.append(paragraph)
            index += 1
            continue
        bullet = re.match(r"^([-*]|\d+\.)\s+(.*)", line)
        paragraph_lines = [line]
        index += 1
        while index < len(content):
            following = content[index].strip()
            if not following or re.match(r"^(#|\||```|[-*]\s|\d+\.\s)", following):
                break
            paragraph_lines.append(following)
            index += 1
        text = " ".join(paragraph_lines)
        output.append(Paragraph(inline(text), style["BulletText" if bullet else "Text"]))
    return output


def main() -> None:
    """Generate one complete guide; Markdown stays the source of truth."""
    register_fonts()
    style = styles()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    document = Guide(str(OUTPUT), pagesize=A4, rightMargin=20 * mm, leftMargin=20 * mm,
                     topMargin=23 * mm, bottomMargin=23 * mm,
                     title="RZT: подробный план команды и GitHub", author="Команда RZT",
                     pageCompression=1)
    story = [Spacer(1, 24 * mm), Paragraph("RZT LYRICS", style["Small"]),
             Paragraph("От каркаса<br/>к первому MP4", style["Cover"]),
             Paragraph("Подробный план для шести участников", style["Sub"]),
             Paragraph("2 frontend · 2 backend · 2 алгоритма<br/>Python backend · QA совмещает Татьяна", style["Text"]),
             Spacer(1, 12 * mm), HRFlowable(width="100%", thickness=2, color=TEAL), Spacer(1, 10 * mm),
             Paragraph("Внутренний релиз: 27 декабря 2026<br/>Резерв: 28-31 декабря", style["Sub"]),
             Paragraph("Внутри: точные файлы и функции, порядок реализации, входы и выходы, проверки, передача между участниками и персональные команды GitHub.", style["Text"]),
             Spacer(1, 12 * mm),
             Paragraph("Статус: стартовый каркас. Генерация видео ещё не реализована. Документ описывает будущую работу; выполненные проверки каркаса перечислены отдельно.", style["Small"]),
             Paragraph("Редакция 9 ноября 2026. Срок и состав ролей уточнены командой; прежний ноябрьский план заменён.", style["Small"]), PageBreak(),
             Paragraph("Как пользоваться", style["Section"]),
             Paragraph("Сначала прочитайте первые действия, роли и календарь. Затем откройте свою пару: frontend, backend или алгоритм/QA. Каждая функция содержит конкретный следующий шаг и получателя результата.", style["Text"]),
             Paragraph("Команды лучше копировать из docs/github.md и README.MD: длинные строки в PDF могут переноситься. Все пути к коду отсчитываются от корня rztlyrics. Markdown - редактируемый источник этого PDF.", style["Text"]),
             Paragraph("Номера с точкой F1.01/A1.01 - шаги по функциям. ID с дефисом F1-01/A1-01 в backlog - укрупнённые задачи, а не уже созданные номера GitHub issues.", style["Text"]),
             Paragraph("Содержание", style["Sub"])]
    toc = TableOfContents()
    toc.levelStyles = [ParagraphStyle("Contents", fontName="Body", fontSize=9.4, leading=14.4,
                                     textColor=NAVY, spaceBefore=5, alignment=TA_LEFT)]
    story.append(toc)
    sources = ["docs/start-here.md", "docs/scope.md", "docs/team.md", "docs/roadmap.md",
               "docs/architecture.md", "docs/api.md", "docs/backlog.md", "docs/tasks/frontend.md",
               "docs/tasks/backend.md", "docs/tasks/algorithm-qa.md", "docs/github.md",
               "docs/test-plan.md", "docs/demo.md", "docs/scaffold-verification.md"]
    for number, name in enumerate(sources, 1):
        story.append(PageBreak())
        story.extend(markdown(ROOT / name, style, number))
    story.extend([PageBreak(), Paragraph("Основание и ссылки", style["Section"]),
                  Paragraph("Использованы предоставленные lyrics_video_v0_team_plan (2).pdf, rztp (1).pdf и шесть изображений аннотации. Два последних изображения дублируют раздел дальнейших идей. Фрагменты, которых нет в приложениях, не восстанавливались как требования организаторов.", style["Text"]),
                  Paragraph("Текущие уточнения команды: Python backend; Илья/Леонид frontend; остальные распределены между backend и алгоритмом; QA назначена по нагрузке; срок - конец декабря. Технические настройки, часовые оценки и дата внутреннего релиза являются предложениями этого плана.", style["Text"]),
                  Paragraph(inline("[GitHub проекта](https://github.com/rainingrsm/rztlyrics)"), style["Text"]),
                  Paragraph(inline("[Защита веток GitHub](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)"), style["Text"]),
                  Paragraph(inline("[PR и issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue)"), style["Text"]),
                  Paragraph(inline("[GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)"), style["Text"]),
                  Paragraph(inline("[uv Docker](https://docs.astral.sh/uv/guides/integration/docker/) · [RQ workers](https://python-rq.org/docs/workers/) · [Vite](https://vite.dev/guide/)"), style["Text"]),
                  Paragraph("Полные команды запуска находятся в README.MD. Публичный стенд, настройки GitHub, release и продуктовая приёмка не выполнялись автоматически при создании каркаса.", style["Small"])])
    document.multiBuild(story, onFirstPage=page_frame, onLaterPages=page_frame)
    print(OUTPUT)


if __name__ == "__main__":
    main()
