import os
import json
import re
import html
import time
import calendar
from datetime import datetime, timezone
from urllib.parse import quote_plus, urljoin

import requests
import feedparser


# ============================================================
# NOWNEX FOOTBALL NEWS ENGINE
# ============================================================
# RSS
# ↓
# أخبار حديثة
# ↓
# استخراج الصور
# ↓
# Gemini 3.6 Flash
# ↓
# ترجمة عربية
# ↓
# ملخص عربي
# ↓
# data/news.json
# ============================================================


# ============================================================
# FILE
# ============================================================

NEWS_FILE = "data/news.json"


# ============================================================
# GEMINI
# ============================================================

API_KEY = os.environ.get("GEMINI_API_KEY")

if not API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is missing from GitHub Secrets."
    )


# Gemini 3.6 Flash
GEMINI_MODEL = os.environ.get(
    "GEMINI_MODEL",
    "gemini-3.6-flash"
)

GEMINI_URL = (
    "https://generativelanguage.googleapis.com/"
    f"v1beta/models/{GEMINI_MODEL}:generateContent"
)


# ============================================================
# SETTINGS
# ============================================================

MAX_PER_CATEGORY = 10
MAX_TOTAL = 50

MIN_PER_CATEGORY = 10

MAX_AGE_HOURS = 48

ENTRIES_PER_FEED = 25

REQUEST_TIMEOUT = 15
GEMINI_TIMEOUT = 90

GEMINI_BATCH_SIZE = 5
GEMINI_BATCH_DELAY = 4


# ============================================================
# CATEGORIES
# ============================================================

CATEGORIES = [
    "matches",
    "transfers",
    "stars",
    "national",
    "history"
]


# ============================================================
# CATEGORY NAMES
# ============================================================

CATEGORY_NAMES = {

    "matches":
        "أخبار المباريات",

    "transfers":
        "أخبار الانتقالات",

    "stars":
        "أخبار النجوم",

    "national":
        "المنتخبات",

    "history":
        "تاريخ كرة القدم"

}


# ============================================================
# GOOGLE NEWS URL
# ============================================================

def google_news_url(
    query,
    language="ar",
    country="DZ"
):

    query = f"{query} when:2d"

    return (
        "https://news.google.com/rss/search?"
        f"q={quote_plus(query)}"
        f"&hl={language}"
        f"&gl={country}"
        f"&ceid={country}:{language}"
    )


# ============================================================
# RSS FEEDS
# ============================================================

