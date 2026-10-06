const participant_input = document.getElementById("participant-input");
const submit_button = document.getElementById("submit-button");

submit_button.addEventListener("click", () => {
    const participant_id = participant_input.value.trim();
    if (participant_id === "") {
        alert("請輸入受試者代號。");
        return;
    }

    sessionStorage.setItem("participant_id", participant_id);
    window.location.href = `instruction.html`;
});