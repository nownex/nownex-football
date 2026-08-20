document.addEventListener("DOMContentLoaded", async () => {
    const matchesContainer = document.querySelector(".matches");

    if (!matchesContainer) return;

    try {
        const response = await fetch("data/fixtures.json");

        if (!response.ok) {
            throw new Error("تعذر تحميل بيانات المباريات");
        }

        const data = await response.json();
        const fixtures = Array.isArray(data.response) ? data.response : [];

        if (!fixtures.length) {
            matchesContainer.innerHTML = `
                <div class="match-card">
                    <div class="match-footer">
                        لا توجد مباريات مسجلة لهذا اليوم.
                    </div>
                </div>
            `;
            return;
        }

        matchesContainer.innerHTML = "";

        fixtures.forEach(match => {

            const home = match.teams.home;
            const away = match.teams.away;

            const status = match.fixture.status;
            const goals = match.goals;

            const isLive = [
                "1H",
                "HT",
                "2H",
                "ET",
                "P",
                "BT"
            ].includes(status.short);

            const isFinished = [
                "FT",
                "AET",
                "PEN"
            ].includes(status.short);

            const date = new Date(match.fixture.date);

            const time = date.toLocaleTimeString("ar-DZ", {
                hour: "2-digit",
                minute: "2-digit"
            });

            let statusText = time;

            if (isLive) {
                statusText = `مباشر · ${status.elapsed || ""}'`;
            } else if (isFinished) {
                statusText = "انتهت";
            }

            const homeScore =
                goals.home !== null ? goals.home : "-";

            const awayScore =
                goals.away !== null ? goals.away : "-";

            const card = document.createElement("div");

            card.className =
                `match-card ${isLive ? "live" : ""}`;

            card.innerHTML = `

                <div class="match-header">

                    <span class="league">
                        ${match.league.name}
                    </span>

                    ${
                        isLive
                        ? `<span class="live">● مباشر</span>`
                        : `<span class="match-time">${statusText}</span>`
                    }

                </div>

                <div class="teams">

                    <div>

                        <img
                            class="team-logo"
                            src="${home.logo}"
                            alt="${home.name}"
                            loading="lazy"
                        >

                        <div class="team-name">
                            ${home.name}
                        </div>

                    </div>

                    <div>

                        <div class="score">
                            ${homeScore} - ${awayScore}
                        </div>

                        <div class="${
                            isLive || isFinished
                            ? "minute"
                            : "vs"
                        }">
                            ${statusText}
                        </div>

                    </div>

                    <div>

                        <img
                            class="team-logo"
                            src="${away.logo}"
                            alt="${away.name}"
                            loading="lazy"
                        >

                        <div class="team-name">
                            ${away.name}
                        </div>

                    </div>

                </div>

                <div class="match-footer">
                    ${match.league.country || ""}
                </div>
            `;

            matchesContainer.appendChild(card);
        });

    } catch (error) {

        console.error(error);

        matchesContainer.innerHTML = `
            <div class="match-card">
                <div class="match-footer">
                    تعذر تحميل مباريات اليوم حاليًا.
                </div>
            </div>
        `;
    }
});