RSS_FEEDS = [

    # ========================================================
    # MATCHES
    # ========================================================

    (
        "Google News Matches Arabic",
        google_news_url(
            "كرة القدم مباريات نتائج أهداف تشكيلات",
            "ar",
            "DZ"
        ),
        "matches"
    ),

    (
        "Google News Football Matches",
        google_news_url(
            "football matches results goals lineups",
            "en",
            "US"
        ),
        "matches"
    ),

    (
        "BBC Sport Football",
        "https://feeds.bbci.co.uk/sport/football/rss.xml",
        "matches"
    ),

    (
        "Google News Champions League",
        google_news_url(
            "دوري أبطال أوروبا مباريات نتائج",
            "ar",
            "DZ"
        ),
        "matches"
    ),

    (
        "Google News Premier League",
        google_news_url(
            "الدوري الإنجليزي مباريات نتائج",
            "ar",
            "DZ"
        ),
        "matches"
    ),


    # ========================================================
    # TRANSFERS
    # ========================================================

    (
        "Google News Transfers Arabic",
        google_news_url(
            "انتقالات كرة القدم صفقات ميركاتو",
            "ar",
            "DZ"
        ),
        "transfers"
    ),

    (
        "Google News Football Transfers",
        google_news_url(
            "football transfers transfer news signings",
            "en",
            "US"
        ),
        "transfers"
    ),

    (
        "Fabrizio Romano Google News",
        google_news_url(
            "Fabrizio Romano football transfers",
            "en",
            "US"
        ),
        "transfers"
    ),

    (
        "Google News Transfer Market",
        google_news_url(
            "سوق انتقالات اللاعبين أندية صفقات",
            "ar",
            "DZ"
        ),
        "transfers"
    ),

    (
        "Google News Transfers Europe",
        google_news_url(
            "انتقالات أوروبا ريال مدريد برشلونة مانشستر",
            "ar",
            "DZ"
        ),
        "transfers"
    ),


    # ========================================================
    # STARS
    # ========================================================

    (
        "Google News Stars Arabic",
        google_news_url(
            "نجوم كرة القدم صلاح مبابي رونالدو هالاند",
            "ar",
            "DZ"
        ),
        "stars"
    ),

    (
        "Google News Football Players",
        google_news_url(
            "football players stars Mbappe Ronaldo Messi Haaland",
            "en",
            "US"
        ),
        "stars"
    ),

    (
        "Google News Salah",
        google_news_url(
            "محمد صلاح كرة القدم",
            "ar",
            "DZ"
        ),
        "stars"
    ),

    (
        "Google News Mbappe",
        google_news_url(
            "مبابي كرة القدم",
            "ar",
            "DZ"
        ),
        "stars"
    ),

    (
        "Google News Ronaldo",
        google_news_url(
            "رونالدو كرة القدم",
            "ar",
            "DZ"
        ),
        "stars"
    ),


    # ========================================================
    # NATIONAL
    # ========================================================

    (
        "Google News National Teams",
        google_news_url(
            "المنتخبات كرة القدم كأس العالم تصفيات",
            "ar",
            "DZ"
        ),
        "national"
    ),

    (
        "Google News FIFA",
        google_news_url(
            "FIFA national teams football",
            "en",
            "US"
        ),
        "national"
    ),

    (
        "Google News Algeria Football",
        google_news_url(
            "المنتخب الجزائري كرة القدم",
            "ar",
            "DZ"
        ),
        "national"
    ),

    (
        "Google News Africa Cup",
        google_news_url(
            "كأس أمم إفريقيا المنتخبات كرة القدم",
            "ar",
            "DZ"
        ),
        "national"
    ),

    (
        "Google News World Cup",
        google_news_url(
            "كأس العالم كرة القدم منتخبات",
            "ar",
            "DZ"
        ),
        "national"
    ),


    # ========================================================
    # HISTORY
    # ========================================================

    (
        "Google News Football History",
        google_news_url(
            "تاريخ كرة القدم أساطير كرة القدم",
            "ar",
            "DZ"
        ),
        "history"
    ),

    (
        "Google News Football Legends",
        google_news_url(
            "football legends history",
            "en",
            "US"
        ),
        "history"
    ),

    (
        "Google News On This Day Football",
        google_news_url(
            "في مثل هذا اليوم كرة القدم",
            "ar",
            "DZ"
        ),
        "history"
    ),

    (
        "Google News Historic Matches",
        google_news_url(
            "مباريات تاريخية كرة القدم نهائيات",
            "ar",
            "DZ"
        ),
        "history"
    ),

    (
        "Google News Football Records",
        google_news_url(
            "أرقام قياسية تاريخ كرة القدم",
            "ar",
            "DZ"
        ),
        "history"
    )

]


# ============================================================
# SESSION
# ============================================================

SESSION = requests.Session()

SESSION.headers.update({

    "User-Agent":
        "Mozilla/5.0 (compatible; NOWNEX-Football/7.0)",

    "Accept":
        "application/rss+xml, application/xml, "
        "text/xml, text/html, image/*"

})


# ============================================================
# CLEAN TEXT
# ============================================================

def clean_text(value):

    value = html.unescape(
        str(value or "")
    )

    value = re.sub(
        r"<[^>]+>",
        " ",
        value
    )

    value = re.sub(
        r"\s+",
        " ",
        value
    )

    return value.strip()


# ============================================================
# NORMALIZE TITLE
# ============================================================

def normalize_title(title):

    title = clean_text(
        title
    ).lower()

    title = re.sub(
        r"[^\w\u0600-\u06FF]+",
        "",
        title
    )

    return title


# ============================================================
# VALID IMAGE URL
# ============================================================

def valid_image_url(url):

    if not url:
        return ""

    url = html.unescape(
        str(url).strip()
    )

    if url.startswith("//"):
        url = "https:" + url

    if not (
        url.startswith("http://")
        or
        url.startswith("https://")
    ):
        return ""

    return url.replace(
        "&amp;",
        "&"
    )


# ============================================================
# RSS IMAGE
# ============================================================

