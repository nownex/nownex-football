import os
import json
import re
import html
import time
import calendar
import hashlib
from datetime import datetime, timezone
from urllib.parse import quote_plus, urljoin

import requests
import feedparser


# ============================================================
# NOWNEX FOOTBALL NEWS ENGINE
# ============================================================
# RSS
#   ↓
# Fresh football news
#   ↓
# Images
#   ↓
# Gemini
#   ↓
# Arabic title + Arabic summary
#   ↓
# data/news.json
#
# Images are downloaded to:
# assets/news/
# ============================================================


# ============================================================
# PATHS
# ============================================================

NEWS_FILE = "data/news.json"
IMAGE_DIR = "assets/news"


# ============================================================
# GEMINI
# ============================================================

API_KEY = os.environ.get("GEMINI_API_KEY")

if not API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is missing from GitHub Secrets."
    )


GEMINI_MODEL = os.environ.get(
    "GEMINI_MODEL",
    "gemini-2.5-flash"
)

GEMINI_URL = (
    "https://generativelanguage.googleapis.com/"
    f"v1beta/models/{GEMINI_MODEL}:generateContent"
)


# ============================================================
# SETTINGS
# ============================================================

CATEGORIES = [
    "matches",
    "transfers",
    "stars",
    "national",
    "history"
]

CATEGORY_NAMES = {
    "matches": "أخبار المباريات",
    "transfers": "أخبار الانتقالات",
    "stars": "أخبار النجوم",
    "national": "المنتخبات",
    "history": "تاريخ كرة القدم"
}

MAX_PER_CATEGORY = 10
MAX_TOTAL = 50

MIN_PER_CATEGORY = 10

# لا نقبل أخبارًا أقدم من 48 ساعة
MAX_AGE_HOURS = 48

ENTRIES_PER_FEED = 30

REQUEST_TIMEOUT = 15
GEMINI_TIMEOUT = 90

# Gemini يعالج 5 أخبار في كل طلب
GEMINI_BATCH_SIZE = 5

GEMINI_BATCH_DELAY = 4

# حجم الصورة الأقصى التي نحفظها
MAX_IMAGE_BYTES = 4_000_000


# ============================================================
# GOOGLE NEWS RSS
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
# RSS SOURCES
# ============================================================

RSS_FEEDS = [

    # --------------------------------------------------------
    # MATCHES
    # --------------------------------------------------------

    (
        "Google News Football Matches Arabic",
        google_news_url(
            "كرة القدم مباريات نتائج أهداف تشكيلات",
            "ar",
            "DZ"
        ),
        "matches"
    ),

    (
        "Google News Champions League",
        google_news_url(
            "دوري أبطال أوروبا مباريات نتائج أهداف",
            "ar",
            "DZ"
        ),
        "matches"
    ),

    (
        "Google News Premier League",
        google_news_url(
            "الدوري الإنجليزي مباريات نتائج أهداف",
            "ar",
            "DZ"
        ),
        "matches"
    ),

    (
        "Google News La Liga",
        google_news_url(
            "الدوري الإسباني مباريات نتائج أهداف",
            "ar",
            "DZ"
        ),
        "matches"
    ),

    (
        "BBC Sport Football",
        "https://feeds.bbci.co.uk/sport/football/rss.xml",
        "matches"
    ),

    (
        "Google News Football Matches English",
        google_news_url(
            "football matches results goals lineups",
            "en",
            "US"
        ),
        "matches"
    ),

    # --------------------------------------------------------
    # TRANSFERS
    # --------------------------------------------------------

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
        "Google News Transfer Market",
        google_news_url(
            "سوق انتقالات اللاعبين أندية صفقات",
            "ar",
            "DZ"
        ),
        "transfers"
    ),

    (
        "Google News Football Transfers English",
        google_news_url(
            "football transfers transfer news signings",
            "en",
            "US"
        ),
        "transfers"
    ),

    (
        "Google News Real Madrid Transfers",
        google_news_url(
            "ريال مدريد انتقالات صفقات",
            "ar",
            "DZ"
        ),
        "transfers"
    ),

    (
        "Google News Barcelona Transfers",
        google_news_url(
            "برشلونة انتقالات صفقات",
            "ar",
            "DZ"
        ),
        "transfers"
    ),

    # --------------------------------------------------------
    # STARS
    # --------------------------------------------------------

    (
        "Google News Football Stars",
        google_news_url(
            "نجوم كرة القدم لاعبين مبابي هالاند صلاح رونالدو",
            "ar",
            "DZ"
        ),
        "stars"
    ),

    (
        "Google News Mohamed Salah",
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

    (
        "Google News Haaland",
        google_news_url(
            "هالاند كرة القدم",
            "ar",
            "DZ"
        ),
        "stars"
    ),

    # --------------------------------------------------------
    # NATIONAL
    # --------------------------------------------------------

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

    (
        "Google News FIFA National Teams",
        google_news_url(
            "FIFA national teams football",
            "en",
            "US"
        ),
        "national"
    ),

    # --------------------------------------------------------
    # HISTORY
    # --------------------------------------------------------

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
    ),

    (
        "Google News On This Day Football",
        google_news_url(
            "في مثل هذا اليوم كرة القدم",
            "ar",
            "DZ"
        ),
        "history"
    )
]


