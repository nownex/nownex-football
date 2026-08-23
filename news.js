document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       NOWNEX FOOTBALL — NEWS SYSTEM
       Compatible with data/news.json
       ========================================================= */

    const NEWS_FILE = "data/news.json";

    /* =========================================================
       التصنيفات
       يجب أن تطابق category الموجودة في news.json
       ========================================================= */

    const categories = {
        football: "أخبار كرة القدم",
        stars: "أخبار النجوم",
        world: "الكرة العالمية",
        bigMatches: "قمم كروية",
        competitions: "البطولات الكبرى",
        starMatches: "مباريات النجوم"
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
        starMatches: "🌟"
    };


    /* =========================================================
       حماية النصوص من HTML
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
       تنسيق التاريخ
       ========================================================= */

    function formatDate(date) {

        if (!date) return "";

        const d = new Date(date);

        if (isNaN(d.getTime())) {
            return "";
        }

        return d.toLocaleDateString("ar-DZ", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }


    /* =========================================================
       تنسيق الوقت
       ========================================================= */

    function formatTime(date) {

        if (!date) return "";

        const d = new Date(date);

        if (isNaN(d.getTime())) {
            return "";
        }

        return d.toLocaleTimeString("ar-DZ", {
            hour: "2-digit",
            minute: "2-digit"
        });
    }


    /* =========================================================
       التحقق من الخبر
       ========================================================= */

    function isValidArticle(article) {

        return (
            article &&
            typeof article === "object" &&
            article.title &&
            article.category
        );
    }


    /* =========================================================
       إنشاء صورة الخبر
       ========================================================= */

    function createNewsImage(article) {

        const icon =
            categoryIcons[article.category] || "📰";

        /*
         * إذا كان هناك رابط صورة
         */

        if (article.image && article.image.trim() !== "") {

            return `
                <img
                    src="${escapeHTML(article.image)}"
                    alt="${escapeHTML(article.title)}"
                    loading="lazy"
                    onerror="
                        this.onerror=null;
                        this.style.display='none';
                        this.parentElement
                            .querySelector('.news-image-placeholder')
                            .style.display='flex';
                    "
                >

                <div
                    class="news-image-placeholder"
                    style="display:none;"
                >
                    <span>${icon}</span>
                </div>
            `;
        }


        /*
         * إذا لم توجد صورة
         */

        return `
            <div class="news-image-placeholder">
                <span>${icon}</span>
            </div>
        `;
    }


    /* =========================================================
       إنشاء بطاقة خبر
       ========================================================= */

    function createNewsCard(article) {

        if (!isValidArticle(article)) {
            return "";
        }


        const categoryName =
            categories[article.category] ||
            "أخبار كرة القدم";


        const date =
            formatDate(article.date);


        const time =
            formatTime(article.date);


        const source =
            article.source ||
            "NOWNEX";


        const description =
            article.description ||
            "";


        const url =
            article.url ||
            "";


        return `
            <article
                class="news-card"
                data-category="${escapeHTML(article.category)}"
            >

                <!-- صورة الخبر -->

                <div class="news-image">

                    ${createNewsImage(article)}

                    <span class="news-image-category">
                        ${escapeHTML(categoryName)}
                    </span>

                </div>


                <!-- محتوى الخبر -->

                <div class="news-content">

                    <!-- معلومات الخبر -->

                    <div class="news-meta">

                        <span class="news-category">
                            ${escapeHTML(categoryName)}
                        </span>

                        ${
                            date
                            ? `
                                <span class="news-date">
                                    ${escapeHTML(date)}
                                </span>
                              `
                            : ""
                        }

                    </div>


                    <!-- العنوان -->

                    <h3 class="news-title">

                        ${escapeHTML(article.title)}

                    </h3>


                    <!-- الوصف -->

                    ${
                        description
                        ? `
                            <p class="news-description">
                                ${escapeHTML(description)}
                            </p>
                          `
                        : ""
                    }


                    <!-- أسفل البطاقة -->

                    <div class="news-footer">

                        <span class="news-source">

                            ${escapeHTML(source)}

                        </span>


                        ${
                            time
                            ? `
                                <span class="news-time">
                                    ${escapeHTML(time)}
                                </span>
                              `
                            : ""
                        }

                    </div>


                    <!-- رابط الخبر -->

                    ${
                        url
                        ? `
                            <a
                                class="news-read-more"
                                href="${escapeHTML(url)}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                اقرأ الخبر
                                <span>←</span>
                            </a>
                          `
                        : ""
                    }

                </div>

            </article>
        `;
    }


    /* =========================================================
       ترتيب الأخبار
       الأحدث أولًا
       ========================================================= */

    function sortByDate(articles) {

        return [...articles].sort((a, b) => {

            const dateA =
                new Date(a.date || 0).getTime();

            const dateB =
                new Date(b.date || 0).getTime();

            return dateB - dateA;
        });
    }


    /* =========================================================
       عرض قسم محدد
       ========================================================= */

    function renderCategory(
        category,
        articles,
        limit = 6
    ) {

        const grid =
            document.querySelector(
                `[data-news-category="${category}"]`
            );


        if (!grid) {
            return;
        }


        const filtered =
            articles
                .filter(article =>
                    article.category === category
                );


        const sorted =
            sortByDate(filtered);


        const limited =
            sorted.slice(0, limit);


        /*
         * لا توجد أخبار
         */

        if (!limited.length) {

            grid.innerHTML = `
                <div class="news-empty">

                    <div class="news-empty-icon">
                        ${categoryIcons[category] || "📰"}
                    </div>

                    <p>
                        لا توجد أخبار جديدة حاليًا.
                    </p>

                </div>
            `;

            return;
        }


        /*
         * عرض الأخبار
         */

        grid.innerHTML =
            limited
                .map(createNewsCard)
                .join("");
    }


    /* =========================================================
       عرض جميع الأقسام
       ========================================================= */

    function renderAllCategories(articles) {

        Object.keys(categories)
            .forEach(category => {

                renderCategory(
                    category,
                    articles,
                    6
                );

            });
    }


    /* =========================================================
       آخر الأخبار
       ========================================================= */

    function renderLatestNews(articles) {

        const latest =
            document.getElementById(
                "latestNews"
            );


        if (!latest) {
            return;
        }


        const sorted =
            sortByDate(articles);


        const latestArticles =
            sorted.slice(0, 8);


        if (!latestArticles.length) {

            latest.innerHTML = `
                <div class="news-empty">

                    <div class="news-empty-icon">
                        📰
                    </div>

                    <p>
                        لا توجد أخبار حاليًا.
                    </p>

                </div>
            `;

            return;
        }


        latest.innerHTML =
            latestArticles
                .map(createNewsCard)
                .join("");
    }


    /* =========================================================
       تحديث عدادات الأخبار
       ========================================================= */

    function updateCategoryCounters(articles) {

        Object.keys(categories)
            .forEach(category => {

                const count =
                    articles.filter(
                        article =>
                            article.category === category
                    ).length;


                /*
                 * البحث عن أي عنصر يحمل:
                 * data-news-count="football"
                 */

                const counter =
                    document.querySelector(
                        `[data-news-count="${category}"]`
                    );


                if (counter) {

                    counter.textContent =
                        count;
                }

            });
    }


    /* =========================================================
       تحديث تاريخ آخر تحديث
       ========================================================= */

    function updateNewsTimestamp(updatedAt) {

        const updated =
            document.getElementById(
                "newsUpdated"
            );


        if (!updated || !updatedAt) {
            return;
        }


        const date =
            formatDate(updatedAt);


        const time =
            formatTime(updatedAt);


        if (!date) {
            return;
        }


        updated.textContent =
            `آخر تحديث: ${date}${time ? " - " + time : ""}`;
    }


    /* =========================================================
       البحث في الأخبار
       ========================================================= */

    function setupNewsSearch(articles) {

        const searchInput =
            document.querySelector(
                "#newsSearch"
            );


        if (!searchInput) {
            return;
        }


        searchInput.addEventListener(
            "input",
            () => {

                const query =
                    searchInput.value
                        .trim()
                        .toLowerCase();


                /*
                 * إذا كان البحث فارغًا
                 */

                if (!query) {

                    renderAllCategories(
                        articles
                    );

                    renderLatestNews(
                        articles
                    );

                    return;
                }


                /*
                 * البحث في:
                 * العنوان
                 * الوصف
                 * المصدر
                 * التصنيف
                 */

                const results =
                    articles.filter(article => {

                        const title =
                            String(
                                article.title || ""
                            ).toLowerCase();


                        const description =
                            String(
                                article.description || ""
                            ).toLowerCase();


                        const source =
                            String(
                                article.source || ""
                            ).toLowerCase();


                        const category =
                            String(
                                categories[
                                    article.category
                                ] || ""
                            ).toLowerCase();


                        return (
                            title.includes(query) ||
                            description.includes(query) ||
                            source.includes(query) ||
                            category.includes(query)
                        );
                    });


                /*
                 * إخفاء الأقسام
                 * وعرض نتائج البحث في latestNews
                 */

                Object.keys(categories)
                    .forEach(category => {

                        const grid =
                            document.querySelector(
                                `[data-news-category="${category}"]`
                            );


                        if (grid) {
                            grid.innerHTML = "";
                        }

                    });


                const latest =
                    document.getElementById(
                        "latestNews"
                    );


                if (!latest) {
                    return;
                }


                if (!results.length) {

                    latest.innerHTML = `
                        <div class="news-empty">

                            <div class="news-empty-icon">
                                🔍
                            </div>

                            <p>
                                لم يتم العثور على أخبار مطابقة.
                            </p>

                        </div>
                    `;

                    return;
                }


                latest.innerHTML =
                    sortByDate(results)
                        .slice(0, 20)
                        .map(createNewsCard)
                        .join("");
            }
        );
    }


    /* =========================================================
       أزرار عرض المزيد
       ========================================================= */

    function setupShowMoreButtons(articles) {

        document
            .querySelectorAll(
                "[data-news-more]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const category =
                            button.dataset.newsMore;


                        if (
                            !categories[category]
                        ) {
                            return;
                        }


                        const grid =
                            document.querySelector(
                                `[data-news-category="${category}"]`
                            );


                        if (!grid) {
                            return;
                        }


                        const filtered =
                            sortByDate(
                                articles.filter(
                                    article =>
                                        article.category ===
                                        category
                                )
                            );


                        grid.innerHTML =
                            filtered
                                .map(createNewsCard)
                                .join("");


                        button.style.display =
                            "none";
                    }
                );

            });
    }


    /* =========================================================
       تحميل ملف الأخبار
       ========================================================= */

    async function loadNews() {

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
                    `HTTP ${response.status}`
                );
            }


            const data =
                await response.json();


            /*
             * التأكد من وجود مصفوفة الأخبار
             */

            const articles =
                Array.isArray(data.news)
                    ? data.news.filter(
                        isValidArticle
                    )
                    : [];


            console.log(
                `NOWNEX: تم تحميل ${articles.length} خبر`
            );


            /*
             * عرض الأقسام
             */

            renderAllCategories(
                articles
            );


            /*
             * آخر الأخبار
             */

            renderLatestNews(
                articles
            );


            /*
             * العدادات
             */

            updateCategoryCounters(
                articles
            );


            /*
             * تاريخ آخر تحديث
             */

            updateNewsTimestamp(
                data.updatedAt
            );


            /*
             * البحث
             */

            setupNewsSearch(
                articles
            );


            /*
             * أزرار المزيد
             */

            setupShowMoreButtons(
                articles
            );


        } catch (error) {

            console.error(
                "NOWNEX News Error:",
                error
            );


            /*
             * رسالة الخطأ في جميع الأقسام
             */

            document
                .querySelectorAll(
                    "[data-news-category]"
                )
                .forEach(grid => {

                    grid.innerHTML = `
                        <div class="news-empty">

                            <div class="news-empty-icon">
                                ⚠️
                            </div>

                            <p>
                                تعذر تحميل الأخبار حاليًا.
                            </p>

                            <small>
                                حاول تحديث الصفحة مرة أخرى.
                            </small>

                        </div>
                    `;

                });


            /*
             * رسالة الخطأ في آخر الأخبار
             */

            const latest =
                document.getElementById(
                    "latestNews"
                );


            if (latest) {

                latest.innerHTML = `
                    <div class="news-empty">

                        <div class="news-empty-icon">
                            ⚠️
                        </div>

                        <p>
                            تعذر تحميل الأخبار حاليًا.
                        </p>

                    </div>
                `;
            }
        }
    }


    /* =========================================================
       تشغيل النظام
       ========================================================= */

    loadNews();

});
