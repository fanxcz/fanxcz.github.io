(function () {
    "use strict";

    const $ = id => document.getElementById(id);

    function parseCoord(value) {
        if (value == null || String(value).trim() === "") return null;

        const n = Number(String(value).trim().replace(",", "."));

        if (!Number.isFinite(n)) return null;
        if (n < -10 || n > 10) return null;

        return n;
    }

    function getMyCoords() {
        const params = new URLSearchParams(location.search);

        let eco = parseCoord(params.get("e"));
        let soc = parseCoord(params.get("s"));

        if (eco === null && $("ecoValue")) {
            eco = parseCoord($("ecoValue").textContent);
        }

        if (soc === null && $("socValue")) {
            soc = parseCoord($("socValue").textContent);
        }

        if (eco === null || soc === null) {
            return null;
        }

        return { eco, soc };
    }

    function drawCompare(a, b) {
        const canvas = $("compareCanvas");

        if (!canvas) return;

        const parent = canvas.parentElement;
        const size = Math.min(
            700,
            Math.max(280, parent ? parent.clientWidth : 500)
        );

        canvas.width = size * 2;
        canvas.height = size * 2;

        canvas.style.width = size + "px";
        canvas.style.height = size + "px";

        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        const pad = 80;

        ctx.clearRect(0, 0, w, h);

        const px = value =>
            pad + ((value + 10) * (w - pad * 2)) / 20;

        const py = value =>
            h - pad - ((value + 10) * (h - pad * 2)) / 20;

        ctx.strokeStyle = "#d1d5db";
        ctx.fillStyle = "#111827";
        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.moveTo(px(-10), py(0));
        ctx.lineTo(px(10), py(0));

        ctx.moveTo(px(0), py(-10));
        ctx.lineTo(px(0), py(10));

        ctx.stroke();

        ctx.font = "26px sans-serif";

        ctx.fillText(
            "Economic",
            w - 190,
            h - 25
        );

        ctx.save();

        ctx.translate(30, 180);
        ctx.rotate(-Math.PI / 2);

        ctx.fillText("Social", 0, 0);

        ctx.restore();

        function point(point, label) {
            if (!point) return;

            const x = px(point.eco);
            const y = py(point.soc);

            ctx.beginPath();
            ctx.arc(x, y, 14, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = "25px sans-serif";

            ctx.fillText(
                label,
                x + 20,
                y - 20
            );
        }

        point(a, "Вы");
        point(b, "2");
    }

    function bindCompare() {
        const myButton = $("compareMyBtn");
        const compareButton = $("compareBtn");
        const clearButton = $("clearCompareBtn");

        const ecoInput = $("compareEco");
        const socInput = $("compareSoc");

        const output = $("compareOutput");

        if (!myButton || !compareButton || !ecoInput || !socInput) {
            return;
        }

        /*
         * Удаляем старые onclick/handlers.
         * Это позволяет исправить старую версию JS,
         * даже если она уже была в index.html.
         */
        [myButton, compareButton, clearButton]
            .filter(Boolean)
            .forEach(button => {
                const replacement = button.cloneNode(true);
                button.replaceWith(replacement);
            });

        const my = $("compareMyBtn");
        const compare = $("compareBtn");
        const clear = $("clearCompareBtn");

        my.addEventListener("click", function () {
            const coords = getMyCoords();

            if (!coords) {
                if (output) {
                    output.textContent =
                        "Сначала завершите тест — текущие координаты не найдены.";
                }

                return;
            }

            ecoInput.value = coords.eco.toFixed(1);
            socInput.value = coords.soc.toFixed(1);

            if (output) {
                output.textContent =
                    "Ваши координаты подставлены. Измените их на координаты второй точки и нажмите «Сравнить».";
            }

            drawCompare(coords, null);
        });

        compare.addEventListener("click", function () {
            const first = getMyCoords();

            const second = {
                eco: parseCoord(ecoInput.value),
                soc: parseCoord(socInput.value)
            };

            if (!first) {
                if (output) {
                    output.textContent =
                        "Текущий результат теста не найден.";
                }

                return;
            }

            if (
                second.eco === null ||
                second.soc === null
            ) {
                if (output) {
                    output.textContent =
                        "Введите обе координаты второй точки от −10 до 10.";
                }

                return;
            }

            const dx = second.eco - first.eco;
            const dy = second.soc - first.soc;

            const distance = Math.hypot(dx, dy);

            if (output) {
                output.textContent =
                    "Расстояние: " +
                    distance.toFixed(2) +
                    " · Δ Economic: " +
                    dx.toFixed(1) +
                    " · Δ Social: " +
                    dy.toFixed(1);
            }

            drawCompare(first, second);
        });

        if (clear) {
            clear.addEventListener("click", function () {
                ecoInput.value = "";
                socInput.value = "";

                if (output) {
                    output.textContent = "";
                }

                const canvas = $("compareCanvas");

                if (canvas) {
                    canvas
                        .getContext("2d")
                        .clearRect(
                            0,
                            0,
                            canvas.width,
                            canvas.height
                        );
                }
            });
        }

        /*
         * Просим браузер проверить новую версию Service Worker.
         */
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .getRegistration("/")
                .then(registration => {
                    if (registration) {
                        registration.update();
                    }
                })
                .catch(() => {});
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            bindCompare
        );
    } else {
        bindCompare();
    }
})();