def extract_rss_image(entry):

    media_content = entry.get(
        "media_content",
        []
    )

    if isinstance(
        media_content,
        list
    ):

        for media in media_content:

            if not isinstance(
                media,
                dict
            ):
                continue

            image = (
                media.get("url")
                or media.get("href")
                or media.get("src")
            )

            image = valid_image_url(
                image
            )

            if image:
                return image


    media_thumbnail = entry.get(
        "media_thumbnail",
        []
    )

    if isinstance(
        media_thumbnail,
        list
    ):

        for media in media_thumbnail:

            if not isinstance(
                media,
                dict
            ):
                continue

            image = (
                media.get("url")
                or media.get("href")
                or media.get("src")
            )

            image = valid_image_url(
                image
            )

            if image:
                return image


    enclosures = entry.get(
        "enclosures",
        []
    )

    if isinstance(
        enclosures,
        list
    ):

        for enclosure in enclosures:

            if not isinstance(
                enclosure,
                dict
            ):
                continue

            image = (
                enclosure.get("href")
                or enclosure.get("url")
            )

            image = valid_image_url(
                image
            )

            if not image:
                continue

            mime = str(
                enclosure.get(
                    "type",
                    ""
                )
            ).lower()

            if (
                "image" in mime
                or
                re.search(
                    r"\.(jpg|jpeg|png|webp|gif)(\?|$)",
                    image,
                    re.I
                )
            ):

                return image


    sources = [

        entry.get(
            "summary",
            ""
        ),

        entry.get(
            "description",
            ""
        )

    ]


    content = entry.get(
        "content",
        []
    )

    if isinstance(
        content,
        list
    ):

        for item in content:

            if isinstance(
                item,
                dict
            ):

                sources.append(
                    item.get(
                        "value",
                        ""
                    )
                )


    patterns = [

        r'<img[^>]+src=["\']([^"\']+)["\']',

        r'<img[^>]+data-src=["\']([^"\']+)["\']',

        r'<img[^>]+data-lazy-src=["\']([^"\']+)["\']'

    ]


    for source in sources:

        source = str(
            source or ""
        )

        for pattern in patterns:

            matches = re.findall(
                pattern,
                source,
                re.I
            )

            for image in matches:

                image = valid_image_url(
                    image
                )

                if image:
                    return image


    return ""


# ============================================================
# PAGE IMAGE
# ============================================================

