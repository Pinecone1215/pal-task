const start_button = document.getElementById("start-task-button");
const screens = document.querySelectorAll("main > div");

const msg_screen = document.getElementById("msg-screen");
const stimulus_screen = document.getElementById("stimulus-screen");

const msg_title = document.getElementById("msg-title");
const msg_desc = document.getElementById("msg-desc");

const fixation = document.getElementById("fixation");
const pos_btns = document.querySelectorAll(".pos-btn");

async function load_config() {
    const response = await fetch("./data/config.json");
    const config = await response.json();
    return config;
}

async function load_data() {
    const response = await fetch("./data/data.json");
    const data = await response.json();
    return data;
}

function wait_until(target_timestamp) {
    return new Promise((resolve) => {
        function check_time(timestamp) {
            if (timestamp >= target_timestamp) {
                resolve(timestamp);
            }else { requestAnimationFrame(check_time); }
        }
        requestAnimationFrame(check_time);
    });
}

function show_screen(screen) {
    return new Promise((resolve) => {
        requestAnimationFrame((timestamp) => {
            screens.forEach((item) => { item.hidden = true; });
            if(screen !== null) screen.hidden = false;
            resolve(timestamp);
        });
    });
}

async function main() {
    const participant_id = sessionStorage.getItem("participant_id");
    if (!participant_id) {
        alert("找不到受試者代號，請重新輸入。");
        window.location.href = `participant_info.html${window.location.search}`;
        return;
    }

    const config = await load_config();
    const data = await load_data();
    const trials = data.trials;

    pos_btns.forEach((btn) => {
        const pos = btn.dataset.pos;
        const img_path = trials[0].stimuli[pos];

        if (img_path === undefined) return;

        const img = btn.querySelector("img");
        img.src = img_path;
        img.hidden = true;
    });

    let timestamp = await show_screen(null);
    await wait_until(timestamp + config.common.duration.pause);

    msg_title.textContent = trials[0].title;
    msg_desc.textContent = trials[0].desc;
    timestamp = await show_screen(msg_screen);
    await wait_until(timestamp + config.common.duration.msg);
    
    timestamp = await show_screen(null);
    await wait_until(timestamp + config.common.duration.pause);

    fixation.hidden = false;
    timestamp = await show_screen(stimulus_screen);
    await wait_until(timestamp + config.common.duration.fixation);

    const rounds = trials[0].rounds;
    for (const round of rounds) {
        const learning_order = round.learning_order;

        for (const pos of learning_order) {
            const pos_btn = document.querySelector(`.pos-btn[data-pos="${pos}"]`);
            const img = pos_btn.querySelector("img");

            const _timestamp = await new Promise((resolve) => {
                requestAnimationFrame((_timestamp) => {
                    img.hidden = false;
                    resolve(_timestamp);
                });
            });

            await wait_until(_timestamp + config.common.duration.encoding);
            img.hidden = true;
        }

        timestamp = await show_screen(null);
        await wait_until(timestamp + config.common.duration.pause);

        fixation.hidden = false;
        timestamp = await show_screen(stimulus_screen);
        await wait_until(timestamp + config.common.duration.fixation);

        timestamp = await show_screen(null);
        break;
    }
}

start_button.addEventListener("click", async () => {
    start_button.disabled = true;

    try {
        if (!document.fullscreenElement && document.fullscreenEnabled)
            await document.documentElement.requestFullscreen();
    } catch (error) {
        console.warn("無法進入全螢幕：", error);
    }

    await main();
    
}, { once: true });