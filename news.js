document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       NOWNEX FOOTBALL — NEWS ENGINE
       متوافق مباشرة مع index.html الحالي
       ========================================================= */

    const NEWS_FILE = "data/news.json";

    let allArticles = [];
    let currentCategory = null;


    /* =========================================================
       التصنيفات
       يجب أن تطابق news.json
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
       أيقونات
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

    function formatDate(value) {

        if (!value) {
            return "";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return new Intl.DateTimeFormat(

            "ar-DZ",

            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }

        ).format(date);

    }


    /* =========================================================
       الوقت
       ========================================================= */

    function formatTime(value) {

        if (!value) {
            return "";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return new Intl.DateTimeFormat(

            "ar-DZ",

            {
                hour: "2-digit",
                minute: "2-digit"
            }

        ).format(date);

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

            )

        );

    }


    /* =========================================================
       الحصول على عنوان الخبر
       ========================================================= */

    function getTitle(article) {

        return (

            article.title_ar ||

            article.title ||

            "خبر كرة القدم"

        );

    }


    /* =========================================================
       الحصول على الوصف
       ========================================================= */

    function getDescription(article) {

        return (

            article.description ||

            article.summary_ar ||

            article.summary ||

            ""

        );

    }


    /* =========================================================
       الحصول على الرابط
       ========================================================= */

    function getURL(article) {

        return (

            article.url ||

            article.link ||

            ""

        );

    }


    /* =========================================================
       ترتيب الأخبار
       ========================================================= */

    function sortByDate(articles) {

        return [...articles].sort((a, b) => {

            const dateA = new Date(

                a.date ||

                a.published ||

                a.publishedAt ||

                0

            ).getTime();


            const dateB = new Date(

                b.date ||

                b.published ||

                b.publishedAt ||

                0

            ).getTime();


            return dateB - dateA;

        });

    }


    /* =========================================================
       صورة الخبر
       ========================================================= */

    function createImage(article) {

        const image =

            article.image ||

            article.image_url ||

            article.imageUrl ||

            "";


        const icon =

            categoryIcons[article.category] ||

            "⚽";


        if (!image) {

            return `

                <div class="trend-image-placeholder"
                     style="
                        width:100%;
                        height:100%;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        background:
                            linear-gradient(
                                135deg,
                                #071b38,
                                #030817
                            );
                        font-size:55px;
                     ">

                    ${icon}

                </div>

            `;

        }


        return `

            <img

                class="trend-image"

                src="${escapeHTML(image)}"

                alt="${escapeHTML(getTitle(article))}"

                loading="lazy"

                referrerpolicy="no-referrer"

                onerror="
                    this.onerror=null;
                    this.style.display='none';
                    this.parentElement.innerHTML =
                    '<div style=\\'
                        width:100%;
                        height:100%;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        background:#071b38;
                        font-size:55px;
                    \\'>${icon}</div>';
                "

            >

        `;

    }


    /* =========================================================
       إنشاء بطاقة الخبر
       ========================================================= */

    function createNewsCard(article, index) {

        if (!isValidArticle(article)) {

            return "";

        }


        const title =

            getTitle(article);


        const description =

            getDescription(article);


        const source =

            article.source ||

            "NOWNEX FOOTBALL";


        const category =

            article.category ||

            "football";


        const categoryName =

            categories[category] ||

            "أخبار كرة القدم";


        const date =

            formatDate(

                article.date ||

                article.published ||

                article.publishedAt

            );


        const url =

            getURL(article);


        const imageHTML =

            createImage(article);


        /*

         * مهم جدًا:
         * لا نستخدم onclick داخل HTML.
         * سنربط الضغط بواسطة addEventListener
         * بعد إنشاء البطاقة.
         */


        return `

            <article

                class="trend-card nownex-news-card"

                data-news-index="${index}"

                data-category="${escapeHTML(category)}"

                tabindex="0"

                role="button"

                aria-label="فتح الخبر"

            >

                <div class="trend-image-wrapper">

                    ${imageHTML}

                    <div
                        style="
                            position:absolute;
                            top:12px;
                            right:12px;
                            z-index:4;
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

                        ${categoryIcons[category] || "⚽"}

                        ${escapeHTML(categoryName)}

                    </div>

                </div>


                <div class="trend-card-content">


                    <div class="trend-number">

                        ${String(index + 1).padStart(2, "0")}

                    </div>


                    <div class="trend-icon">

                        ${categoryIcons[category] || "⚽"}

                    </div>


                    <h3>

                        ${escapeHTML(title)}

                    </h3>


                    ${
                        description

                        ?

                        `

                            <div
                                style="
                                    color:#8f9bb2;
                                    font-size:12px;
                                    line-height:1.7;
                                    margin-bottom:9px;
                                "
                            >

                                ${escapeHTML(description)}

                            </div>

                        `

                        :

                        ""

                    }


                    <div class="trend-meta">

                        ${escapeHTML(source)}

                        ${date ? " · " + escapeHTML(date) : ""}

                    </div>


                    <div
                        class="news-link"
                        style="cursor:pointer;"
                    >

                        قراءة الخبر ←

                    </div>


                </div>

            </article>

        `;

    }


    /* =========================================================
       ربط الضغط بالبطاقات
       ========================================================= */

    function attachCardEvents() {

        const cards =

            document.querySelectorAll(

                ".nownex-news-card"

            );


        cards.forEach(card => {

            const index =

                Number(

                    card.dataset.newsIndex

                );


            const article =

                getCurrentArticles()[index];


            if (!article) {

                return;

            }


            /* الضغط على البطاقة */

            card.addEventListener(

                "click",

                event => {

                    /*

                     * إذا ضغط المستخدم على رابط خارجي
                     * لا نفتح المقالة الداخلية.

                     */

                    if (

                        event.target.closest(

                            "a"

                        )

                    ) {

                        return;

                    }


                    openNewsArticle(

                        article

                    );

                }

            );


            /* لوحة المفاتيح */

            card.addEventListener(

                "keydown",

                event => {

                    if (

                        event.key === "Enter" ||

                        event.key === " "

                    ) {

                        event.preventDefault();

                        openNewsArticle(

                            article

                        );

                    }

                }

            );


        });

    }


    /* =========================================================
       الحصول على الأخبار الحالية
       ========================================================= */

    function getCurrentArticles() {

        if (!currentCategory) {

            return sortByDate(

                allArticles

            );

        }


        return sortByDate(

            allArticles.filter(

                article =>

                    article.category ===

                    currentCategory

            )

        );

    }


    /* =========================================================
       عرض الأخبار
       ========================================================= */

    function renderNews(

        articles,

        limit = 6

    ) {

        const grid =

            document.getElementById(

                "newsGrid"

            );


        if (!grid) {

            console.error(

                "NOWNEX: newsGrid غير موجود في index.html"

            );

            return;

        }


        const sorted =

            sortByDate(articles);


        const limited =

            sorted.slice(0, limit);


        if (!limited.length) {

            grid.innerHTML = `

                <div class="empty-news">

                    <strong>

                        📰 لا توجد أخبار

                    </strong>

                    لا توجد أخبار متاحة في هذا القسم حاليًا.

                </div>

            `;

            updateNewsCount(0);

            return;

        }


        /*

         * مهم:
         * نخزن الأخبار المعروضة بنفس الترتيب
         * حتى يكون data-news-index صحيحًا.

         */


        grid.innerHTML =

            limited

                .map(

                    (article, index) =>

                        createNewsCard(

                            article,

                            index

                        )

                )

                .join("");


        updateNewsCount(

            sorted.length

        );


        attachCardEvents();

    }


    /* =========================================================
       تحديث عداد الأخبار
       ========================================================= */

    function updateNewsCount(count) {

        const counter =

            document.getElementById(

                "newsCount"

            );


        if (!counter) {

            return;

        }


        counter.textContent =

            `${count} خبر متاح`;

    }


    /* =========================================================
       فتح الخبر
       ========================================================= */

    function openNewsArticle(article) {

        if (!article) {

            return;

        }


        console.log(

            "NOWNEX: فتح الخبر:",

            getTitle(article)

        );


        /*

         * نستخدم openArticle الموجودة
         * في index.html

         */


        if (

            typeof window.openArticle ===

            "function"

        ) {

            window.openArticle(

                article

            );

            return;

        }


        /*

         * حماية إضافية:
         * إذا لم تكن openArticle موجودة
         */

        console.error(

            "NOWNEX: openArticle غير موجودة في index.html"

        );

    }


    /* =========================================================
       فلترة حسب القسم
       هذه الدالة مطلوبة من index.html
       ========================================================= */

    window.filterByCategory =

        function(

            category,

            element

        ) {


            /*

             * تحويل أسماء HTML
             * إلى أسماء news.json

             */


            const categoryMap = {

                Matches: "bigMatches",

                Transfers: "football",

                Stars: "stars",

                NationalTeams: "world",

                History: "history",

                Results: null

            };


            const mappedCategory =

                categoryMap[category] ||

                category;


            /*

             * Results ليست أخبارًا،
             * بل تنقل إلى النتائج.

             */

            if (

                category === "Results"

            ) {

                if (

                    typeof window.scrollToMatches ===

                    "function"

                ) {

                    window.scrollToMatches();

                }

                return;

            }


            currentCategory =

                mappedCategory;


            /* إزالة active */

            document

                .querySelectorAll(

                    ".category-card"

                )

                .forEach(card => {

                    card.classList.remove(

                        "active"

                    );

                });


            /* إضافة active */

            if (element) {

                element.classList.add(

                    "active"

                );

            }


            const filtered =

                allArticles.filter(

                    article =>

                        article.category ===

                        currentCategory

                );


            renderNews(

                filtered,

                filtered.length

            );


            /* الانتقال للأخبار */

            const section =

                document.getElementById(

                    "trending"

                );


            if (section) {

                setTimeout(

                    () => {

                        section.scrollIntoView({

                            behavior: "smooth",

                            block: "start"

                        });

                    },

                    80

                );

            }

        };


    /* =========================================================
       عرض كل الأخبار
       هذه الدالة مطلوبة من index.html
       ========================================================= */

    window.showAllNews =

        function() {


            currentCategory =

                null;


            document

                .querySelectorAll(

                    ".category-card"

                )

                .forEach(card => {

                    card.classList.remove(

                        "active"

                    );

                });


            renderNews(

                allArticles,

                allArticles.length

            );

        };


    /* =========================================================
       البحث
       ========================================================= */

    function performNewsSearch(query) {

        const text =

            String(query || "")

                .trim()

                .toLowerCase();


        if (!text) {

            renderNews(

                allArticles,

                6

            );

            return;

        }


        const results =

            allArticles.filter(

                article => {


                    const searchable = [

                        article.title,

                        article.title_ar,

                        article.description,

                        article.summary,

                        article.summary_ar,

                        article.source,

                        article.category,

                        categories[

                            article.category

                        ]

                    ]

                        .filter(Boolean)

                        .join(" ")

                        .toLowerCase();


                    return searchable.includes(

                        text

                    );

                }

            );


        currentCategory =

            null;


        renderNews(

            results,

            results.length

        );

    }


    /* =========================================================
       ربط نافذة البحث الموجودة في index.html
       ========================================================= */

    function setupSearch() {

        const input =

            document.getElementById(

                "searchInput"

            );


        if (!input) {

            return;

        }


        input.addEventListener(

            "input",

            () => {

                performNewsSearch(

                    input.value

                );

            }

        );

    }


    /* =========================================================
       تحميل الأخبار
       ========================================================= */

    async function loadNews() {

        try {


            console.log(

                "NOWNEX: تحميل",

                NEWS_FILE

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


            let articles = [];


            if (

                Array.isArray(data)

            ) {

                articles = data;

            }

            else if (

                Array.isArray(data.news)

            ) {

                articles = data.news;

            }


            allArticles =

                articles.filter(

                    isValidArticle

                );


            console.log(

                `NOWNEX: تم تحميل ${allArticles.length} خبر`

            );


            /* حفظ البيانات عالميًا */

            window.nownexNews =

                allArticles;


            /* عرض الأخبار */

            showAllNews();


            /* البحث */

            setupSearch();


            /* آخر تحديث */

            const updated =

                document.getElementById(

                    "newsUpdated"

                );


            if (

                updated &&

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


                updated.textContent =

                    `آخر تحديث: ${date}${time ? " - " + time : ""}`;

            }


        }

        catch(error) {


            console.error(

                "NOWNEX News Error:",

                error

            );


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

                        تأكد من أن الملف:

                        <br><br>

                        <b>

                            data/news.json

                        </b>

                        <br><br>

                        موجود في المكان الصحيح.

                    </div>

                `;

            }

        }

    }


    /* =========================================================
       تشغيل
       ========================================================= */

    loadNews();

});