# ============================================================
# HTTP SESSION
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

    title = clean_text(title).lower()

    title = re.sub(
        r"[^\w\u0600-\u06FF]+",
        "",
        title
    )

    return title


# ============================================================
# VALID URL
# ============================================================

def valid_url(url):

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
# EXTRACT IMAGE FROM RSS
# ============================================================

def extract_rss_image(entry):

    # --------------------------------------------------------
    # media_content
    # --------------------------------------------------------

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

            image = valid_url(image)

            if image:
                return image

    # --------------------------------------------------------
    # media_thumbnail
    # --------------------------------------------------------

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

            image = valid_url(image)

            if image:
                return image

    # --------------------------------------------------------
    # enclosure
    # --------------------------------------------------------

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

            image = valid_url(image)

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

    # --------------------------------------------------------
    # IMAGE INSIDE DESCRIPTION
    # --------------------------------------------------------

    sources = [
        entry.get("summary", ""),
        entry.get("description", "")
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
        r'<img[^>]+data-original=["\']([^"\']+)["\']',
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

                image = valid_url(image)

                if image:
                    return image

    return ""


# ============================================================
# EXTRACT IMAGES FROM ARTICLE PAGE
# ============================================================

def extract_page_images(
    article_url
):

    if not article_url:
        return []

    try:

        response = SESSION.get(
            article_url,
            timeout=REQUEST_TIMEOUT,
            allow_redirects=True
        )

        if response.status_code != 200:
            return []

        page = response.text[:1_500_000]

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

            r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']twitter:image["\']',

            r'<link[^>]+rel=["\']image_src["\'][^>]+href=["\']([^"\']+)["\']'
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

                image = valid_url(image)

                if image:
                    candidates.append(image)

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

                data = json.loads(raw)

            except Exception:

                continue

            objects = []

            if isinstance(
                data,
                dict
            ):

                objects.append(data)

                graph = data.get("@graph")

                if isinstance(
                    graph,
                    list
                ):

                    objects.extend(graph)

            elif isinstance(
                data,
                list
            ):

                objects.extend(data)

            for obj in objects:

                if not isinstance(
                    obj,
                    dict
                ):
                    continue

                image = obj.get("image")

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

                    for item in image:

                        if isinstance(
                            item,
                            dict
                        ):

                            item = (
                                item.get("url")
                                or
                                item.get("contentUrl")
                            )

                        if isinstance(
                            item,
                            str
                        ):

                            candidates.append(
                                urljoin(
                                    final_url,
                                    item
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

            matches = re.findall(
                pattern,
                page,
                re.I
            )

            for image in matches[:100]:

                image = urljoin(
                    final_url,
                    html.unescape(
                        image.strip()
                    )
                )

                image = valid_url(image)

                if image:
                    candidates.append(image)

        # ----------------------------------------------------
        # FILTER
        # ----------------------------------------------------

        bad_words = [
            "logo",
            "avatar",
            "favicon",
            "icon",
            "sprite",
            "placeholder",
            "advert",
            "banner",
            "pixel",
            "tracking",
            "loader"
        ]

        result = []

        seen = set()

        for image in candidates:

            image = valid_url(image)

            if not image:
                continue

            low = image.lower()

            if any(
                word in low
                for word in bad_words
            ):
                continue

            if image in seen:
                continue

            seen.add(image)

            result.append(image)

        return result

    except Exception as error:

        print(
            "PAGE IMAGE ERROR:",
            str(error)[:200]
        )

        return []


# ============================================================
# GET IMAGE CANDIDATES
# ============================================================

def get_image_candidates(
    article_url,
    rss_image
):

    result = []

    if rss_image:

        rss_image = valid_url(
            rss_image
        )

        if rss_image:
            result.append(rss_image)

    page_images = extract_page_images(
        article_url
    )

    result.extend(page_images)

    unique = []

    seen = set()

    for image in result:

        if image in seen:
            continue

        seen.add(image)

        unique.append(image)

    return unique


# ============================================================
# DOWNLOAD IMAGE
# ============================================================

def download_image(
    image_url,
    article_key
):

    image_url = valid_url(
        image_url
    )

    if not image_url:
        return ""

    try:

        response = SESSION.get(
            image_url,
            timeout=REQUEST_TIMEOUT,
            stream=True,
            allow_redirects=True
        )

        if response.status_code != 200:
            return ""

        content_type = (
            response.headers
            .get(
                "Content-Type",
                ""
            )
            .lower()
        )

        if (
            "image" not in content_type
            and
            not re.search(
                r"\.(jpg|jpeg|png|webp)(\?|$)",
                image_url,
                re.I
            )
        ):
            return ""

        extension = ".jpg"

        if "png" in content_type:
            extension = ".png"

        elif "webp" in content_type:
            extension = ".webp"

        elif "gif" in content_type:
            extension = ".gif"

        elif (
            "jpeg" in content_type
            or
            "jpg" in content_type
        ):
            extension = ".jpg"

        filename = (
            hashlib.sha256(
                article_key.encode(
                    "utf-8"
                )
            ).hexdigest()[:24]
            +
            extension
        )

        os.makedirs(
            IMAGE_DIR,
            exist_ok=True
        )

        filepath = os.path.join(
            IMAGE_DIR,
            filename
        )

        if os.path.exists(
            filepath
        ):

            return (
                "assets/news/"
                + filename
            )

        total = 0

        with open(
            filepath,
            "wb"
        ) as file:

            for chunk in response.iter_content(
                chunk_size=65536
            ):

                if not chunk:
                    continue

                total += len(chunk)

                if total > MAX_IMAGE_BYTES:

                    file.close()

                    try:
                        os.remove(filepath)
                    except Exception:
                        pass

                    return ""

                file.write(chunk)

        if total < 10_000:

            try:
                os.remove(filepath)
            except Exception:
                pass

            return ""

        return (
            "assets/news/"
            + filename
        )

    except Exception as error:

        print(
            "IMAGE DOWNLOAD ERROR:",
            str(error)[:180]
        )

        return ""


# ============================================================
# BEST IMAGE
# ============================================================

def get_best_image(
    article
):

    article_url = article.get(
        "link",
        ""
    )

    rss_image = article.get(
        "image",
        ""
    )

    candidates = get_image_candidates(
        article_url,
        rss_image
    )

    if not candidates:

        return ""

    print(
        "IMAGE CANDIDATES:",
        len(candidates)
    )

    article_key = (
        article.get(
            "link",
            ""
        )
        or
        article.get(
            "title",
            ""
        )
    )

    # --------------------------------------------------------
    # جرّب الصور بالترتيب
    # --------------------------------------------------------

    for index, image_url in enumerate(
        candidates[:12],
        start=1
    ):

        print(
            f"IMAGE TRY {index}:",
            image_url[:120]
        )

        local_image = download_image(
            image_url,
            article_key
        )

        if local_image:

            print(
                "IMAGE SAVED:",
                local_image
            )

            return local_image

    # --------------------------------------------------------
    # fallback للرابط الخارجي
    # --------------------------------------------------------

    if candidates:

        print(
            "IMAGE LOCAL DOWNLOAD FAILED."
        )

        print(
            "USING REMOTE IMAGE:",
            candidates[0][:120]
        )

        return candidates[0]

    return ""


# ============================================================
# DATE
# ============================================================

def get_timestamp(
    entry
):

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


def timestamp_to_iso(
    timestamp
):

    if not timestamp:
        return ""

    try:

        return datetime.fromtimestamp(
            timestamp,
            timezone.utc
        ).isoformat()

    except Exception:

        return ""


def age_hours(
    timestamp
):

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

def remove_duplicates(
    articles
):

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

        titles.add(title)

        if link:
            links.add(link)

        result.append(article)

    return result


# ============================================================
# READ RSS
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
            "------------------------------------------"
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
                    "HTTP:",
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

                    if (
                        isinstance(
                            content,
                            list
                        )
                        and
                        content
                    ):

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
        key=lambda item:
            item.get(
                "_timestamp",
                0
            ),
        reverse=True
    )

    print("")
    print(
        "TOTAL FRESH ARTICLES:",
        len(articles)
    )

    return articles


# ============================================================
# SELECT NEWS
# ============================================================

def select_articles(
    articles
):

    selected = []

    for category in CATEGORIES:

        candidates = [
            article
            for article in articles
            if article.get(
                "category"
            ) == category
        ]

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

    return selected[:MAX_TOTAL]


# ============================================================
# GEMINI REQUEST
# ============================================================

def ask_gemini(
    articles
):

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
                "اعتمد على العنوان فقط "
                "ولا تضف معلومات غير مؤكدة."
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

حوّل الأخبار التالية إلى أخبار عربية احترافية.

القواعد الإلزامية:

- اكتب عنوانًا عربيًا واضحًا.
- اكتب ملخصًا عربيًا مفصلًا.
- لا تترك العنوان باللغة الإنجليزية.
- لا تستخدم الإنجليزية إلا لأسماء الأندية أو اللاعبين أو العلامات التجارية عند الضرورة.
- لا تخترع أي معلومة.
- لا تخترع نتائج.
- لا تخترع أرقامًا.
- لا تخترع أسماء.
- لا تخترع تصريحات.
- لا تخترع اقتباسات.
- لا تضف رأيًا شخصيًا.
- استخدم المعلومات الموجودة فقط.
- الملخص من 70 إلى 130 كلمة تقريبًا.
- الملخص يجب أن يكون من 3 إلى 6 جمل.
- لا تجعل الملخص مجرد إعادة صياغة للعنوان.
- لا تضع روابط.
- لا تستخدم Markdown.
- أعد JSON فقط.

الشكل:

[
  {{
    "id": 1,
    "title_ar": "عنوان عربي",
    "summary_ar": "ملخص عربي مفصل..."
  }}
]

يجب إعادة عنصر لكل ARTICLE وبنفس رقم ARTICLE.

الأخبار:

{chr(10).join(blocks)}
"""

    payload = {

        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": prompt
                    }
                ]
            }
        ],

        "generationConfig": {

            "temperature": 0.2,

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
                f"GEMINI REQUEST {attempt}/3"
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
                    "RATE LIMIT:",
                    wait,
                    "seconds"
                )

                time.sleep(
                    wait
                )

                continue

            if response.status_code != 200:

                print(
                    "GEMINI ERROR:",
                    response.text[:1500]
                )

                return []

            data = response.json()

            candidates = data.get(
                "candidates",
                []
            )

            if not candidates:
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
                return []

            text = text.strip()

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

            result = json.loads(
                text
            )

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

                return []

            return result

        except Exception as error:

            print(
                "GEMINI EXCEPTION:",
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

    if not summary:
        return False

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
# PROCESS GEMINI
# ============================================================

def process_batch(
    articles
):

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
        # منع العنوان الإنجليزي
        # ----------------------------------------------------

        arabic_chars = len(
            re.findall(
                r"[\u0600-\u06FF]",
                title_ar
            )
        )

        latin_chars = len(
            re.findall(
                r"[A-Za-z]",
                title_ar
            )
        )

        if (
            latin_chars > 15
            and
            latin_chars > arabic_chars * 2
        ):

            print(
                "REJECT ENGLISH TITLE:",
                title_ar
            )

            continue

        if not valid_summary(
            title_ar,
            summary_ar
        ):

            print(
                "REJECT BAD SUMMARY:",
                title_ar[:100]
            )

            continue

        timestamp = article.get(
            "_timestamp",
            0
        )

        final.append({

            "id":
                hashlib.sha256(
                    (
                        article.get(
                            "link",
                            ""
                        )
                    ).encode(
                        "utf-8"
                    )
                ).hexdigest()[:16],

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
# DOWNLOAD ALL ARTICLE IMAGES
# ============================================================

def complete_images(
    articles
):

    print("")
    print(
        "=========================================="
    )

    print(
        "DOWNLOADING NEWS IMAGES"
    )

    print(
        "=========================================="
    )

    for index, article in enumerate(
        articles,
        start=1
    ):

        print("")
        print(
            f"[{index}/{len(articles)}]"
        )

        print(
            article.get(
                "title_ar",
                ""
            )[:100]
        )

        image = get_best_image(
            article
        )

        article["image"] = image

        if image:

            print(
                "IMAGE ✓:",
                image
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

def category_counts(
    articles
):

    result = {}

    for category in CATEGORIES:

        result[category] = len([
            article
            for article in articles
            if article.get(
                "category"
            ) == category
        ])

    return result


# ============================================================
# TRENDING
# ============================================================

def create_trending(
    articles
):

    result = []

    seen = set()

    for category in CATEGORIES:

        category_articles = [
            article
            for article in articles
            if article.get(
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
# SAVE JSON
# ============================================================

def save_news(
    final_news,
    trending
):

    os.makedirs(
        "data",
        exist_ok=True
    )

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

    temp_file = (
        NEWS_FILE
        +
        ".tmp"
    )

    with open(
        temp_file,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            output,
            file,
            ensure_ascii=False,
            indent=2
        )

    os.replace(
        temp_file,
        NEWS_FILE
    )


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
        " RSS + GEMINI + LOCAL IMAGES"
    )

    print(
        "=========================================="
    )

    os.makedirs(
        "data",
        exist_ok=True
    )

    os.makedirs(
        IMAGE_DIR,
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
        "TOTAL SELECTED:",
        len(selected)
    )

    # --------------------------------------------------------
    # 3. GEMINI
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

        final_news.extend(
            results
        )

        print(
            "BATCH RESULT:",
            len(results)
        )

        if batch_number < total_batches:

            time.sleep(
                GEMINI_BATCH_DELAY
            )

    # --------------------------------------------------------
    # 4. CHECK GEMINI RESULT
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

        raise RuntimeError(
            "Not enough valid Arabic news. "
            f"Missing: {missing}"
        )

    # --------------------------------------------------------
    # 5. IMAGES
    # --------------------------------------------------------

    final_news = complete_images(
        final_news
    )

    # --------------------------------------------------------
    # 6. SORT
    # --------------------------------------------------------

    final_news.sort(
        key=lambda item:
            item.get(
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
    # 8. SAVE
    # --------------------------------------------------------

    save_news(
        final_news,
        trending
    )

    # --------------------------------------------------------
    # 9. REPORT
    # --------------------------------------------------------

    images_count = len([
        article
        for article in final_news
        if article.get(
            "image"
        )
    ])

    summaries_count = len([
        article
        for article in final_news
        if valid_summary(
            article.get(
                "title_ar",
                ""
            ),
            article.get(
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
        " NOWNEX FOOTBALL UPDATED SUCCESSFULLY"
    )

    print(
        "=========================================="
    )

    print(
        "NEWS:",
        len(final_news)
    )

    print(
        "IMAGES:",
        images_count,
        "/",
        len(final_news)
    )

    print(
        "SUMMARIES:",
        summaries_count,
        "/",
        len(final_news)
    )

    print(
        "TRENDING:",
        len(trending)
    )

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
