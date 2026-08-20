document.addEventListener("DOMContentLoaded", () => {

    const leaguesStrip =
        document.getElementById("leaguesStrip");

    const cupsStrip =
        document.getElementById("cupsStrip");

    const matchesGrid =
        document.getElementById("matchesGrid");


    let fixtures = [];

    let selectedCompetition = "all";

    let selectedType = "league";


    /* =====================================================
       NOWNEX FOOTBALL
       البطولات الرئيسية فقط
    ===================================================== */


    /*
     * 🏟️ الدوريات
     *
     * هذه القائمة ثابتة.
     * لا نسمح لأي دوري آخر بالظهور.
     */

    const LEAGUES = [

        {
            id:39,
            name:"الدوري الإنجليزي",
            apiName:"Premier League"
        },

        {
            id:61,
            name:"الدوري الفرنسي",
            apiName:"Ligue 1"
        },

        {
            id:140,
            name:"الدوري الإسباني",
            apiName:"La Liga"
        },

        {
            id:88,
            name:"الدوري الهولندي",
            apiName:"Eredivisie"
        },

        {
            id:94,
            name:"الدوري البرتغالي",
            apiName:"Primeira Liga"
        },

        {
            id:144,
            name:"الدوري البلجيكي",
            apiName:"Jupiler Pro League"
        },

        {
            id:307,
            name:"الدوري السعودي",
            apiName:"Saudi Pro League"
        },

        {
            id:135,
            name:"الدوري الإيطالي",
            apiName:"Serie A"
        },

        {
            id:253,
            name:"الدوري الأمريكي",
            apiName:"Major League Soccer"
        }

    ];


    /*
     * 🏆 كؤوس وبطولات الأندية
     *
     * لا نخلطها مع المنتخبات.
     */

    const CLUB_CUPS = [

        {
            id:2,
            name:"دوري أبطال أوروبا"
        },

        {
            id:3,
            name:"الدوري الأوروبي"
        },

        {
            id:848,
            name:"دوري المؤتمر الأوروبي"
        },

        {
            id:81,
            name:"كأس الاتحاد الإنجليزي"
        },

        {
            id:45,
            name:"كأس الاتحاد الإنجليزي"
        },

        {
            id:48,
            name:"كأس الرابطة الإنجليزية"
        },

        {
            id:143,
            name:"كأس ملك إسبانيا"
        },

        {
            id:137,
            name:"كأس إيطاليا"
        },

        {
            id:65,
            name:"كأس فرنسا"
        },

        {
            id:147,
            name:"كأس هولندا"
        },

        {
            id:91,
            name:"كأس البرتغال"
        },

        {
            id:145,
            name:"كأس بلجيكا"
        },

        {
            id:504,
            name:"كأس خادم الحرمين الشريفين"
        },

        {
            id:8141,
            name:"كأس العالم للأندية"
        }

    ];


    /*
     * 🌍 منافسات المنتخبات
     *
     * منفصلة تمامًا عن بطولات الأندية.
     */

    const NATIONAL_CUPS = [

        {
            id:1,
            name:"كأس العالم"
        },

        {
            id:4,
            name:"كأس أمم أوروبا"
        },

        {
            id:6,
            name:"كأس أمم إفريقيا"
        },

        {
            id:7,
            name:"كأس آسيا"
        },

        {
            id:9,
            name:"كوبا أمريكا"
        },

        {
            id:12,
            name:"كأس القارات"
        },

        {
            id:5,
            name:"دوري الأمم الأوروبية"
        },

        {
            id:10,
            name:"تصفيات كأس العالم"
        }

    ];


    /* =====================================================
       SAFE HTML
    ===================================================== */

    function escapeHTML(value){

        return String(value ?? "")
            .replace(/&/g,"&amp;")
            .replace(/</g,"&lt;")
            .replace(/>/g,"&gt;")
            .replace(/"/g,"&quot;")
            .replace(/'/g,"&#039;");

    }


    /* =====================================================
       FIND COMPETITION
    ===================================================== */

    function findCompetition(id){

        const numberId =
            Number(id);


        const league =
            LEAGUES.find(
                item =>
                    Number(item.id) === numberId
            );


        if(league){

            return {
                ...league,
                type:"league"
            };

        }


        const clubCup =
            CLUB_CUPS.find(
                item =>
                    Number(item.id) === numberId
            );


        if(clubCup){

            return {
                ...clubCup,
                type:"cup"
            };

        }


        const national =
            NATIONAL_CUPS.find(
                item =>
                    Number(item.id) === numberId
            );


        if(national){

            return {
                ...national,
                type:"national"
            };

        }


        return null;

    }


    /* =====================================================
       FIND COMPETITION BY NAME
       احتياط إذا كان ID في الملف مختلفًا
    ===================================================== */

    function findCompetitionByName(name){

        const value =
            String(name || "")
                .toLowerCase()
                .trim();


        if(!value){
            return null;
        }


        const all = [

            ...LEAGUES,
            ...CLUB_CUPS,
            ...NATIONAL_CUPS

        ];


        return all.find(
            item => {

                const original =
                    String(
                        item.apiName ||
                        item.name ||
                        ""
                    ).toLowerCase();


                const arabic =
                    String(
                        item.name ||
                        ""
                    ).toLowerCase();


                return (
                    value === original ||
                    value.includes(original) ||
                    original.includes(value) ||
                    value === arabic ||
                    value.includes(arabic) ||
                    arabic.includes(value)
                );

            }
        ) || null;

    }


    /* =====================================================
       MATCH COMPETITION
    ===================================================== */

    function getCompetition(match){

        const league =
            match?.league || {};


        /*
         * أولاً نعتمد على ID
         */

        const byId =
            findCompetition(
                league.id
            );


        if(byId){
            return byId;
        }


        /*
         * ثم الاسم كحل احتياطي
         */

        const byName =
            findCompetitionByName(
                league.name
            );


        if(byName){

            return {
                ...byName,
                id:league.id
            };

        }


        return null;

    }


    /* =====================================================
       MATCH STATUS
    ===================================================== */

    function getMatchStatus(match){

        const status =
            match?.fixture?.status || {};


        const short =
            status.short || "";


        const elapsed =
            status.elapsed;


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


        if(
            liveStatuses.includes(short)
        ){

            return {

                live:true,

                text:
                    elapsed
                    ? `مباشر · ${elapsed}'`
                    : "مباشر"

            };

        }


        if(
            finishedStatuses.includes(short)
        ){

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
            [
                "CANC",
                "ABD",
                "AWD",
                "WO"
            ].includes(short)
        ){

            return {

                live:false,

                text:"ملغاة"

            };

        }


        const date =
            match?.fixture?.date
            ? new Date(
                match.fixture.date
            )
            : null;


        if(
            date &&
            !isNaN(
                date.getTime()
            )
        ){

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


    /* =====================================================
       SCORE
    ===================================================== */

    function formatScore(value){

        return (
            value === null ||
            value === undefined
        )
        ? "-"
        : value;

    }


    /* =====================================================
       BUTTON
    ===================================================== */

    function createButton(
        competition,
        type,
        text
    ){

        const button =
            document.createElement(
                "button"
            );


        button.className =
            "competition-btn";


        button.textContent =
            text ||
            competition.name;


        button.dataset.id =
            String(
                competition?.id ||
                "all"
            );


        button.dataset.type =
            type;


        button.addEventListener(
            "click",
            () => {

                selectedCompetition =
                    String(
                        competition?.id ||
                        "all"
                    );


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


    /* =====================================================
       ALL BUTTON
    ===================================================== */

    function createAllButton(
        type,
        text
    ){

        const button =
            document.createElement(
                "button"
            );


        button.className =
            "competition-btn";


        button.textContent =
            text;


        button.dataset.id =
            "all";


        button.dataset.type =
            type;


        button.addEventListener(
            "click",
            () => {

                selectedCompetition =
                    "all";


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


    /* =====================================================
       RENDER BARS
    ===================================================== */

    function renderCompetitionBars(){

        leaguesStrip.innerHTML = "";

        cupsStrip.innerHTML = "";


        /*
         * نبحث عن الشريط الثالث.
         *
         * يجب إضافة عنصر في HTML:
         *
         * id="nationalStrip"
         */

        const nationalStrip =
            document.getElementById(
                "nationalStrip"
            );


        /*
         * ===============================
         * الدوريات
         * ===============================
         */

        const leagueAll =
            createAllButton(
                "league",
                "كل الدوريات"
            );


        leagueAll.classList.add(
            "active"
        );


        leaguesStrip.appendChild(
            leagueAll
        );


        LEAGUES.forEach(
            league => {

                leaguesStrip.appendChild(
                    createButton(
                        league,
                        "league"
                    )
                );

            }
        );


        /*
         * ===============================
         * كؤوس الأندية
         * ===============================
         */

        const cupAll =
            createAllButton(
                "cup",
                "كل الكؤوس"
            );


        cupsStrip.appendChild(
            cupAll
        );


        CLUB_CUPS.forEach(
            cup => {

                cupsStrip.appendChild(
                    createButton(
                        cup,
                        "cup"
                    )
                );

            }
        );


        /*
         * ===============================
         * المنتخبات
         * ===============================
         */

        if(nationalStrip){

            nationalStrip.innerHTML = "";


            const nationalAll =
                createAllButton(
                    "national",
                    "كل المنتخبات"
                );


            nationalStrip.appendChild(
                nationalAll
            );


            NATIONAL_CUPS.forEach(
                national => {

                    nationalStrip.appendChild(
                        createButton(
                            national,
                            "national"
                        )
                    );

                }
            );

        }

    }


    /* =====================================================
       FILTER FIXTURES
    ===================================================== */

    function getFilteredFixtures(){

        return fixtures.filter(
            match => {

                const competition =
                    getCompetition(
                        match
                    );


                /*
                 * أي بطولة غير معروفة
                 * يتم إخفاؤها.
                 */

                if(!competition){

                    return false;

                }


                /*
                 * نوع البطولة
                 */

                if(
                    selectedType &&
                    selectedType !==
                    "all" &&
                    competition.type !==
                    selectedType
                ){

                    return false;

                }


                /*
                 * بطولة محددة
                 */

                if(
                    selectedCompetition !==
                    "all"
                ){

                    if(
                        Number(
                            competition.id
                        ) !==
                        Number(
                            selectedCompetition
                        )
                    ){

                        return false;

                    }

                }


                return true;

            }
        );

    }


    /* =====================================================
       RENDER MATCHES
    ===================================================== */

    function renderMatches(){

        matchesGrid.innerHTML = "";


        const filtered =
            getFilteredFixtures();


        /*
         * المباريات المباشرة أولاً
         */

        filtered.sort(
            (a,b) => {

                const aStatus =
                    getMatchStatus(a);


                const bStatus =
                    getMatchStatus(b);


                if(
                    aStatus.live &&
                    !bStatus.live
                ){

                    return -1;

                }


                if(
                    !aStatus.live &&
                    bStatus.live
                ){

                    return 1;

                }


                const dateA =
                    new Date(
                        a?.fixture?.date ||
                        0
                    );


                const dateB =
                    new Date(
                        b?.fixture?.date ||
                        0
                    );


                return (
                    dateA - dateB
                );

            }
        );


        /*
         * لا توجد مباريات
         */

        if(!filtered.length){

            matchesGrid.innerHTML = `

                <div class="matches-empty">

                    <div style="font-size:28px">
                        ⚽
                    </div>

                    <div>
                        لا توجد مباريات
                        في البطولة المختارة اليوم.
                    </div>

                </div>

            `;

            return;

        }


        /*
         * إنشاء البطاقات
         */

        filtered.forEach(
            match => {

                const home =
                    match?.teams?.home ||
                    {};


                const away =
                    match?.teams?.away ||
                    {};


                const goals =
                    match?.goals ||
                    {};


                const status =
                    getMatchStatus(
                        match
                    );


                const competition =
                    getCompetition(
                        match
                    );


                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "match-card" +
                    (
                        status.live
                        ? " live-card"
                        : ""
                    );


                card.innerHTML = `

                    <div class="match-header">

                        <span
                            class="match-league"
                            title="${escapeHTML(
                                match?.league?.name ||
                                ""
                            )}"
                        >

                            ${escapeHTML(
                                competition?.name ||
                                match?.league?.name ||
                                "مباراة"
                            )}

                        </span>


                        <span
                            class="
                                match-status
                                ${status.live ? "live" : ""}
                            "
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


                        <!-- HOME -->

                        <div>

                            <img
                                class="club-logo"
                                src="${escapeHTML(
                                    home?.logo || ""
                                )}"
                                alt="${escapeHTML(
                                    home?.name ||
                                    ""
                                )}"
                                loading="lazy"
                                onerror="
                                    this.style.visibility='hidden';
                                "
                            >


                            <div class="club-name">

                                ${escapeHTML(
                                    home?.name ||
                                    "الفريق المضيف"
                                )}

                            </div>

                        </div>


                        <!-- SCORE -->

                        <div>

                            <div
                                class="match-score"
                            >

                                ${formatScore(
                                    goals?.home
                                )}

                                -

                                ${formatScore(
                                    goals?.away
                                )}

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


                        <!-- AWAY -->

                        <div>

                            <img
                                class="club-logo"
                                src="${escapeHTML(
                                    away?.logo || ""
                                )}"
                                alt="${escapeHTML(
                                    away?.name ||
                                    ""
                                )}"
                                loading="lazy"
                                onerror="
                                    this.style.visibility='hidden';
                                "
                            >


                            <div class="club-name">

                                ${escapeHTML(
                                    away?.name ||
                                    "الفريق الضيف"
                                )}

                            </div>

                        </div>

                    </div>


                    <div class="match-footer">

                        ${escapeHTML(
                            match?.league?.country ||
                            ""
                        )}

                        ${
                            match?.league?.round
                            ? " · " +
                              escapeHTML(
                                match.league.round
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


    /* =====================================================
       LOAD DATA
    ===================================================== */

    async function loadFootballData(){

        try{

            matchesGrid.innerHTML = `

                <div class="matches-empty">

                    <div class="loading-dot">
                        ●
                    </div>

                    جاري تحميل مباريات اليوم...

                </div>

            `;


            const response =
                await fetch(
                    "data/fixtures.json?v=" +
                    Date.now(),
                    {
                        cache:"no-store"
                    }
                );


            if(!response.ok){

                throw new Error(
                    "HTTP " +
                    response.status
                );

            }


            const data =
                await response.json();


            /*
             * API-Football
             */

            if(
                Array.isArray(
                    data?.response
                )
            ){

                fixtures =
                    data.response;

            }


            /*
             * حماية إضافية إذا كان
             * الملف مجرد Array
             */

            else if(
                Array.isArray(data)
            ){

                fixtures =
                    data;

            }


            else{

                fixtures = [];

            }


            console.log(
                "NOWNEX fixtures:",
                fixtures.length
            );


            /*
             * بناء الشرائط
             */

            renderCompetitionBars();


            /*
             * البداية:
             * كل الدوريات
             */

            selectedType =
                "league";


            selectedCompetition =
                "all";


            /*
             * عرض المباريات
             */

            renderMatches();


        }
        catch(error){

            console.error(
                "NOWNEX FOOTBALL ERROR:",
                error
            );


            matchesGrid.innerHTML = `

                <div class="matches-empty">

                    <div style="font-size:28px">
                        ⚠️
                    </div>

                    <div>
                        تعذر تحميل بيانات المباريات.
                    </div>

                    <small>
                        تحقق من ملف
                        data/fixtures.json
                    </small>

                </div>

            `;

        }

    }


    /* =====================================================
       START
    ===================================================== */

    loadFootballData();


    /*
     * تحديث كل 5 دقائق
     */

    setInterval(
        loadFootballData,
        5 * 60 * 1000
    );

});
