const DATABASE_ENDPOINT = 
"https://script.google.com/macros/s/AKfycbzPl5-Rzi7JnjdY8IapnRXSIiJQrpOW_MwuePZlZYY17zwm8PumVh6iBNK-WIDRA2sA/exec";

const start_button = document.getElementById("start-task-button");
const screens = document.querySelectorAll("main > div");
const msg_screen = document.getElementById("msg-screen");
const stimulus_screen = document.getElementById("stimulus-screen");
const msg_title = document.getElementById("msg-title");
const msg_desc = document.getElementById("msg-desc");
const fixation = document.getElementById("fixation");
const center_pos = document.getElementById("center-pos");
const center_img = center_pos.querySelector("img");
const pos_btns = document.querySelectorAll(".pos-btn");

const position_map = {
    "top": "N",
    "top-right": "NE",
    "right": "E",
    "bottom-right": "SE",
    "bottom": "S",
    "bottom-left": "SW",
    "left": "W",
    "top-left": "NW"
};

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

async function show_element(element) {
    return await new Promise((resolve) => {
        requestAnimationFrame((timestamp) => {
            element.hidden = false;
            resolve(timestamp);
        });
    });
}

async function switch_screen(screen) {
    return await new Promise((resolve) => {
        requestAnimationFrame((timestamp) => {
            screens.forEach((item) => { item.hidden = true; });
            if(screen !== null) screen.hidden = false;
            resolve(timestamp);
        });
    });
}

async function wait_until(target_timestamp) {
    return await new Promise((resolve) => {
        function check_time(timestamp) {
            if (timestamp >= target_timestamp) {
                resolve(timestamp);
            }else { requestAnimationFrame(check_time); }
        }
        requestAnimationFrame(check_time);
    });
}

async function show_message(title, desc) {
    msg_title.textContent = title;
    msg_desc.textContent = desc;
    return await switch_screen(msg_screen);
}

async function present_stimuli(pos_order, interval) {
    for (const pos of pos_order) {
        const pos_btn = document.querySelector(`.pos-btn[data-pos="${pos}"]`);
        const img = pos_btn.querySelector("img");
        const timestamp = await show_element(img);
        await wait_until(timestamp + interval);
        img.hidden = true;
    }
}

async function present_feedback(correct_pos, duration) {
    const pos_btn = document.querySelector(`.pos-btn[data-pos="${correct_pos}"]`);
    const correct_feedback = pos_btn.querySelector(".correct-feedback");
    const timestamp = await show_element(correct_feedback);
    await wait_until(timestamp + duration);
    correct_feedback.hidden = true;
}

async function answer_question(center_img_path, time_limit) {
    let rt = null;
    let pos = null;
    let start_timestamp = null;

    pos_btns.forEach((pos_btn) => {
        pos_btn.onclick = () => {
            if (pos !== null || start_timestamp === null) return;
            const response_timestamp = performance.now();
            const elapsed = response_timestamp - start_timestamp;
            if (elapsed >= time_limit) return;
            pos = pos_btn.dataset.pos;
            rt = elapsed;
        };
    });

    center_img.src = center_img_path;
    return new Promise((resolve) => {
        function update_retrieval(timestamp) {
            if (start_timestamp === null) {
                start_timestamp = timestamp;
                fixation.hidden = true;
                center_img.hidden = false;
                pos_btns.forEach((pos_btn) => { pos_btn.disabled = false; });
            }
            
            if (pos !== null || timestamp - start_timestamp >= time_limit) {
                pos_btns.forEach((pos_btn) => {
                    pos_btn.onclick = null;
                    pos_btn.disabled = true;
                });
                resolve({ pos: pos, rt: rt });
            } else { requestAnimationFrame(update_retrieval); }
        }
        requestAnimationFrame(update_retrieval);
    });
}

async function upload_results(results) {
    const payload = { results: results };
    const response = await fetch(DATABASE_ENDPOINT, {
        method: "POST",
        headers: {"Content-Type": "text/plain;charset=utf-8"},
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data;
}