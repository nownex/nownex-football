document.addEventListener("DOMContentLoaded", () => {

    const leaguesStrip =
        document.getElementById("leaguesStrip");

    const cupsStrip =
        document.getElementById("cupsStrip");

    const matchesGrid =
        document.getElementById("matchesGrid");


    let fixtures = [];

    let selectedCompetition = "all";

    let selectedType = "all";


    /*
     * البطولات التي نريد معاملتها ككؤوس/بطولات
     */

    const cupKeywords = [
        "champions",
        "champions league",
        "uefa champions",
        "europa league",
        "conference league",
        "world cup",
        "africa cup",
        "asian cup",
        "copa",
        "fa cup",
        "carabao",
        "efl cup",
        "coupe",
        "cup",
        "super cup",
        "community shield",
        "concacaf",
        "afc",
        "caf"
    ];


    function isCup(league){

        const name =
            String(league?.name || "")
            .toLowerCase();

        const type =
            String(league?.type || "")
            .toLowerCase();

        return (
            type.includes("cup") ||
            cupKeywords.some(
                keyword =>
                    name.includes(keyword)
            )
        );
    }


    function escapeHTML(value){

        return String(value ?? "")
            .replace(/&/g,"&amp;")
            .replace(/</g,"&lt;")
            .replace(/>/g,"&gt;")
            .replace(/"/g,"&quot;")
            .replace(/'/g,"&#039;");
    }


    function getMatchStatus(match){

        const status =
            match?.fixture?.status;

        const short =
            status?.short || "";

        const elapsed =
            status?.elapsed;

        const liveStatuses = [
            "1H",
            "2H",
            "HT",
            "ET",
            "BT",
            "P"
        ];

        const finishedStatuses = [
            "FT",
            "AET",
            "PEN"
        ];

        if(liveStatuses.includes(short)){

            return {
                live:true,
                text:
                    elapsed
                    ? `مباشر · ${elapsed}'`
                    : "مباشر"
            };
        }


        if(finishedStatuses.includes(short)){

            return {
                live:false,
                text:"انتهت"
            };
        }


        if(short === "PST"){

            return {
                live:false,
                text:"مؤجلة"
            };
        }


        if(
            short === "CANC" ||
            short === "ABD" ||
            short === "AWD" ||
            short === "WO"
        ){

            return {
                live:false,
                text:"ملغاة"
            };
        }


        const date =
            match?.fixture?.date
            ? new Date(match.fixture.date)
            : null;


        if(date && !isNaN(date)){

            return {
                live:false,
                text:
                    date.toLocaleTimeString(
                        "ar-DZ",
                        {
                            hour:"2-digit",
                            minute:"2-digit"
                        }
                    )
            };
        }


        return {
            live:false,
            text:"لم تبدأ"
        };
    }


    function formatScore(value){

        return value === null ||
               value === undefined
            ? "-"
            : value;
    }


    function createCompetitionButton(
        competition,
        type
    ){

        const button =
            document.createElement("button");

        button.className =
            "competition-btn";

        button.textContent =
            competition.name;

        button.dataset.id =
            String(competition.id);

        button.dataset.type =
            type;


        button.addEventListener(
            "click",
            () => {

                selectedCompetition =
                    String(competition.id);

                selectedType =
                    type;


                document
                    .querySelectorAll(
                        ".competition-btn"
                    )
                    .forEach(
                        btn =>
                            btn.classList.remove(
                                "active"
                            )
                    );


                button.classList.add(
                    "active"
                );


                renderMatches();
            }
        );


        return button;
    }


    function renderCompetitionBars(){

        leaguesStrip.innerHTML = "";
        cupsStrip.innerHTML = "";


        /*
         * زر الكل للدوريات
         */

        const leagueAll =
            document.createElement("button");

        leagueAll.className =
            "competition-btn active";

        leagueAll.textContent =
            "كل الدوريات";


        leagueAll.addEventListener(
            "click",
            () => {

                selectedCompetition =
                    "all";

                selectedType =
                    "league";


                document
                    .querySelectorAll(
                        ".competition-btn"
                    )
                    .forEach(
                        btn =>
                            btn.classList.remove(
                                "active"
                            )
                    );

                leagueAll.classList.add(
                    "active"
                );

                renderMatches();
            }
        );


        leaguesStrip.appendChild(
            leagueAll
        );


        /*
         * زر الكل للكؤوس
         */

        const cupAll =
            document.createElement("button");

        cupAll.className =
            "competition-btn";

        cupAll.textContent =
            "كل الكؤوس";


        cupAll.addEventListener(
            "click",
            () => {

                selectedCompetition =
                    "all";

                selectedType =
                    "cup";


                document
                    .querySelectorAll(
                        ".competition-btn"
                    )
                    .forEach(
                        btn =>
                            btn.classList.remove(
                                "active"
                            )
                    );

                cupAll.classList.add(
                    "active"
                );

                renderMatches();
            }
        );


        cupsStrip.appendChild(
            cupAll
        );


        /*
         * استخراج البطولات بدون تكرار
         */

        const competitions =
            new Map();


        fixtures.forEach(match => {

            const league =
                match?.league;

            if(!league?.id) return;


            if(
                !competitions.has(
                    String(league.id)
                )
            ){

                competitions.set(
                    String(league.id),
                    {
                        id:league.id,
                        name:league.name,
                        type:
                            isCup(league)
                            ? "cup"
                            : "league"
                    }
                );
            }
        });


        const sorted =
            [...competitions.values()]
            .sort(
                (a,b) =>
                    a.name.localeCompare(
                        b.name,
                        "ar"
                    )
            );


        sorted.forEach(
            competition => {

                const button =
                    createCompetitionButton(
                        competition,
                        competition.type
                    );


                if(
                    competition.type ===
                    "cup"
                ){

                    cupsStrip.appendChild(
                        button
                    );

                }else{

                    leaguesStrip.appendChild(
                        button
                    );
                }

            }
        );
    }


    function renderMatches(){

        matchesGrid.innerHTML = "";


        let filtered =
            fixtures.filter(
                match => {

                    const league =
                        match?.league;

                    if(!league) return false;


                    const cup =
                        isCup(league);


                    const type =
                        cup
                        ? "cup"
                        : "league";


                    /*
                     * إذا تم اختيار نوع محدد
                     */

                    if(
                        selectedType !==
                        "all" &&
                        selectedType !==
                        type
                    ){

                        return false;
                    }


                    /*
                     * إذا تم اختيار بطولة
                     */

                    if(
                        selectedCompetition !==
                        "all" &&
                        String(
                            league.id
                        ) !==
                        selectedCompetition
                    ){

                        return false;
                    }


                    return true;
                }
            );


        /*
         * ترتيب المباريات:
         * المباشر أولًا
         */

        filtered.sort(
            (a,b) => {

                const aLive =
                    getMatchStatus(a).live;

                const bLive =
                    getMatchStatus(b).live;

                if(
                    aLive &&
                    !bLive
                ) return -1;

                if(
                    !aLive &&
                    bLive
                ) return 1;

                return new Date(
                    a.fixture.date
                ) -
                new Date(
                    b.fixture.date
                );
            }
        );


        if(!filtered.length){

            matchesGrid.innerHTML = `

                <div class="matches-empty">

                    لا توجد مباريات
                    في البطولة المختارة اليوم.

                </div>

            `;

            return;
        }


        filtered.forEach(
            match => {

                const home =
                    match.teams?.home;

                const away =
                    match.teams?.away;

                const goals =
                    match.goals || {};

                const status =
                    getMatchStatus(match);


                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "match-card";


                card.innerHTML = `

                    <div class="match-header">

                        <span
                            class="match-league"
                        >
                            ${escapeHTML(
                                match.league.name
                            )}
                        </span>

                        <span
                            class="match-status ${
                                status.live
                                ? "live"
                                : ""
                            }"
                        >
                            ${
                                status.live
                                ? "● "
                                : ""
                            }
                            ${escapeHTML(
                                status.text
                            )}
                        </span>

                    </div>


                    <div class="match-teams">

                        <div>

                            <img
                                class="club-logo"
                                src="${
                                    escapeHTML(
                                        home?.logo || ""
                                    )
                                }"
                                alt="${
                                    escapeHTML(
                                        home?.name || ""
                                    )
                                }"
                                loading="lazy"
                            >

                            <div
                                class="club-name"
                            >
                                ${
                                    escapeHTML(
                                        home?.name ||
                                        "الفريق المضيف"
                                    )
                                }
                            </div>

                        </div>


                        <div>

                            <div
                                class="match-score"
                            >
                                ${
                                    formatScore(
                                        goals.home
                                    )
                                }

                                -

                                ${
                                    formatScore(
                                        goals.away
                                    )
                                }
                            </div>

                            <div
                                class="match-minute"
                            >
                                ${
                                    status.live
                                    ? status.text
                                    : (
                                        status.text ===
                                        "انتهت"
                                        ? "النهاية"
                                        : "المباراة"
                                    )
                                }
                            </div>

                        </div>


                        <div>

                            <img
                                class="club-logo"
                                src="${
                                    escapeHTML(
                                        away?.logo || ""
                                    )
                                }"
                                alt="${
                                    escapeHTML(
                                        away?.name || ""
                                    )
                                }"
                                loading="lazy"
                            >

                            <div
                                class="club-name"
                            >
                                ${
                                    escapeHTML(
                                        away?.name ||
                                        "الفريق الضيف"
                                    )
                                }
                            </div>

                        </div>

                    </div>


                    <div
                        class="match-footer"
                    >
                        ${
                            escapeHTML(
                                match.league.country ||
                                ""
                            )
                        }

                        ${
                            match.fixture?.venue?.name
                            ? " · " +
                              escapeHTML(
                                match.fixture.venue.name
                              )
                            : ""
                        }

                    </div>

                `;


                matchesGrid.appendChild(
                    card
                );

            }
        );
    }


    async function loadFootballData(){

        try{

            const response =
                await fetch(
                    "data/fixtures.json",
                    {
                        cache:"no-store"
                    }
                );


            if(!response.ok){

                throw new Error(
                    "تعذر تحميل بيانات المباريات"
                );
            }


            const data =
                await response.json();


            fixtures =
                Array.isArray(
                    data.response
                )
                ? data.response
                : [];


            if(!fixtures.length){

                matchesGrid.innerHTML = `

                    <div class="matches-empty">

                        لا توجد مباريات اليوم
                        في البيانات الحالية.

                    </div>

                `;

                return;
            }


            /*
             * بناء شرائط البطولات
             */

            renderCompetitionBars();


            /*
             * عرض كل الدوريات افتراضيًا
             */

            selectedCompetition =
                "all";

            selectedType =
                "league";


            /*
             * تفعيل زر كل الدوريات
             */

            const firstLeagueButton =
                leaguesStrip.querySelector(
                    ".competition-btn"
                );

            if(firstLeagueButton){

                document
                    .querySelectorAll(
                        ".competition-btn"
                    )
                    .forEach(
                        btn =>
                            btn.classList.remove(
                                "active"
                            )
                    );

                firstLeagueButton.classList.add(
                    "active"
                );
            }


            renderMatches();

        }catch(error){

            console.error(
                "NOWNEX Football:",
                error
            );


            matchesGrid.innerHTML = `

                <div class="matches-empty">

                    تعذر تحميل مباريات اليوم.
                    <br>
                    حاول تحديث الصفحة لاحقًا.

                </div>

            `;
        }
    }


    loadFootballData();

});
