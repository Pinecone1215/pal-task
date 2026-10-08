const start_button = document.getElementById("start-task-button");
const screens = document.querySelectorAll("main > div");

const msg_screen = document.getElementById("msg-screen");
const stimulus_screen = document.getElementById("stimulus-screen");

const msg_title = document.getElementById("msg-title");
const msg_desc = document.getElementById("msg-desc");

const fixation = document.getElementById("fixation");
const center_pos = document.getElementById("center-pos");
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

async function answer_question(stimuli, retrieval_pos, response_limit) {
    let rt = null;
    let pos = null;
    let start_timestamp = null;

    pos_btns.forEach((pos_btn) => {
        pos_btn.onclick = () => {
            if (pos !== null || start_timestamp === null) return;

            const response_timestamp = performance.now();
            const elapsed = response_timestamp - start_timestamp;

            if (elapsed >= response_limit) return;
            pos = pos_btn.dataset.pos;
            rt = elapsed;
        };
    });

    const img = center_pos.querySelector("img");
    const img_path = stimuli[retrieval_pos];

    return new Promise((resolve) => {
        function update_retrieval(timestamp) {
            if (start_timestamp === null) {
                start_timestamp = timestamp;

                img.src = img_path;
                img.hidden = false;
                fixation.hidden = true;
                pos_btns.forEach((pos_btn) => { pos_btn.disabled = false; });
            }
            
            if (pos !== null || timestamp - start_timestamp >= response_limit) {
                pos_btns.forEach((pos_btn) => {
                    pos_btn.onclick = null;
                    pos_btn.disabled = true;
                });
                resolve({ pos: pos, rt: rt });
            }
            else { requestAnimationFrame(update_retrieval); }
        }
        requestAnimationFrame(update_retrieval);
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

    for(const trial of trials) {
        pos_btns.forEach((pos_btn) => {
            const img = pos_btn.querySelector("img");
            img.removeAttribute("src");
            img.hidden = true;

            const pos = pos_btn.dataset.pos;
            const img_path = trial.stimuli[pos];

            if (img_path === undefined) return;

            img.src = img_path;
        });

        let timestamp = await show_screen(null);
        await wait_until(timestamp + config.common.duration.pause);

        msg_title.textContent = trial.title;
        msg_desc.textContent = trial.desc;
        timestamp = await show_screen(msg_screen);
        await wait_until(timestamp + config.common.duration.msg);
        
        timestamp = await show_screen(null);
        await wait_until(timestamp + config.common.duration.pause);

        fixation.hidden = false;
        timestamp = await show_screen(stimulus_screen);
        await wait_until(timestamp + config.common.duration.fixation);

        const rounds = trial.rounds;
        for (const round of rounds) {
            const learning_order = round.learning_order;
            const retrieval_order = round.retrieval_order;

            await show_screen(stimulus_screen);
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

            fixation.hidden = false;
            timestamp = await show_screen(stimulus_screen);
            await wait_until(timestamp + config.common.duration.fixation);

            for(const retrieval_pos of retrieval_order) {
                const response = await answer_question(
                    trial.stimuli, 
                    retrieval_pos, 
                    config.common.duration.retrieval
                );

                const pos_btn = document.querySelector(`.pos-btn[data-pos="${retrieval_pos}"]`);
                const correct_feedback = pos_btn.querySelector(".correct-feedback");
                let _timestamp = await new Promise((resolve) => {
                    requestAnimationFrame((_timestamp) => {
                        correct_feedback.hidden = false;
                        resolve(_timestamp);
                    });
                });
                
                await wait_until(_timestamp + config.common.duration.correct_feedback);
                correct_feedback.hidden = true;

                _timestamp = await new Promise((resolve) => {
                    requestAnimationFrame((_timestamp) => {
                        center_pos.querySelector("img").hidden = true;
                        fixation.hidden = false;
                        resolve(_timestamp);
                    });
                });

                await wait_until(_timestamp + config.common.duration.fixation);
            }
            
            fixation.hidden = true;
            msg_title.textContent = round.msg;
            msg_desc.textContent = "";
            timestamp = await show_screen(msg_screen);
            await wait_until(timestamp + config.common.duration.msg);

            fixation.hidden = false;
            timestamp = await show_screen(stimulus_screen);
            await wait_until(timestamp + config.common.duration.fixation);
        }

        const control = trial.control;
        const position_order = control.position_order;

        pos_btns.forEach((pos_btn) => {
            const img_path = trial.stimuli["other"];
            const img = pos_btn.querySelector("img");
            img.src = img_path;
            img.hidden = true;
        });

        msg_title.textContent = control.learning.title;
        msg_desc.textContent = control.learning.desc;
        timestamp = await show_screen(msg_screen);
        await wait_until(timestamp + config.common.duration.msg);

        fixation.hidden = false;
        timestamp = await show_screen(stimulus_screen);
        await wait_until(timestamp + config.common.duration.fixation);

        for(const pos of position_order) {
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

        msg_title.textContent = control.retrieval.title;
        msg_desc.textContent = control.retrieval.desc;
        timestamp = await show_screen(msg_screen);
        await wait_until(timestamp + config.common.duration.msg);

        fixation.hidden = false;
        timestamp = await show_screen(stimulus_screen);
        await wait_until(timestamp + config.common.duration.fixation);

        for(const pos of position_order) {
            const response = await answer_question(
                trial.stimuli, 
                "other", 
                config.common.duration.retrieval
            );

            const pos_btn = document.querySelector(`.pos-btn[data-pos="${pos}"]`);
            const correct_feedback = pos_btn.querySelector(".correct-feedback");
            let _timestamp = await new Promise((resolve) => {
                requestAnimationFrame((_timestamp) => {
                    correct_feedback.hidden = false;
                    resolve(_timestamp);
                });
            });
            
            await wait_until(_timestamp + config.common.duration.correct_feedback);
            correct_feedback.hidden = true;

            _timestamp = await new Promise((resolve) => {
                requestAnimationFrame((_timestamp) => {
                    center_pos.querySelector("img").hidden = true;
                    fixation.hidden = false;
                    resolve(_timestamp);
                });
            });

            await wait_until(_timestamp + config.common.duration.fixation);
            fixation.hidden = true;
        }
    }

    msg_title.textContent = "任務已完成\n感謝您的參與!";
    msg_desc.textContent = "";
    await show_screen(msg_screen);
    
    try {
        if (document.fullscreenElement) 
            await document.exitFullscreen();
    } catch (error) {
        console.warn("無法離開全螢幕：", error);
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