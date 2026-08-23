document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       NOWNEX FOOTBALL — NEWS ENGINE
       متوافق مع index.html الحالي
       ومتوافق مع data/news.json
    ========================================================= */

    const NEWS_FILE = "data/news.json";


    /* =========================================================
       التصنيفات
    ========================================================= */

    const categories = {

        football: "أخبار كرة القدم",

        stars: "أخبار النجوم",

        world: "الكرة العالمية",

        bigMatches: "قمم كروية",

        competitions: "البطولات الكبرى",

        starMatches: "مباريات النجوم",

        Matches: "أقوى المواجهات",

        Transfers: "أخبار الانتقالات",

        Stars: "أخبار النجوم",

        NationalTeams: "المنتخبات",

        History: "تاريخ في الكرة",

        transfers: "أخبار الانتقالات",

        national: "المنتخبات",

        history: "تاريخ في الكرة"

    };


    /* =========================================================
       أيقونات التصنيفات
    ========================================================= */

    const categoryIcons = {

        football: "⚽",

        stars: "⭐",

        world: "🌍",

        bigMatches: "🔥",

        competitions: "🏆",

        starMatches: "🌟",

        Matches: "⚔️",

        Transfers: "💰",

        Stars: "⭐",

        NationalTeams: "🌍",

        History: "🏆",

        transfers: "💰",

        national: "🌍",

        history: "🏆"

    };


    /* =========================================================
       حماية HTML
    ========================================================= */

    function escapeHTML(value) {

        return String(value ?? "")

            .replace(/&/g, "&amp;")

            .replace(/</g, "&lt;")

            .replace(/>/g, "&gt;")

            .replace(/"/g, "&quot;")

            .replace(/'/g, "&#039;");
    }


    /* =========================================================
       التاريخ
    ========================================================= */

    function formatDate(date) {

        if (!date) {
            return "";
        }

        const d = new Date(date);

        if (isNaN(d.getTime())) {
            return "";
        }

        return d.toLocaleDateString(
            "ar-DZ",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
    }


    /* =========================================================
       الوقت
    ========================================================= */

    function formatTime(date) {

        if (!date) {
            return "";
        }

        const d = new Date(date);

        if (isNaN(d.getTime())) {
            return "";
        }

        return d.toLocaleTimeString(
            "ar-DZ",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    }


    /* =========================================================
       التحقق من الخبر
    ========================================================= */

    function isValidArticle(article) {

        return (

            article &&

            typeof article === "object" &&

            (

                article.title ||

                article.title_ar

            ) &&

            article.category

        );
    }


    /* =========================================================
       الحصول على العنوان العربي
    ========================================================= */

    function getTitle(article) {

        return (

            article.title_ar ||

            article.title ||

            "خبر كرة القدم"

        );
    }


    /* =========================================================
       الحصول على الملخص
    ========================================================= */

    function getSummary(article) {

        return (

            article.summary_ar ||

            article.summary ||

            article.description ||

            ""

        );
    }


    /* =========================================================
       الحصول على التاريخ
    ========================================================= */

    function getArticleDate(article) {

        return (

            article.publishedAt ||

            article.published ||

            article.date ||

            article.createdAt ||

            ""

        );
    }


    /* =========================================================
       إنشاء صورة الخبر
    ========================================================= */

    function createNewsImage(article) {

        const icon =

            categoryIcons[
                article.category
            ] || "⚽";


        const image =

            article.image ||

            article.image_url ||

            article.thumbnail ||

            "";


        if (image.trim() !== "") {

            return `

                <img

                    class="trend-image"

                    src="${escapeHTML(image)}"

                    alt="${escapeHTML(
                        getTitle(article)
                    )}"

                    loading="lazy"

                    referrerpolicy="no-referrer"

                    onerror="

                        this.onerror=null;

                        this.style.display='none';

                        const p=this.parentElement.querySelector('.news-image-placeholder');

                        if(p)p.style.display='flex';

                    "

                >

                <div

                    class="news-image-placeholder"

                    style="

                        display:none;

                        width:100%;

                        height:100%;

                        align-items:center;

                        justify-content:center;

                        font-size:55px;

                        background:#071126;

                    "

                >

                    ${icon}

                </div>

            `;

        }


        return `

            <div

                class="news-image-placeholder"

                style="

                    width:100%;

                    height:100%;

                    display:flex;

                    align-items:center;

                    justify-content:center;

                    font-size:55px;

                    background:#071126;

                "

            >

                ${icon}

            </div>

        `;
    }


    /* =========================================================
       إنشاء بطاقة الخبر
       
       مهم جدًا:
       البطاقة نفسها تستدعي openArticle(article)
    ========================================================= */

    function createNewsCard(article, index = 0) {

        if (!isValidArticle(article)) {
            return "";
        }


        const title =
            getTitle(article);


        const summary =
            getSummary(article);


        const categoryName =

            categories[
                article.category
            ] ||

            "أخبار كرة القدم";


        const icon =

            categoryIcons[
                article.category
            ] ||

            "⚽";


        const date =

            formatDate(
                getArticleDate(article)
            );


        const time =

            formatTime(
                getArticleDate(article)
            );


        const source =

            article.source ||

            "NOWNEX FOOTBALL";


        /*
         * نحتفظ بالمقال داخل رقم داخلي.
         * لكن الفتح يتم من خلال window.nownexArticles.
         */

        const articleIndex =

            window.nownexArticles.indexOf(
                article
            );


        return `

            <article

                class="trend-card news-card"

                data-category="${escapeHTML(
                    article.category
                )}"

                data-article-index="${articleIndex}"

                tabindex="0"

                role="button"

                aria-label="فتح الخبر"

                onclick="window.openNownexArticle(${articleIndex})"

                onkeydown="

                    if(event.key==='Enter' || event.key===' '){

                        event.preventDefault();

                        window.openNownexArticle(${articleIndex});

                    }

                "

            >


                <!-- =================================================
                     IMAGE
                ================================================== -->

                <div class="trend-image-wrapper">

                    ${createNewsImage(article)}


                    <div

                        style="

                            position:absolute;

                            top:12px;

                            right:12px;

                            z-index:5;

                            padding:6px 10px;

                            border-radius:20px;

                            background:rgba(2,7,20,.78);

                            border:1px solid rgba(255,255,255,.12);

                            color:#ffd978;

                            font-size:10px;

                            font-weight:800;

                            backdrop-filter:blur(8px);

                        "

                    >

                        ${icon}

                        ${escapeHTML(
                            categoryName
                        )}

                    </div>


                </div>


                <!-- =================================================
                     CONTENT
                ================================================== -->

                <div class="trend-card-content">


                    <div class="trend-number">

                        ${String(
                            index + 1
                        ).padStart(2, "0")}

                    </div>


                    <div class="trend-icon">

                        ${icon}

                    </div>


                    <h3>

                        ${escapeHTML(title)}

                    </h3>


                    ${
                        summary

                        ?

                        `

                            <div

                                style="

                                    color:#9aa7bc;

                                    font-size:11px;

                                    line-height:1.7;

                                    margin-top:6px;

                                "

                            >

                                ${escapeHTML(
                                    summary
                                ).substring(
                                    0,
                                    150
                                )}

                                ${
                                    summary.length > 150
                                    ? "..."
                                    : ""
                                }

                            </div>

                        `

                        :

                        ""

                    }


                    <div class="trend-meta">

                        ${escapeHTML(source)}

                        ${
                            date
                            ? ` · ${escapeHTML(date)}`
                            : ""
                        }

                        ${
                            time
                            ? ` · ${escapeHTML(time)}`
                            : ""
                        }

                    </div>


                    <span class="news-link">

                        اقرأ الخبر

                        ←

                    </span>


                </div>


            </article>

        `;
    }


    /* =========================================================
       ترتيب الأخبار
    ========================================================= */

    function sortByDate(articles) {

        return [...articles].sort(

            (a, b) => {

                const dateA =

                    new Date(
                        getArticleDate(a) || 0
                    ).getTime();


                const dateB =

                    new Date(
                        getArticleDate(b) || 0
                    ).getTime();


                return dateB - dateA;

            }

        );
    }


    /* =========================================================
       حفظ الأخبار عالميًا
       
       هذا مهم جدًا للبحث وفتح البطاقات
    ========================================================= */

    function exposeNews(articles) {

        window.nownexNews = articles;

        window.nownexArticles = articles;

    }


    /* =========================================================
       فتح الخبر
       
       هذه هي النقطة الأساسية التي كانت ناقصة
    ========================================================= */

    window.openNownexArticle = function(index) {

        const article =

            window.nownexArticles &&
            window.nownexArticles[index];


        if (!article) {

            console.error(
                "NOWNEX: لم يتم العثور على الخبر:",
                index
            );

            return;

        }


        /*
         * استخدام openArticle الموجودة في index.html
         */

        if (
            typeof window.openArticle ===
            "function"
        ) {

            window.openArticle(article);

            return;

        }


        console.error(
            "NOWNEX: openArticle غير موجودة."
        );

    };


    /* =========================================================
       عرض آخر الأخبار في newsGrid
    ========================================================= */

    function renderMainNews(articles, limit = 9) {

        const grid =

            document.getElementById(
                "newsGrid"
            );


        if (!grid) {

            console.warn(
                "NOWNEX: newsGrid غير موجود."
            );

            return;

        }


        const sorted =

            sortByDate(articles);


        const latest =

            sorted.slice(
                0,
                limit
            );


        if (!latest.length) {

            grid.innerHTML = `

                <div class="empty-news">

                    <strong>

                        لا توجد أخبار حاليًا

                    </strong>

                    سيتم تحديث الأخبار تلقائيًا.

                </div>

            `;

            return;

        }


        grid.innerHTML =

            latest

                .map(
                    (article, index) =>

                        createNewsCard(
                            article,
                            index
                        )
                )

                .join("");

    }


    /* =========================================================
       تحديث عداد الأخبار
    ========================================================= */

    function updateNewsCount(articles) {

        const counter =

            document.getElementById(
                "newsCount"
            );


        if (!counter) {
            return;
        }


        counter.textContent =

            `${articles.length} خبر متاح`;
    }


    /* =========================================================
       عرض تصنيف معين
    ========================================================= */

    function renderFilteredCategory(category) {

        const grid =

            document.getElementById(
                "newsGrid"
            );


        if (!grid) {
            return;
        }


        const filtered =

            sortByDate(

                window.nownexArticles.filter(

                    article => {

                        const articleCategory =

                            String(
                                article.category ||
                                ""
                            ).toLowerCase();


                        const requestedCategory =

                            String(
                                category ||
                                ""
                            ).toLowerCase();


                        /*
                         * التصنيفات المتوافقة
                         */

                        const aliases = {

                            matches: [
                                "matches",
                                "bigmatches",
                                "bigMatches".toLowerCase()
                            ],

                            transfers: [
                                "transfers",
                                "transfer"
                            ],

                            stars: [
                                "stars"
                            ],

                            nationalteams: [
                                "nationalteams",
                                "national",
                                "national_teams"
                            ],

                            history: [
                                "history"
                            ]

                        };


                        if (
                            aliases[
                                requestedCategory
                            ]
                        ) {

                            return aliases[
                                requestedCategory
                            ].includes(
                                articleCategory
                            );

                        }


                        return (

                            articleCategory ===
                            requestedCategory

                        );

                    }

                )

            );


        /*
         * تفعيل البطاقة المختارة
         */

        document
            .querySelectorAll(
                ".category-card"
            )
            .forEach(card => {

                card.classList.remove(
                    "active"
                );

            });


        if (!filtered.length) {

            grid.innerHTML = `

                <div class="empty-news">

                    <strong>

                        لا توجد أخبار في هذا القسم

                    </strong>

                    سيتم عرض الأخبار الجديدة
                    عند توفرها.

                </div>

            `;

            return;

        }


        grid.innerHTML =

            filtered

                .map(
                    (article, index) =>

                        createNewsCard(
                            article,
                            index
                        )
                )

                .join("");


        /*
         * النزول إلى الأخبار
         */

        const section =

            document.getElementById(
                "trending"
            );


        if (section) {

            section.scrollIntoView({

                behavior: "smooth",

                block: "start"

            });

        }

    }


    /* =========================================================
       filterByCategory
       
       كانت مستعملة في index.html لكنها غير موجودة
    ========================================================= */

    window.filterByCategory = function(
        category,
        element
    ) {

        /*
         * إزالة الحالة من جميع البطاقات
         */

        document
            .querySelectorAll(
                ".category-card"
            )
            .forEach(card => {

                card.classList.remove(
                    "active"
                );

            });


        /*
         * تفعيل البطاقة
         */

        if (element) {

            element.classList.add(
                "active"
            );

        }


        /*
         * عرض القسم
         */

        renderFilteredCategory(
            category
        );

    };


    /* =========================================================
       عرض جميع الأخبار
       
       مرتبطة بزر "عرض الكل"
    ========================================================= */

    window.showAllNews = function() {

        if (
            !Array.isArray(
                window.nownexArticles
            )
        ) {

            return;

        }


        /*
         * إزالة active
         */

        document
            .querySelectorAll(
                ".category-card"
            )
            .forEach(card => {

                card.classList.remove(
                    "active"
                );

            });


        renderMainNews(

            window.nownexArticles,

            window.nownexArticles.length

        );

    };


    /* =========================================================
       دعم البحث القديم
    ========================================================= */

    function setupOldSearch(articles) {

        const input =

            document.querySelector(
                "#newsSearch"
            );


        if (!input) {
            return;
        }


        input.addEventListener(
            "input",
            () => {

                const query =

                    input.value
                        .trim()
                        .toLowerCase();


                if (!query) {

                    renderMainNews(
                        articles
                    );

                    return;

                }


                const results =

                    articles.filter(
                        article => {

                            const text = [

                                article.title,

                                article.title_ar,

                                article.summary,

                                article.summary_ar,

                                article.description,

                                article.source,

                                article.category

                            ]

                                .filter(Boolean)

                                .join(" ")

                                .toLowerCase();


                            return text.includes(
                                query
                            );

                        }
                    );


                renderSearchResultsInGrid(
                    results
                );

            }
        );

    }


    /* =========================================================
       عرض نتائج البحث داخل newsGrid
    ========================================================= */

    function renderSearchResultsInGrid(
        results
    ) {

        const grid =

            document.getElementById(
                "newsGrid"
            );


        if (!grid) {
            return;
        }


        if (!results.length) {

            grid.innerHTML = `

                <div class="empty-news">

                    <strong>

                        لم نجد أخبارًا مطابقة

                    </strong>

                    جرّب كلمة بحث أخرى.

                </div>

            `;

            return;

        }


        grid.innerHTML =

            sortByDate(results)

                .map(
                    (article, index) =>

                        createNewsCard(
                            article,
                            index
                        )
                )

                .join("");

    }


    /* =========================================================
       تحميل الأخبار
    ========================================================= */

    async function loadNews() {

        try {

            console.log(
                "NOWNEX: جاري تحميل الأخبار..."
            );


            const response =

                await fetch(

                    NEWS_FILE +

                    "?v=" +

                    Date.now(),

                    {

                        cache: "no-store"

                    }

                );


            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );

            }


            const data =

                await response.json();


            /*
             * دعم:
             *
             * {
             *   "news": [...]
             * }
             *
             * وأيضًا المصفوفة المباشرة
             */

            const rawArticles =

                Array.isArray(data)

                    ?

                data

                    :

                Array.isArray(data.news)

                    ?

                data.news

                    :

                [];


            const articles =

                rawArticles.filter(
                    isValidArticle
                );


            /*
             * حفظ الأخبار عالميًا
             */

            exposeNews(
                articles
            );


            console.log(

                `NOWNEX: تم تحميل ${articles.length} خبر`

            );


            /*
             * عرض الأخبار الرئيسية
             */

            renderMainNews(
                articles,
                9
            );


            /*
             * تحديث العدد
             */

            updateNewsCount(
                articles
            );


            /*
             * البحث
             */

            setupOldSearch(
                articles
            );


            /*
             * تحديث العناصر الأخرى إن وجدت
             */

            updateOptionalElements(
                data,
                articles
            );


        }

        catch (error) {

            console.error(
                "NOWNEX News Error:",
                error
            );


            /*
             * مهم:
             * لا نترك الشاشة فارغة بدون تفسير
             */

            const grid =

                document.getElementById(
                    "newsGrid"
                );


            if (grid) {

                grid.innerHTML = `

                    <div class="empty-news">

                        <strong>

                            ⚠️ تعذر تحميل الأخبار

                        </strong>

                        تأكد من وجود الملف:

                        <br>

                        <code>
                            data/news.json
                        </code>

                        <br><br>

                        ثم أعد تحميل الصفحة.

                    </div>

                `;

            }

        }

    }


    /* =========================================================
       تحديث عناصر اختيارية
    ========================================================= */

    function updateOptionalElements(
        data,
        articles
    ) {

        /*
         * newsUpdated
         */

        const updated =

            document.getElementById(
                "newsUpdated"
            );


        if (
            updated &&
            data &&
            data.updatedAt
        ) {

            const date =

                formatDate(
                    data.updatedAt
                );


            const time =

                formatTime(
                    data.updatedAt
                );


            if (date) {

                updated.textContent =

                    `آخر تحديث: ${date}` +

                    (

                        time
                            ? ` - ${time}`
                            : ""

                    );

            }

        }


        /*
         * عدادات الأقسام إن وجدت
         */

        document
            .querySelectorAll(
                "[data-news-count]"
            )
            .forEach(counter => {

                const category =

                    counter.dataset.newsCount;


                const count =

                    articles.filter(
                        article =>
                            article.category ===
                            category
                    ).length;


                counter.textContent =
                    count;

            });

    }


    /* =========================================================
       تشغيل
    ========================================================= */

    loadNews();


});