def extract_page_image(url):

    if not url:
        return ""

    try:

        response = SESSION.get(
            url,
            timeout=REQUEST_TIMEOUT,
            allow_redirects=True
        )

        if response.status_code != 200:
            return ""

        page = response.text[:1000000]

        final_url = response.url

        candidates = []


        # ----------------------------------------------------
        # OG IMAGE
        # ----------------------------------------------------

        patterns = [

            r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',

            r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',

            r'<meta[^>]+property=["\']og:image:url["\'][^>]+content=["\']([^"\']+)["\']',

            r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image:url["\']',

            r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']',

            r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']twitter:image["\']'

        ]


        for pattern in patterns:

            for image in re.findall(
                pattern,
                page,
                re.I
            ):

                image = urljoin(
                    final_url,
                    html.unescape(
                        image.strip()
                    )
                )

                image = valid_image_url(
                    image
                )

                if image:
                    candidates.append(
                        image
                    )


        # ----------------------------------------------------
        # JSON-LD
        # ----------------------------------------------------

        jsonld = re.findall(

            r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>'
            r'(.*?)'
            r'</script>',

            page,

            re.I | re.S

        )


        for raw in jsonld:

            try:

                data = json.loads(
                    raw
                )

            except Exception:

                continue


            objects = []


            if isinstance(
                data,
                dict
            ):

                objects.append(
                    data
                )

                graph = data.get(
                    "@graph"
                )

                if isinstance(
                    graph,
                    list
                ):

                    objects.extend(
                        graph
                    )

            elif isinstance(
                data,
                list
            ):

                objects.extend(
                    data
                )


            for obj in objects:

                if not isinstance(
                    obj,
                    dict
                ):
                    continue


                image = obj.get(
                    "image"
                )


                if isinstance(
                    image,
                    dict
                ):

                    image = (
                        image.get("url")
                        or
                        image.get("contentUrl")
                    )


                if isinstance(
                    image,
                    list
                ):

                    for x in image:

                        if isinstance(
                            x,
                            dict
                        ):

                            x = (
                                x.get("url")
                                or
                                x.get("contentUrl")
                            )

                        if isinstance(
                            x,
                            str
                        ):

                            candidates.append(
                                urljoin(
                                    final_url,
                                    x
                                )
                            )


                elif isinstance(
                    image,
                    str
                ):

                    candidates.append(
                        urljoin(
                            final_url,
                            image
                        )
                    )


        # ----------------------------------------------------
        # IMG TAGS
        # ----------------------------------------------------

        img_patterns = [

            r'<img[^>]+src=["\']([^"\']+)["\']',

            r'<img[^>]+data-src=["\']([^"\']+)["\']',

            r'<img[^>]+data-original=["\']([^"\']+)["\']',

            r'<img[^>]+data-lazy-src=["\']([^"\']+)["\']'

        ]


        for pattern in img_patterns:

            for image in re.findall(
                pattern,
                page,
                re.I
            )[:50]:

                image = urljoin(
                    final_url,
                    html.unescape(
                        image.strip()
                    )
                )

                image = valid_image_url(
                    image
                )

                if image:
                    candidates.append(
                        image
                    )


        # ----------------------------------------------------
        # FILTER BAD IMAGES
        # ----------------------------------------------------

        bad = [

            "logo",
            "avatar",
            "favicon",
            "icon",
            "sprite",
            "placeholder",
            "advert",
            "banner",
            "pixel",
            "tracking"

        ]


        cleaned = []


        for image in candidates:

            low = image.lower()

            if any(
                word in low
                for word in bad
            ):
                continue

            if image not in cleaned:

                cleaned.append(
                    image
                )


        if cleaned:

            return cleaned[0]


    except Exception as error:

        print(
            "IMAGE PAGE ERROR:",
            str(error)[:180]
        )


    return ""


# ============================================================
# BEST IMAGE
# ============================================================

def get_best_image(
    article_url,
    rss_image
):

    if rss_image:

        image = valid_image_url(
            rss_image
        )

        if image:
            return image


    image = extract_page_image(
        article_url
    )

    if image:
        return image


    return ""


# ============================================================
# DATE
# ============================================================

def get_timestamp(entry):

    parsed = entry.get(
        "published_parsed"
    )

    if not parsed:

        parsed = entry.get(
            "updated_parsed"
        )

    if parsed:

        try:

            return calendar.timegm(
                parsed
            )

        except Exception:
            pass

    return 0


def timestamp_to_iso(timestamp):

    if not timestamp:
        return ""

    return datetime.fromtimestamp(
        timestamp,
        timezone.utc
    ).isoformat()


def age_hours(timestamp):

    if not timestamp:
        return 999999

    return max(
        0,
        (
            time.time()
            -
            timestamp
        ) / 3600
    )


# ============================================================
# DUPLICATES
# ============================================================

def remove_duplicates(articles):

    result = []

    titles = set()
    links = set()


    for article in articles:

        title = normalize_title(
            article.get(
                "title",
                ""
            )
        )

        link = str(
            article.get(
                "link",
                ""
            )
        ).strip().lower()


        if not title:
            continue


        if title in titles:
            continue


        if link and link in links:
            continue


        titles.add(
            title
        )


        if link:
            links.add(
                link
            )


        result.append(
            article
        )


    return result


# ============================================================
# GET NEWS
# ============================================================

def get_news():

    articles = []


    for (
        source,
        feed_url,
        category
    ) in RSS_FEEDS:

        print("")
        print(
            "=========================================="
        )

        print(
            "SOURCE:",
            source
        )

        print(
            "CATEGORY:",
            category
        )


        try:

            response = SESSION.get(
                feed_url,
                timeout=REQUEST_TIMEOUT
            )


            if response.status_code != 200:

                print(
                    "HTTP ERROR:",
                    response.status_code
                )

                continue


            feed = feedparser.parse(
                response.content
            )


            entries = feed.entries[
                :ENTRIES_PER_FEED
            ]


            print(
                "ENTRIES:",
                len(entries)
            )


            for entry in entries:

                title = clean_text(
                    entry.get(
                        "title",
                        ""
                    )
                )


                link = str(
                    entry.get(
                        "link",
                        ""
                    )
                ).strip()


                if not title or not link:
                    continue


                timestamp = get_timestamp(
                    entry
                )


                if not timestamp:

                    print(
                        "SKIP NO DATE:",
                        title[:100]
                    )

                    continue


                age = age_hours(
                    timestamp
                )


                if age > MAX_AGE_HOURS:

                    print(
                        f"SKIP OLD {age:.1f}h:",
                        title[:100]
                    )

                    continue


                description = clean_text(

                    entry.get(
                        "summary",
                        entry.get(
                            "description",
                            ""
                        )
                    )

                )


                if not description:

                    content = entry.get(
                        "content",
                        []
                    )


                    if isinstance(
                        content,
                        list
                    ) and content:

                        first = content[0]

                        if isinstance(
                            first,
                            dict
                        ):

                            description = clean_text(
                                first.get(
                                    "value",
                                    ""
                                )
                            )


                image = extract_rss_image(
                    entry
                )


                published = clean_text(

                    entry.get(
                        "published",
                        entry.get(
                            "updated",
                            ""
                        )
                    )

                )


                articles.append({

                    "title":
                        title,

                    "description":
                        description,

                    "link":
                        link,

                    "source":
                        source,

                    "category":
                        category,

                    "image":
                        image,

                    "published":
                        published,

                    "_timestamp":
                        timestamp,

                    "_age":
                        age

                })


        except Exception as error:

            print(
                "RSS ERROR:",
                str(error)[:250]
            )


    articles = remove_duplicates(
        articles
    )


    articles.sort(
        key=lambda x:
            x.get(
                "_timestamp",
                0
            ),
        reverse=True
    )


    print("")
    print(
        "=========================================="
    )

    print(
        "TOTAL FRESH ARTICLES:",
        len(articles)
    )

    print(
        "=========================================="
    )


    return articles


# ============================================================
# SELECT ARTICLES
# ============================================================

def select_articles(articles):

    selected = []


    for category in CATEGORIES:

        candidates = [

            article

            for article in articles

            if article.get(
                "category"
            ) == category

        ]


        print("")
        print(
            category,
            "AVAILABLE:",
            len(candidates)
        )


        count = 0


        for article in candidates:

            if count >= MAX_PER_CATEGORY:
                break


            selected.append(
                article
            )

            count += 1


        print(
            category,
            "SELECTED:",
            count
        )


        if count < MIN_PER_CATEGORY:

            raise RuntimeError(

                f"Not enough fresh news for "
                f"{category}: "
                f"{count}/{MIN_PER_CATEGORY}"

            )


    return selected[
        :MAX_TOTAL
    ]


# ============================================================
# GEMINI
# ============================================================

def ask_gemini(articles):

    if not articles:
        return []


    blocks = []


    for index, article in enumerate(
        articles,
        start=1
    ):

        description = clean_text(
            article.get(
                "description",
                ""
            )
        )


        if not description:

            description = (
                "لا يوجد وصف إضافي. "
                "اعتمد فقط على العنوان "
                "ولا تضف أي معلومة غير مؤكدة."
            )


        blocks.append(

            f"""
ARTICLE {index}

CATEGORY:
{CATEGORY_NAMES.get(
    article.get("category"),
    "كرة القدم"
)}

SOURCE:
{article.get("source", "")}

ORIGINAL TITLE:
{article.get("title", "")}

AVAILABLE INFORMATION:
{description}
"""

        )


    prompt = f"""
أنت محرر الأخبار الرئيسي في NOWNEX FOOTBALL.

مهمتك تحويل الأخبار التالية إلى محتوى عربي احترافي.

القواعد الإلزامية:

1. ترجم عنوان كل خبر إلى العربية.
2. اكتب title_ar بالعربية.
3. اكتب summary_ar بالعربية.
4. لا تترك العنوان باللغة الإنجليزية.
5. لا تختصر الخبر إلى جملة واحدة.
6. اكتب ملخصًا من 70 إلى 130 كلمة تقريبًا.
7. الملخص يجب أن يتكون من عدة جمل مترابطة.
8. اذكر أهم تفاصيل الخبر الموجودة في المعلومات المتاحة.
9. لا تخترع أي معلومة.
10. لا تخترع أسماء.
11. لا تخترع نتائج.
12. لا تخترع أرقامًا.
13. لا تخترع تصريحات.
14. لا تخترع اقتباسات.
15. لا تضف رأيًا شخصيًا.
16. إذا كانت المعلومات المتاحة محدودة، اكتب ملخصًا مفيدًا فقط من المعلومات المتوفرة.
17. أسماء الأندية واللاعبين والعلامات التجارية يمكن كتابتها كما هي إذا كان ذلك ضروريًا.
18. لا تضع روابط.
19. لا تستخدم Markdown.
20. أعد JSON فقط.
21. يجب إعادة عنصر واحد لكل ARTICLE.
22. يجب الحفاظ على رقم ARTICLE داخل id.

الشكل المطلوب:

[
  {{
    "id": 1,
    "title_ar": "العنوان العربي",
    "summary_ar": "ملخص عربي مفصل من عدة جمل"
  }}
]

الأخبار:

{chr(10).join(blocks)}
"""


    payload = {

        "contents": [

            {

                "role":
                    "user",

                "parts": [

                    {
                        "text":
                            prompt
                    }

                ]

            }

        ],

        "generationConfig": {

            "responseMimeType":
                "application/json"

        }

    }


    headers = {

        "Content-Type":
            "application/json",

        "x-goog-api-key":
            API_KEY

    }


    for attempt in range(
        1,
        4
    ):

        try:

            print(
                "GEMINI REQUEST:",
                attempt,
                "/3"
            )


            response = requests.post(

                GEMINI_URL,

                headers=headers,

                json=payload,

                timeout=GEMINI_TIMEOUT

            )


            print(
                "GEMINI STATUS:",
                response.status_code
            )


            # ------------------------------------------------
            # RATE LIMIT
            # ------------------------------------------------

            if response.status_code == 429:

                wait = (
                    30
                    if attempt == 1
                    else
                    60
                    if attempt == 2
                    else
                    90
                )


                print(
                    "RATE LIMIT. WAIT:",
                    wait
                )


                time.sleep(
                    wait
                )

                continue


            # ------------------------------------------------
            # OTHER API ERROR
            # ------------------------------------------------

            if response.status_code != 200:

                print(
                    "GEMINI ERROR:"
                )

                print(
                    response.text[:3000]
                )

                if attempt < 3:

                    time.sleep(
                        10
                    )

                    continue

                return []


            # ------------------------------------------------
            # JSON RESPONSE
            # ------------------------------------------------

            data = response.json()


            candidates = data.get(
                "candidates",
                []
            )


            if not candidates:

                print(
                    "GEMINI ERROR: "
                    "No candidates returned."
                )

                return []


            text = (

                candidates[0]
                .get(
                    "content",
                    {}
                )
                .get(
                    "parts",
                    [{}]
                )[0]
                .get(
                    "text",
                    ""
                )

            )


            if not text:

                print(
                    "GEMINI ERROR: "
                    "Empty response text."
                )

                return []


            text = text.strip()


            # إزالة Markdown إن ظهر
            text = re.sub(
                r"^```json\s*",
                "",
                text,
                flags=re.I
            )


            text = re.sub(
                r"\s*```$",
                "",
                text
            )


            try:

                result = json.loads(
                    text
                )

            except json.JSONDecodeError as error:

                print(
                    "GEMINI JSON ERROR:",
                    str(error)
                )

                print(
                    "RAW GEMINI RESPONSE:"
                )

                print(
                    text[:5000]
                )

                return []


            if isinstance(
                result,
                dict
            ):

                result = result.get(
                    "articles",
                    []
                )


            if not isinstance(
                result,
                list
            ):

                print(
                    "GEMINI ERROR: "
                    "Response is not a list."
                )

                return []


            print(
                "GEMINI ARTICLES RETURNED:",
                len(result)
            )


            return result


        except Exception as error:

            print(
                "GEMINI ERROR:",
                str(error)[:500]
            )


            if attempt < 3:

                time.sleep(
                    10
                )


    return []


# ============================================================
# VALID SUMMARY
# ============================================================

def valid_summary(
    title,
    summary
):

    title = clean_text(
        title
    )

    summary = clean_text(
        summary
    )


    if len(summary) < 250:
        return False


    if summary.lower() == title.lower():
        return False


    words = summary.split()


    if len(words) < 45:
        return False


    if len(words) > 220:
        return False


    sentences = len(
        re.findall(
            r"[.!؟]",
            summary
        )
    )


    if sentences < 3:
        return False


    return True


# ============================================================
# PROCESS BATCH
# ============================================================

def process_batch(articles):

    results = ask_gemini(
        articles
    )


    by_id = {}


    for result in results:

        if not isinstance(
            result,
            dict
        ):
            continue


        try:

            article_id = int(
                result.get(
                    "id"
                )
            )

        except Exception:

            continue


        by_id[
            article_id
        ] = result


    final = []


    for index, article in enumerate(
        articles,
        start=1
    ):

        ai = by_id.get(
            index
        )


        if not ai:

            print(
                "NO GEMINI RESULT:",
                article.get(
                    "title",
                    ""
                )[:100]
            )

            continue


        title_ar = clean_text(

            ai.get(
                "title_ar",
                ""
            )

        )


        summary_ar = clean_text(

            ai.get(
                "summary_ar",
                ""
            )

        )


        if not title_ar:

            continue


        # ----------------------------------------------------
        # Reject full English title
        # ----------------------------------------------------

        arabic = len(
            re.findall(
                r"[\u0600-\u06FF]",
                title_ar
            )
        )


        latin = len(
            re.findall(
                r"[A-Za-z]",
                title_ar
            )
        )


        if (
            latin > 15
            and latin > arabic * 2
        ):

            print(
                "ENGLISH TITLE REJECTED:",
                title_ar
            )

            continue


        # ----------------------------------------------------
        # Validate summary
        # ----------------------------------------------------

        if not valid_summary(
            title_ar,
            summary_ar
        ):

            print(
                "BAD SUMMARY:",
                title_ar[:100]
            )

            continue


        timestamp = article.get(
            "_timestamp",
            0
        )


        final.append({

            "category":
                article.get(
                    "category",
                    ""
                ),

            "title_ar":
                title_ar,

            "summary_ar":
                summary_ar,

            "content_ar":
                summary_ar,

            "title":
                title_ar,

            "summary":
                summary_ar,

            "description":
                summary_ar,

            "image":
                article.get(
                    "image",
                    ""
                ),

            "source":
                article.get(
                    "source",
                    ""
                ),

            "link":
                article.get(
                    "link",
                    ""
                ),

            "published":
                article.get(
                    "published",
                    ""
                ),

            "publishedAt":
                timestamp_to_iso(
                    timestamp
                ),

            "date":
                timestamp_to_iso(
                    timestamp
                ),

            "ageHours":
                round(
                    article.get(
                        "_age",
                        0
                    ),
                    1
                )

        })


        print(
            "CREATED:",
            title_ar[:120]
        )


    return final


# ============================================================
# IMAGES
# ============================================================

def complete_images(articles):

    print("")
    print(
        "=========================================="
    )

    print(
        "CHECKING ARTICLE IMAGES"
    )

    print(
        "=========================================="
    )


    for index, article in enumerate(
        articles,
        start=1
    ):

        print(
            f"[{index}/{len(articles)}]",
            article.get(
                "title",
                ""
            )[:100]
        )


        existing = article.get(
            "image",
            ""
        )


        if existing:

            article["image"] = (
                valid_image_url(
                    existing
                )
            )


        if not article.get(
            "image"
        ):

            article["image"] = get_best_image(

                article.get(
                    "link",
                    ""
                ),

                existing

            )


        if article.get(
            "image"
        ):

            print(
                "IMAGE ✓"
            )

        else:

            print(
                "IMAGE ✗"
            )


        time.sleep(
            0.2
        )


    return articles


# ============================================================
# CATEGORY COUNTS
# ============================================================

def category_counts(articles):

    return {

        category:
            len([

                x

                for x in articles

                if x.get(
                    "category"
                ) == category

            ])

        for category in CATEGORIES

    }


# ============================================================
# TRENDING
# ============================================================

def create_trending(articles):

    result = []

    seen = set()


    for category in CATEGORIES:

        category_articles = [

            x

            for x in articles

            if x.get(
                "category"
            ) == category

        ]


        for article in category_articles[:2]:

            key = normalize_title(

                article.get(
                    "title_ar",
                    ""
                )

            )


            if not key:
                continue


            if key in seen:
                continue


            item = dict(
                article
            )


            item["category"] = "Trending"


            result.append(
                item
            )


            seen.add(
                key
            )


            if len(result) >= 10:

                return result


    return result


# ============================================================
# MAIN
# ============================================================

def main():

    print("")
    print(
        "=========================================="
    )

    print(
        " NOWNEX FOOTBALL NEWS ENGINE"
    )

    print(
        " RSS + GEMINI 3.6 FLASH + IMAGES"
    )

    print(
        "=========================================="
    )


    print(
        "GEMINI MODEL:",
        GEMINI_MODEL
    )


    # --------------------------------------------------------
    # CREATE DATA DIRECTORY
    # --------------------------------------------------------

    os.makedirs(
        "data",
        exist_ok=True
    )


    # --------------------------------------------------------
    # 1. RSS
    # --------------------------------------------------------

    articles = get_news()


    if not articles:

        raise RuntimeError(
            "No fresh football news found."
        )


    # --------------------------------------------------------
    # 2. SELECT
    # --------------------------------------------------------

    selected = select_articles(
        articles
    )


    print("")
    print(
        "SELECTED:",
        len(selected)
    )


    selected_counts = category_counts(
        selected
    )


    for category in CATEGORIES:

        print(
            category,
            ":",
            selected_counts[category]
        )


    # --------------------------------------------------------
    # 3. IMAGES
    # --------------------------------------------------------

    selected = complete_images(
        selected
    )


    # --------------------------------------------------------
    # 4. GEMINI
    # --------------------------------------------------------

    final_news = []


    total_batches = (

        len(selected)
        +
        GEMINI_BATCH_SIZE
        -
        1

    ) // GEMINI_BATCH_SIZE


    for batch_number, start in enumerate(

        range(
            0,
            len(selected),
            GEMINI_BATCH_SIZE
        ),

        start=1

    ):

        batch = selected[
            start:
            start + GEMINI_BATCH_SIZE
        ]


        print("")
        print(
            "=========================================="
        )

        print(
            f"GEMINI BATCH "
            f"{batch_number}/{total_batches}"
        )

        print(
            "ARTICLES:",
            len(batch)
        )


        results = process_batch(
            batch
        )


        print(
            "BATCH RESULT:",
            len(results)
        )


        final_news.extend(
            results
        )


        if batch_number < total_batches:

            print(
                "WAITING:",
                GEMINI_BATCH_DELAY,
                "seconds"
            )

            time.sleep(
                GEMINI_BATCH_DELAY
            )


    # --------------------------------------------------------
    # 5. CHECK
    # --------------------------------------------------------

    counts = category_counts(
        final_news
    )


    print("")
    print(
        "=========================================="
    )

    print(
        "CATEGORY RESULTS"
    )

    print(
        "=========================================="
    )


    for category in CATEGORIES:

        print(
            category,
            ":",
            counts[category],
            "/",
            MIN_PER_CATEGORY
        )


    missing = [

        category

        for category in CATEGORIES

        if counts[category]
        < MIN_PER_CATEGORY

    ]


    if missing:

        print(
            "MISSING:",
            missing
        )

        raise RuntimeError(

            "Not enough valid Arabic football news. "
            "Existing news.json was not modified."

        )


    # --------------------------------------------------------
    # 6. SORT
    # --------------------------------------------------------

    final_news.sort(

        key=lambda x:
            x.get(
                "publishedAt",
                ""
            ),

        reverse=True

    )


    final_news = final_news[
        :MAX_TOTAL
    ]


    # --------------------------------------------------------
    # 7. TRENDING
    # --------------------------------------------------------

    trending = create_trending(
        final_news
    )


    # --------------------------------------------------------
    # 8. OUTPUT
    # --------------------------------------------------------

    output = {

        "updatedAt":
            datetime.now(
                timezone.utc
            ).isoformat(),

        "count":
            len(final_news),

        "trendingCount":
            len(trending),

        "news":
            final_news,

        "trending":
            trending

    }


    # --------------------------------------------------------
    # 9. SAVE
    # --------------------------------------------------------

    with open(
        NEWS_FILE,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(

            output,

            file,

            ensure_ascii=False,

            indent=2

        )


    # --------------------------------------------------------
    # 10. REPORT
    # --------------------------------------------------------

    images = len([

        x

        for x in final_news

        if x.get(
            "image"
        )

    ])


    summaries = len([

        x

        for x in final_news

        if valid_summary(

            x.get(
                "title_ar",
                ""
            ),

            x.get(
                "summary_ar",
                ""
            )

        )

    ])


    print("")
    print(
        "=========================================="
    )

    print(
        "NOWNEX FOOTBALL UPDATED SUCCESSFULLY"
    )

    print(
        "=========================================="
    )

    print(
        "TOTAL:",
        len(final_news)
    )

    print(
        "IMAGES:",
        images,
        "/",
        len(final_news)
    )

    print(
        "SUMMARIES:",
        summaries,
        "/",
        len(final_news)
    )

    print(
        "TRENDING:",
        len(trending)
    )


    for category in CATEGORIES:

        print(
            category,
            ":",
            counts[category]
        )


    print("")
    print(
        "FILE:",
        NEWS_FILE
    )

    print(
        "=========================================="
    )


# ============================================================
# START
# ============================================================

if __name__ == "__main__":

    main()
