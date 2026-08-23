document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       NOWNEX FOOTBALL — NEWS SYSTEM
       ========================================================= */

    const NEWS_FILE = "data/news.json";


    /* =========================================================
       التصنيفات الموجودة في news.json
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

        starMatches: "⚡"

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
       تحويل التاريخ إلى العربية
       ========================================================= */

    function formatDate(date) {

        if (!date) return "";

        const d = new Date(date);

        if (isNaN(d.getTime())) return "";

        return d.toLocaleDateString("ar-DZ", {

            day: "numeric",

            month: "long",

            year: "numeric"

        });

    }


    /* =========================================================
       الوقت منذ نشر الخبر
       ========================================================= */

    function formatRelativeDate(date) {

        if (!date) return "";

        const d = new Date(date);

        if (isNaN(d.getTime())) {

            return "";

        }


        const now = new Date();

        const diff = now.getTime() - d.getTime();

        const minutes = Math.floor(diff / 60000);

        const hours = Math.floor(diff / 3600000);

        const days = Math.floor(diff / 86400000);


        if (minutes < 1) {

            return "الآن";

        }


        if (minutes < 60) {

            return `منذ ${minutes} دقيقة`;

        }


        if (hours < 24) {

            return `منذ ${hours} ساعة`;

        }


        if (days < 7) {

            return `منذ ${days} يوم`;

        }


        return formatDate(date);

    }


    /* =========================================================
       إنشاء صورة الخبر
       ========================================================= */

    function createNewsImage(article) {

        const image =
            typeof article.image === "string"
                ? article.image.trim()
                : "";


        if (image) {

            return `

                <img

                    src="${escapeHTML(image)}"

                    alt="${escapeHTML(article.title || "")}"

                    loading="lazy"

                    onerror="this.parentElement.innerHTML =
                    '<div class=&quot;news-placeholder&quot;>
                    ${categoryIcons[article.category] || "📰"}
                    </div>'"

                >

            `;

        }


        return `

            <div class="news-placeholder">

                ${categoryIcons[article.category] || "📰"}

            </div>

        `;

    }


    /* =========================================================
       إنشاء بطاقة خبر
       ========================================================= */

    function createNewsCard(article) {

        if (!article) return "";


        const category =
            categories[article.category] || "أخبار";


        const icon =
            categoryIcons[article.category] || "📰";


        const title =
            article.title || "خبر جديد";


        const description =
            article.description || "";


        const source =
            article.source || "NOWNEX";


        const date =
            formatRelativeDate(article.date);


        const fullDate =
            formatDate(article.date);


        const url =
            typeof article.url === "string"
                ? article.url.trim()
                : "";


        const image =
            createNewsImage(article);


        return `

            <article
                class="news-card"
                data-category="${escapeHTML(article.category || "")}"
            >

                <!-- صورة الخبر -->

                <div class="news-image">

                    ${image}

                </div>


                <!-- محتوى الخبر -->

                <div class="news-content">


                    <!-- معلومات الخبر -->

                    <div class="news-meta">

                        <span class="news-category">

                            ${icon}

                            ${escapeHTML(category)}

                        </span>


                        <span
                            class="news-date"
                            title="${escapeHTML(fullDate)}"
                        >

                            ${escapeHTML(date)}

                        </span>

                    </div>


                    <!-- العنوان -->

                    <h3>

                        ${escapeHTML(title)}

                    </h3>


                    <!-- الوصف -->

                    ${
                        description
                            ? `

                                <p>

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
                            url
                                ? `

                                    <a

                                        href="${escapeHTML(url)}"

                                        target="_blank"

                                        rel="noopener noreferrer"

                                        class="news-read"

                                    >

                                        اقرأ الخبر ←

                                    </a>

                                  `
                                : ""

                        }

                    </div>


                </div>

            </article>

        `;

    }


    /* =========================================================
       ترتيب الأخبار من الأحدث إلى الأقدم
       ========================================================= */

    function sortNews(articles) {

        return [...articles].sort((a, b) => {

            const dateA =
                new Date(a?.date || 0).getTime();


            const dateB =
                new Date(b?.date || 0).getTime();


            return dateB - dateA;

        });

    }


    /* =========================================================
       عرض تصنيف واحد
       ========================================================= */

    function renderCategory(category, articles) {

        const grid =
            document.querySelector(
                `[data-news-category="${category}"]`
            );


        if (!grid) {

            return;

        }


        const filtered =
            sortNews(articles)

                .filter(article =>
                    article.category === category
                )

                .slice(0, 6);


        /* لا توجد أخبار */

        if (!filtered.length) {

            grid.innerHTML = `

                <div class="news-empty">

                    <div class="news-empty-icon">

                        ${categoryIcons[category] || "📰"}

                    </div>

                    <div>

                        لا توجد أخبار جديدة حاليًا.

                    </div>

                </div>

            `;

            return;

        }


        grid.innerHTML =

            filtered

                .map(createNewsCard)

                .join("");

    }


    /* =========================================================
       آخر الأخبار
       ========================================================= */

    function renderLatestNews(articles) {

        const latest =
            document.getElementById("latestNews");


        if (!latest) {

            return;

        }


        const latestArticles =

            sortNews(articles)

                .slice(0, 8);


        if (!latestArticles.length) {

            latest.innerHTML = `

                <div class="news-empty">

                    لا توجد أخبار جديدة حاليًا.

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
       عرض جميع الأخبار
       ========================================================= */

    function renderAllNews(articles) {

        Object.keys(categories)

            .forEach(category => {

                renderCategory(

                    category,

                    articles

                );

            });


        renderLatestNews(articles);

    }


    /* =========================================================
       تحديث وقت آخر تحديث
       ========================================================= */

    function updateNewsTimestamp(updatedAt) {

        const updated =
            document.getElementById("newsUpdated");


        if (!updated || !updatedAt) {

            return;

        }


        const date =
            formatDate(updatedAt);


        if (!date) {

            return;

        }


        updated.textContent =

            "آخر تحديث: " + date;

    }


    /* =========================================================
       تحميل الأخبار
       ========================================================= */

    async function loadNews() {

        try {

            console.log(
                "NOWNEX: Loading news..."
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


            /* التأكد من أن news عبارة عن Array */

            const articles =

                Array.isArray(data.news)

                    ? data.news

                    : [];


            console.log(

                `NOWNEX: ${articles.length} news loaded`

            );


            /* عرض الأخبار */

            renderAllNews(articles);


            /* تحديث التاريخ */

            updateNewsTimestamp(

                data.updatedAt

            );


        }

        catch (error) {

            console.error(

                "NOWNEX News Error:",

                error

            );


            /* عرض رسالة الخطأ */

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

                            <div>

                                تعذر تحميل الأخبار حاليًا.

                            </div>

                        </div>

                    `;

                });


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

                        <div>

                            تعذر تحميل الأخبار حاليًا.

                        </div>

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
