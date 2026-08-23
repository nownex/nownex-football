/* ============================================================
   NOWNEX FOOTBALL — NEWS ENGINE
   مصدر واحد: data/news.json
   الفئات:
   matches / transfers / stars / national / history
   ============================================================ */

(function () {
    "use strict";

    const NEWS_FILE = "data/news.json";

    let articles = [];
    let activeCategory = null;

    const CATEGORY_NAMES = {
        matches: "أخبار المباريات",
        transfers: "أخبار الانتقالات",
        stars: "أخبار النجوم",
        national: "المنتخبات",
        history: "تاريخ كرة القدم"
    };

    const CATEGORY_ICONS = {
        matches: "⚔️",
        transfers: "💰",
        stars: "⭐",
        national: "🌍",
        history: "🏆"
    };

    /* ---------------------------------------------------------
       حماية HTML
       --------------------------------------------------------- */

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* ---------------------------------------------------------
       البيانات
       --------------------------------------------------------- */

    function getTitle(article) {
        return (
            article?.title_ar ||
            article?.title ||
            "خبر كرة القدم"
        );
    }

    function getSummary(article) {
        return (
            article?.summary_ar ||
            article?.summary ||
            article?.description ||
            "لا يوجد ملخص متاح حالياً."
        );
    }

    function getImage(article) {
        return (
            article?.image ||
            article?.image_url ||
            article?.imageUrl ||
            ""
        );
    }

    function getLink(article) {
        return (
            article?.link ||
            article?.url ||
            article?.source_url ||
            article?.sourceUrl ||
            ""
        );
    }

    function getDate(article) {
        return (
            article?.published ||
            article?.date ||
            article?.publishedAt ||
            article?.updatedAt ||
            ""
        );
    }

    function getCategory(article) {
        return String(
            article?.category || ""
        ).trim().toLowerCase();
    }

    function getSource(article) {
        return (
            article?.source ||
            "NOWNEX FOOTBALL"
        );
    }

    /* ---------------------------------------------------------
       التاريخ
       --------------------------------------------------------- */

    function formatDate(value) {
        if (!value) return "";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "";
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

    /* ---------------------------------------------------------
       التحقق
       --------------------------------------------------------- */

    function validArticle(article) {
        return !!(
            article &&
            typeof article === "object" &&
            getTitle(article)
        );
    }

    /* ---------------------------------------------------------
       ترتيب الأخبار من الأحدث إلى الأقدم
       --------------------------------------------------------- */

    function sortNews(list) {
        return [...list].sort((a, b) => {
            const da = new Date(getDate(a)).getTime() || 0;
            const db = new Date(getDate(b)).getTime() || 0;

            return db - da;
        });
    }

    /* ---------------------------------------------------------
       اسم القسم
       --------------------------------------------------------- */

    function categoryName(category) {
        return (
            CATEGORY_NAMES[category] ||
            "أخبار كرة القدم"
        );
    }

    function categoryIcon(category) {
        return (
            CATEGORY_ICONS[category] ||
            "⚽"
        );
    }

    /* ---------------------------------------------------------
       إنشاء الصورة
       --------------------------------------------------------- */

    function imageHTML(article) {

        const image = getImage(article);
        const title = getTitle(article);
        const icon = categoryIcon(
            getCategory(article)
        );

        if (!image) {
            return `
                <div class="image-placeholder">
                    ${icon}
                </div>
            `;
        }

        return `
            <img
                class="trend-image"
                src="${escapeHTML(image)}"
                alt="${escapeHTML(title)}"
                loading="lazy"
                referrerpolicy="no-referrer"
                onerror="
                    this.onerror=null;
                    this.style.display='none';
                    const p=this.nextElementSibling;
                    if(p)p.style.display='grid';
                "
            >

            <div
                class="image-placeholder"
                style="display:none"
            >
                ${icon}
            </div>
        `;
    }

    /* ---------------------------------------------------------
       بطاقة الخبر
       --------------------------------------------------------- */

    function createCard(article, index) {

        const title = getTitle(article);
        const summary = getSummary(article);
        const category = getCategory(article);
        const source = getSource(article);
        const date = formatDate(getDate(article));

        return `
            <article
                class="trend-card nownex-news-card"
                data-index="${index}"
                tabindex="0"
                role="button"
                aria-label="فتح الخبر"
            >

                <div class="trend-image-wrapper">

                    ${imageHTML(article)}

                    <div class="trend-badge">
                        ${categoryIcon(category)}
                        ${escapeHTML(
                            categoryName(category)
                        )}
                    </div>

                </div>

                <div class="trend-card-content">

                    <div class="trend-number">
                        ${String(index + 1).padStart(2, "0")}
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
                                color:#9aa6ba;
                                font-size:13px;
                                line-height:1.8;
                                margin:8px 0 10px;
                            "
                        >
                            ${escapeHTML(summary)}
                        </div>
                        `
                        :
                        ""
                    }

                    <div class="trend-meta">
                        ${escapeHTML(source)}
                        ${
                            date
                            ? " · " + escapeHTML(date)
                            : ""
                        }
                    </div>

                    <div class="news-link">
                        قراءة الخبر ←
                    </div>

                </div>

            </article>
        `;
    }

    /* ---------------------------------------------------------
       عرض الأخبار
       --------------------------------------------------------- */

    function render(list) {

        const grid =
            document.getElementById("newsGrid");

        const counter =
            document.getElementById("newsCount");

        if (!grid) {
            console.error(
                "NOWNEX: newsGrid غير موجود"
            );
            return;
        }

        const sorted = sortNews(list);

        if (counter) {
            counter.textContent =
                `${sorted.length} خبر متاح`;
        }

        if (!sorted.length) {

            grid.innerHTML = `
                <div class="news-empty">

                    <strong>
                        📰 لا توجد أخبار
                    </strong>

                    لا توجد أخبار متاحة في هذا القسم حالياً.

                </div>
            `;

            return;
        }

        /*
         * نعرض جميع الأخبار الموجودة،
         * وليس 9 فقط.
         */

        grid.innerHTML = sorted
            .map((article, index) => {

                return createCard(
                    article,
                    index
                );

            })
            .join("");

        /*
         * ربط البطاقات
         */

        grid
            .querySelectorAll(
                ".nownex-news-card"
            )
            .forEach(card => {

                const index =
                    Number(
                        card.dataset.index
                    );

                const article =
                    sorted[index];

                card.addEventListener(
                    "click",
                    () => {

                        if (
                            typeof window.openArticle ===
                            "function"
                        ) {
                            window.openArticle(
                                article
                            );
                        }

                    }
                );

                card.addEventListener(
                    "keydown",
                    event => {

                        if (
                            event.key === "Enter" ||
                            event.key === " "
                        ) {

                            event.preventDefault();

                            if (
                                typeof window.openArticle ===
                                "function"
                            ) {
                                window.openArticle(
                                    article
                                );
                            }

                        }

                    }
                );

            });
    }

    /* ---------------------------------------------------------
       كل الأخبار
       --------------------------------------------------------- */

    function showAll() {

        activeCategory = null;

        document
            .querySelectorAll(".category-card")
            .forEach(card => {

                card.classList.remove(
                    "active"
                );

            });

        render(articles);
    }

    window.showAllNews = showAll;

    /* ---------------------------------------------------------
       فلترة الأقسام
       --------------------------------------------------------- */

    function filterCategory(category, element) {

        let target = String(
            category || ""
        ).trim();

        /*
         * توافق مع الأسماء القديمة الموجودة
         * في index.html
         */

        const aliases = {

            bigMatches: "matches",

            Matches: "matches",

            transfers: "transfers",

            Transfers: "transfers",

            stars: "stars",

            Stars: "stars",

            world: "national",

            NationalTeams: "national",

            national: "national",

            history: "history",

            History: "history",

            football: null,

            competitions: null,

            starMatches: null

        };

        if (
            Object.prototype.hasOwnProperty.call(
                aliases,
                target
            )
        ) {
            target = aliases[target];
        }

        /*
         * إذا كان القسم القديم لا يقابل
         * قسماً جديداً، نعرض كل الأخبار.
         */

        if (!target) {
            showAll();
            return;
        }

        activeCategory = target;

        document
            .querySelectorAll(".category-card")
            .forEach(card => {

                card.classList.remove(
                    "active"
                );

            });

        if (element) {
            element.classList.add(
                "active"
            );
        }

        const filtered =
            articles.filter(article => {

                return (
                    getCategory(article) ===
                    target
                );

            });

        render(filtered);

        const section =
            document.getElementById(
                "trending"
            );

        if (section) {

            setTimeout(() => {

                section.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }, 80);

        }
    }

    window.filterByCategory =
        filterCategory;

    /* ---------------------------------------------------------
       البحث
       --------------------------------------------------------- */

    function searchNews(query) {

        const q = String(
            query || ""
        )
            .trim()
            .toLowerCase();

        if (!q) {
            render(
                activeCategory
                ?
                articles.filter(
                    a =>
                        getCategory(a) ===
                        activeCategory
                )
                :
                articles
            );

            return;
        }

        const results =
            articles.filter(article => {

                const text = [

                    getTitle(article),

                    getSummary(article),

                    getSource(article),

                    getCategory(article),

                    categoryName(
                        getCategory(article)
                    )

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return text.includes(q);

            });

        render(results);
    }

    function setupSearch() {

        const input =
            document.getElementById(
                "searchInput"
            );

        if (!input) return;

        /*
         * منع إضافة المستمع أكثر من مرة
         */

        if (
            input.dataset.nownexSearch ===
            "1"
        ) {
            return;
        }

        input.dataset.nownexSearch = "1";

        input.addEventListener(
            "input",
            () => {

                searchNews(
                    input.value
                );

            }
        );
    }

    /* ---------------------------------------------------------
       تحميل JSON
       --------------------------------------------------------- */

    async function loadNews() {

        console.log(
            "NOWNEX FOOTBALL: تحميل",
            NEWS_FILE
        );

        try {

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
                    "HTTP " +
                    response.status
                );

            }

            const data =
                await response.json();

            let raw = [];

            /*
             * الشكل الصحيح الحالي:
             *
             * {
             *   updatedAt: "...",
             *   count: 50,
             *   news: [...]
             * }
             */

            if (
                data &&
                Array.isArray(data.news)
            ) {

                raw = data.news;

            }
            else if (
                Array.isArray(data)
            ) {

                raw = data;

            }

            articles =
                raw.filter(
                    validArticle
                );

            /*
             * إزالة الأخبار المكررة
             */

            const seen = new Set();

            articles =
                articles.filter(article => {

                    const key =
                        (
                            getTitle(article) +
                            "|" +
                            getLink(article)
                        )
                            .trim()
                            .toLowerCase();

                    if (seen.has(key)) {
                        return false;
                    }

                    seen.add(key);

                    return true;

                });

            /*
             * جعل البيانات متاحة لباقي الموقع
             */

            window.nownexNews =
                articles;

            console.log(
                "NOWNEX FOOTBALL:",
                articles.length,
                "خبر تم تحميله"
            );

            /*
             * تحديث وقت آخر تحديث
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

                updated.textContent =
                    "آخر تحديث: " +
                    formatDate(
                        data.updatedAt
                    );

            }

            /*
             * عرض الأخبار
             */

            showAll();

            setupSearch();

        }
        catch (error) {

            console.error(
                "NOWNEX FOOTBALL ERROR:",
                error
            );

            const grid =
                document.getElementById(
                    "newsGrid"
                );

            if (grid) {

                grid.innerHTML = `
                    <div class="news-empty">

                        <strong>
                            ⚠️ تعذر تحميل الأخبار
                        </strong>

                        <br>

                        حدث خطأ أثناء قراءة:

                        <br><br>

                        <b>
                            data/news.json
                        </b>

                        <br><br>

                        افتح أدوات المطور للتحقق من الخطأ.

                    </div>
                `;

            }

        }

    }

    /*
     * مهم:
     * نعرّف loadNews عالمياً حتى يستطيع
     * index.html استدعاء المحرك الجديد.
     */

    window.loadNews =
        loadNews;

    /* ---------------------------------------------------------
       التشغيل
       --------------------------------------------------------- */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            loadNews,
            {
                once: true
            }
        );

    }
    else {

        loadNews();

    }

})();
