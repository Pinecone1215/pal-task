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
    const duration = config.common.duration;

    for(const trial of trials) {
        // 普通階段
        pos_btns.forEach((pos_btn) => {
            const img = pos_btn.querySelector("img");
            const pos = pos_btn.dataset.pos;
            const img_path = trial.stimuli[pos];
            if (img_path === undefined) return;
            img.src = img_path;
            img.hidden = true;
        });

        let timestamp = await switch_screen(null);
        await wait_until(timestamp + duration.pause);
        timestamp = await show_message(trial.title, trial.desc);
        await wait_until(timestamp + duration.msg);
        timestamp = await switch_screen(null);
        await wait_until(timestamp + duration.pause);

        for (const round of trial.rounds) {
            const learning_order = round.learning_order;
            const retrieval_order = round.retrieval_order;

            await switch_screen(stimulus_screen);
            timestamp = await show_element(fixation);
            await wait_until(timestamp + duration.fixation);
            await present_stimuli(learning_order, duration.encoding);
            timestamp = await show_element(fixation);
            await wait_until(timestamp + duration.fixation);
            fixation.hidden = true;

            for(const pos of retrieval_order) {
                const response = await answer_question(trial.stimuli[pos], duration.retrieval);
                await present_feedback(pos, duration.correct_feedback);
                center_img.hidden = true;
                timestamp = await show_element(fixation);
                await wait_until(timestamp + duration.fixation);
            }
            timestamp = await show_message(round.msg, "");
            await wait_until(timestamp + duration.msg);
        }

        // 控制階段
        const control = trial.control;
        const position_order = control.position_order;

        pos_btns.forEach((pos_btn) => {
            const img_path = trial.stimuli["other"];
            const img = pos_btn.querySelector("img");
            img.src = img_path;
            img.hidden = true;
        });

        timestamp = await show_message(control.learning.title, control.learning.desc);
        await wait_until(timestamp + duration.msg);
        timestamp = await switch_screen(stimulus_screen);
        await wait_until(timestamp + duration.fixation);
        await present_stimuli(position_order, duration.encoding);
        timestamp = await show_message(control.retrieval.title, control.retrieval.desc);
        await wait_until(timestamp + duration.msg);
        timestamp = await switch_screen(stimulus_screen);
        await wait_until(timestamp + duration.fixation);

        for(const pos of position_order) {
            const response = await answer_question(trial.stimuli["other"], duration.retrieval);
            await present_feedback(pos, duration.correct_feedback);
            center_img.hidden = true;
            timestamp = await show_element(fixation);
            await wait_until(timestamp + duration.fixation);
        }

        pos_btns.forEach((pos_btn) => {
            const img = pos_btn.querySelector("img");
            img.removeAttribute("src");
            img.hidden = true;
        });
    }
    await show_message("任務已完成\n感謝您的參與!", "");
    try { if (document.fullscreenElement) await document.exitFullscreen(); } 
    catch (error) { console.warn("無法離開全螢幕：", error); }
}

start_button.addEventListener("click", async () => {
    start_button.disabled = true;
    try {
        if (!document.fullscreenElement && document.fullscreenEnabled)
            await document.documentElement.requestFullscreen();
    } catch (error) { console.warn("無法進入全螢幕：", error); }
    await main();
}, { once: true });