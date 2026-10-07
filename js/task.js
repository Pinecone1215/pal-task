const start_button = document.getElementById("start-task-button");
const screens = document.querySelectorAll("main > div");

const msg_screen = document.getElementById("msg-screen");
const stimulus_screen = document.getElementById("stimulus-screen");

const msg_title = document.getElementById("msg-title");
const msg_desc = document.getElementById("msg-desc");

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

    let timestamp = await show_screen(null);
    await wait_until(timestamp + config.common.duration.pause);

    msg_title.textContent = trials[0].title;
    msg_desc.textContent = trials[0].desc;
    timestamp = await show_screen(msg_screen);
    await wait_until(timestamp + config.common.duration.msg);
    await show_screen(null);
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