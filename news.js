document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       NOWNEX FOOTBALL — NEWS ENGINE
       مصدر الأخبار:
       data/news.json

       التحديث:
       كل 10 دقائق
    ===================================================== */

    const NEWS_FILE = "data/news.json";

    const NEWS_REFRESH_TIME = 10 * 60 * 1000;


    /* =====================================================
       CATEGORIES
    ===================================================== */

    const CATEGORY_NAMES = {

        Matches:
            "أقوى المواجهات",

        bigMatches:
            "أقوى المواجهات",

        starMatches:
            "أقوى المواجهات",

        Transfers:
            "أخبار الانتقالات",

        transfers:
            "أخبار الانتقالات",

        transfer:
            "أخبار الانتقالات",

        Stars:
            "أخبار النجوم",

        stars:
            "أخبار النجوم",

        Players:
            "أخبار النجوم",

        NationalTeams:
            "المنتخبات",

        nationalTeams:
            "المنتخبات",

        national:
            "المنتخبات",

        WorldCup:
            "المنتخبات",

        competitions:
            "المنتخبات",

        History:
            "تاريخ في الكرة",

        history:
            "تاريخ في الكرة",

        legends:
            "تاريخ في الكرة",

        football:
            "أخبار كرة القدم",

        world:
            "الكرة العالمية"

    };


    /* =====================================================
       CATEGORY ICONS
    ===================================================== */

    const CATEGORY_ICONS = {

        Matches:
            "⚔️",

        bigMatches:
            "⚔️",

        starMatches:
            "⚔️",

        Transfers:
            "💰",

        transfers:
            "💰",

        transfer:
            "💰",

        Stars:
            "⭐",

        stars:
            "⭐",

        Players:
            "⭐",

        NationalTeams:
            "🌍",

        nationalTeams:
            "🌍",

        national:
            "🌍",

        WorldCup:
            "🌍",

        competitions:
            "🌍",

        History:
            "🏆",

        history:
            "🏆",

        legends:
            "🏆",

        football:
            "⚽",

        world:
            "🌍"

    };


    /* =====================================================
       CURRENT DATA
    ===================================================== */

    let allNews = [];

    let currentCategory = null;


    /* =====================================================
       SECURITY
    ===================================================== */

    function escapeHTML(value) {

        return String(value ?? "")

            .replace(/&/g, "&amp;")

            .replace(/</g, "&lt;")

            .replace(/>/g, "&gt;")

            .replace(/"/g, "&quot;")

            .replace(/'/g, "&#039;");

    }


    function safeURL(value) {

        try {

            const url =
                new URL(
                    String(value || "#"),
                    window.location.href
                );


            if (
                url.protocol === "http:" ||
                url.protocol === "https:"
            ) {

                return url.href;

            }

        }

        catch (error) {}

        return "#";

    }


    /* =====================================================
       TEXT CLEANING
    ===================================================== */

    function cleanText(value) {

        return String(value || "")

            .replace(/\r\n/g, "\n")

            .replace(/\u00A0/g, " ")

            .replace(/\n+/g, " ")

            .replace(/[ \t]+/g, " ")

            .trim();

    }


    /* =====================================================
       TITLE
    ===================================================== */

    function getTitle(article) {

        if (!article) {

            return "خبر كرة قدم";

        }


        return cleanText(

            article.title_ar ||

            article.title ||

            article.headline ||

            "خبر كرة قدم"

        );

    }


    /* =====================================================
       SUMMARY
    ===================================================== */

    function getSummary(article) {

        if (!article) {

            return "لا يوجد ملخص متاح حالياً.";

        }


        return cleanText(

            article.summary_ar ||

            article.summary ||

            article.description ||

            "لا يوجد ملخص متاح لهذا الخبر حالياً."

        );

    }


    /* =====================================================
       SOURCE
    ===================================================== */

    function getSource(article) {

        return cleanText(

            article.source ||

            article.publisher ||

            article.site ||

            "NOWNEX FOOTBALL"

        );

    }


    /* =====================================================
       IMAGE
    ===================================================== */

    function getImage(article) {

        if (!article) {

            return "";

        }


        return (

            article.image ||

            article.image_url ||

            article.thumbnail ||

            article.urlToImage ||

            ""

        );

    }


    /* =====================================================
       LINK
    ===================================================== */

    function getLink(article) {

        if (!article) {

            return "#";

        }


        return safeURL(

            article.link ||

            article.url ||

            article.source_url ||

            "#"

        );

    }


    /* =====================================================
       DATE
    ===================================================== */

    function getDate(article) {

        if (!article) {

            return "";

        }


        return (

            article.published ||

            article.date ||

            article.publishedAt ||

            article.createdAt ||

            ""

        );

    }


    function formatDate(value) {

        const raw =
            cleanText(value);


        if (!raw) {

            return "";

        }


        const date =
            new Date(raw);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return raw;

        }


        return new Intl.DateTimeFormat(

            "ar-DZ",

            {

                year: "numeric",

                month: "short",

                day: "numeric",

                hour: "2-digit",

                minute: "2-digit"

            }

        ).format(date);

    }


    /* =====================================================
       CATEGORY
    ===================================================== */

    function getCategory(article) {

        const raw =
            String(
                article?.category ||
                article?.type ||
                "football"
            ).trim();


        return raw;

    }


    function categoryName(category) {

        return (

            CATEGORY_NAMES[category] ||

            CATEGORY_NAMES[
                String(category)
                    .toLowerCase()
            ] ||

            category ||

            "أخبار كرة القدم"

        );

    }


    function categoryIcon(category) {

        return (

            CATEGORY_ICONS[category] ||

            CATEGORY_ICONS[
                String(category)
                    .toLowerCase()
            ] ||

            "⚽"

        );

    }


    /* =====================================================
       CATEGORY MATCHING
    ===================================================== */

    function matchesCategory(
        article,
        requestedCategory
    ) {

        const category =
            String(
                getCategory(article)
            ).toLowerCase();


        const requested =
            String(
                requestedCategory
            ).toLowerCase();


        if (
            requested === "matches"
        ) {

            return [

                "matches",
                "match",
                "bigmatches",
                "big_matches",
                "starmatches",
                "fixtures"

            ].includes(category);

        }


        if (
            requested === "transfers"
        ) {

            return [

                "transfers",
                "transfer",
                "mercato",
                "rumors",
                "rumours"

            ].includes(category);

        }


        if (
            requested === "stars"
        ) {

            return [

                "stars",
                "star",
                "players",
                "player"

            ].includes(category);

        }


        if (
            requested === "nationalteams"
        ) {

            return [

                "nationalteams",
                "national",
                "national_teams",
                "worldcup",
                "africa",
                "asia",
                "competitions"

            ].includes(category);

        }


        if (
            requested === "history"
        ) {

            return [

                "history",
                "legends",
                "legend",
                "historic"

            ].includes(category);

        }


        return category === requested;

    }


    /* =====================================================
       SORT NEWS
    ===================================================== */

    function sortNews(news) {

        return [...news].sort(
            (a, b) => {

                const dateA =
                    new Date(
                        getDate(a) || 0
                    ).getTime();


                const dateB =
                    new Date(
                        getDate(b) || 0
                    ).getTime();


                return dateB - dateA;

            }
        );

    }


    /* =====================================================
       CREATE IMAGE
    ===================================================== */

    function createImage(article) {

        const image =
            getImage(article);


        if (!image) {

            return `

                <div class="trend-image-wrapper">

                    <div
                        style="
                            width:100%;
                            height:100%;
                            display:grid;
                            place-items:center;
                            font-size:55px;
                            background:
                                radial-gradient(
                                    circle,
                                    rgba(20,140,255,.18),
                                    transparent 65%
                                ),
                                #071126;
                        "
                    >

                        ${categoryIcon(
                            getCategory(article)
                        )}

                    </div>

                </div>

            `;

        }


        const url =
            safeURL(image);


        if (url === "#") {

            return "";

        }


        return `

            <div class="trend-image-wrapper">

                <img

                    class="trend-image"

                    src="${escapeHTML(url)}"

                    alt="${escapeHTML(
                        getTitle(article)
                    )}"

                    loading="lazy"

                    decoding="async"

                    referrerpolicy="no-referrer"

                    onerror="
                        this.parentElement.style.display='none';
                    "

                >

            </div>

        `;

    }


    /* =====================================================
       CREATE NEWS CARD
    ===================================================== */

    function createNewsCard(
        article,
        index
    ) {

        const category =
            getCategory(article);


        const title =
            getTitle(article);


        const source =
            getSource(article);


        const date =
            formatDate(
                getDate(article)
            );


        const icon =
            categoryIcon(
                category
            );


        return `

            <article
                class="trend-card"
                data-news-index="${index}"
            >

                ${createImage(article)}


                <div
                    class="trend-card-content"
                >

                    <div
                        class="trend-number"
                    >

                        ${String(
                            index + 1
                        ).padStart(2, "0")}

                        —

                        NOWNEX FOOTBALL

                    </div>


                    <div
                        class="trend-icon"
                    >

                        ${icon}

                    </div>


                    <h3>

                        ${escapeHTML(
                            title
                        )}

                    </h3>


                    <div
                        class="trend-meta"
                    >

                        ${escapeHTML(
                            categoryName(
                                category
                            )
                        )}

                        ·

                        ${escapeHTML(
                            source
                        )}

                        ${
                            date
                                ? `
                                    ·
                                    ${escapeHTML(
                                        date
                                    )}
                                  `
                                : ""
                        }

                    </div>


                    <a
                        href="#"
                        class="news-link"
                        data-news-index="${index}"
                    >

                        اقرأ الخبر ←

                    </a>

                </div>

            </article>

        `;

    }


    /* =====================================================
       OPEN ARTICLE
       نعتمد على openArticle الموجودة في index.html
    ===================================================== */

    function attachCardEvents() {

        document
            .querySelectorAll(
                "[data-news-index]"
            )
            .forEach(element => {

                element.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();


                        const index =
                            Number(
                                element.dataset
                                    .newsIndex
                            );


                        const article =
                            allNews[index];


                        if (
                            article &&
                            typeof window.openArticle ===
                            "function"
                        ) {

                            window.openArticle(
                                article
                            );

                        }

                    }
                );

            });

    }


    /* =====================================================
       RENDER MAIN NEWS
    ===================================================== */

    function renderNews(
        articles
    ) {

        const grid =
            document.getElementById(
                "newsGrid"
            );


        if (!grid) {

            return;

        }


        let filtered =
            [...articles];


        if (currentCategory) {

            filtered =
                filtered.filter(
                    article =>
                        matchesCategory(
                            article,
                            currentCategory
                        )
                );

        }


        filtered =
            sortNews(filtered);


        if (!filtered.length) {

            grid.innerHTML = `

                <div class="empty-news">

                    <strong>

                        لا توجد أخبار في هذا القسم حالياً

                    </strong>

                    سيتم تحديث المحتوى
                    تلقائياً عند وصول أخبار جديدة.

                </div>

            `;


            updateNewsCount(0);

            return;

        }


        /*
         * عرض آخر الأخبار
         */

        const visible =
            filtered.slice(0, 30);


        grid.innerHTML =
            visible
                .map(
                    (article, index) =>
                        createNewsCard(
                            article,
                            allNews.indexOf(
                                article
                            )
                        )
                )
                .join("");


        attachCardEvents();


        updateNewsCount(
            filtered.length
        );

    }


    /* =====================================================
       NEWS COUNT
    ===================================================== */

    function updateNewsCount(
        number
    ) {

        const element =
            document.getElementById(
                "newsCount"
            );


        if (!element) {

            return;

        }


        element.textContent =
            `${number} خبر`;

    }


    /* =====================================================
       PUBLIC CATEGORY FILTER
       حتى تعمل أزرار index.html
    ===================================================== */

    window.filterByCategory =
        function (
            category,
            clickedElement
        ) {

            currentCategory =
                category;


            document
                .querySelectorAll(
                    ".category-card"
                )
                .forEach(card => {

                    card.style.borderColor =
                        "";

                });


            if (clickedElement) {

                clickedElement.style.borderColor =
                    "rgba(217,180,91,.75)";

            }


            renderNews(
                allNews
            );


            setTimeout(() => {

                const section =
                    document.getElementById(
                        "trending"
                    );


                if (section) {

                    section.scrollIntoView({

                        behavior:
                            "smooth",

                        block:
                            "start"

                    });

                }

            }, 80);

        };


    /* =====================================================
       SHOW ALL
    ===================================================== */

    window.showAllNews =
        function () {

            currentCategory =
                null;


            document
                .querySelectorAll(
                    ".category-card"
                )
                .forEach(card => {

                    card.style.borderColor =
                        "";

                });


            renderNews(
                allNews
            );

        };


    /* =====================================================
       LOAD NEWS
    ===================================================== */

    async function loadNews() {

        try {

            const response =
                await fetch(

                    NEWS_FILE +
                    "?v=" +
                    Date.now(),

                    {

                        cache:
                            "no-store"

                    }

                );


            if (!response.ok) {

                throw new Error(

                    "News file unavailable: " +
                    response.status

                );

            }


            const data =
                await response.json();


            if (
                Array.isArray(
                    data.news
                )
            ) {

                allNews =
                    data.news;

            }

            else if (
                Array.isArray(data)
            ) {

                allNews =
                    data;

            }

            else {

                allNews =
                    [];

            }


            /*
             * تنظيف الأخبار
             */

            allNews =
                allNews.filter(
                    article =>
                        article &&
                        (
                            article.title ||
                            article.title_ar
                        )
                );


            console.log(

                "NOWNEX FOOTBALL:",

                allNews.length,

                "news loaded."

            );


            /*
             * عرض الأخبار
             */

            renderNews(
                allNews
            );


            /*
             * تحديث وقت الأخبار
             */

            const updated =
                document.getElementById(
                    "newsUpdated"
                );


            if (
                updated &&
                data.updatedAt
            ) {

                updated.textContent =
                    "آخر تحديث: " +
                    formatDate(
                        data.updatedAt
                    );

            }


        }

        catch (error) {

            console.error(

                "NOWNEX FOOTBALL NEWS:",
                error

            );


            const grid =
                document.getElementById(
                    "newsGrid"
                );


            if (grid) {

                grid.innerHTML = `

                    <div
                        class="empty-news"
                    >

                        <strong>

                            تعذر تحميل الأخبار حالياً

                        </strong>

                        سيتم إعادة المحاولة
                        تلقائياً.

                    </div>

                `;

            }

        }

    }


    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    loadNews();


    /* =====================================================
       AUTO UPDATE
       كل 10 دقائق
    ===================================================== */

    setInterval(

        loadNews,

        NEWS_REFRESH_TIME

    );


    /* =====================================================
       MANUAL REFRESH
       يمكن استدعاؤها من الخارج
    ===================================================== */

    window.refreshNownexNews =
        loadNews;

});
