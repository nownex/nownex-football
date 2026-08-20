document.addEventListener("DOMContentLoaded", () => {

    const NEWS_FILE = "data/news.json";

    const categories = {
        football: "أخبار كرة القدم",
        stars: "أخبار النجوم",
        world: "الكرة العالمية",
        bigMatches: "قمم كروية",
        competitions: "البطولات الكبرى",
        starMatches: "مباريات النجوم"
    };

    const categoryIcons = {
        football: "📰",
        stars: "⭐",
        world: "🌍",
        bigMatches: "🔥",
        competitions: "🏆",
        starMatches: "⭐"
    };


    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function formatDate(date) {

        if (!date) return "";

        const d = new Date(date);

        if (isNaN(d)) return "";

        return d.toLocaleDateString("ar-DZ", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }


    function createNewsCard(article) {

        const image = article.image
            ? `
                <img
                    src="${escapeHTML(article.image)}"
                    alt=""
                    loading="lazy"
                    onerror="this.style.display='none'"
                >
              `
            : `
                <div class="news-placeholder">
                    ${categoryIcons[article.category] || "📰"}
                </div>
              `;


        return `
            <article class="news-card">

                <div class="news-image">
                    ${image}
                </div>

                <div class="news-content">

                    <div class="news-meta">

                        <span class="news-category">
                            ${escapeHTML(
                                categories[article.category]
                                || "أخبار"
                            )}
                        </span>

                        <span class="news-date">
                            ${escapeHTML(
                                formatDate(article.date)
                            )}
                        </span>

                    </div>

                    <h3>
                        ${escapeHTML(article.title)}
                    </h3>

                    <p>
                        ${escapeHTML(
                            article.description || ""
                        )}
                    </p>

                    <div class="news-footer">

                        <span>
                            ${escapeHTML(
                                article.source || "NOWNEX"
                            )}
                        </span>

                        ${
                            article.url
                            ? `
                                <a
                                    href="${escapeHTML(article.url)}"
                                    target="_blank"
                                    rel="noopener noreferrer"
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


    function renderCategory(
        category,
        articles
    ) {

        const grid =
            document.querySelector(
                `[data-news-category="${category}"]`
            );

        if (!grid) return;


        const filtered =
            articles
                .filter(
                    article =>
                        article.category === category
                )
                .slice(0, 6);


        if (!filtered.length) {

            grid.innerHTML = `
                <div class="news-empty">
                    لا توجد أخبار جديدة حاليًا.
                </div>
            `;

            return;
        }


        grid.innerHTML =
            filtered
                .map(createNewsCard)
                .join("");
    }


    function renderAllNews(articles) {

        Object.keys(categories)
            .forEach(category => {

                renderCategory(
                    category,
                    articles
                );

            });


        /*
         * آخر الأخبار في بداية الصفحة
         */

        const latest =
            document.getElementById(
                "latestNews"
            );


        if (latest) {

            const latestArticles =
                [...articles]
                    .sort(
                        (a, b) =>
                            new Date(b.date) -
                            new Date(a.date)
                    )
                    .slice(0, 8);


            latest.innerHTML =
                latestArticles
                    .map(createNewsCard)
                    .join("");
        }
    }


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
                    "News file unavailable"
                );
            }


            const data =
                await response.json();


            const articles =
                Array.isArray(data.news)
                    ? data.news
                    : [];


            renderAllNews(articles);


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


        } catch (error) {

            console.error(
                "NOWNEX News:",
                error
            );


            document
                .querySelectorAll(
                    "[data-news-category]"
                )
                .forEach(grid => {

                    grid.innerHTML = `
                        <div class="news-empty">
                            تعذر تحميل الأخبار حاليًا.
                        </div>
                    `;

                });
        }
    }


    loadNews();

});
