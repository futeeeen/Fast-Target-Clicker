const flowStage = document.querySelector("#flowStage");

function renderFlowStart() {
  flowStage.innerHTML = `
    <div class="stage-head">
      <p class="stage-label">Step 1 / 4</p>
      <button class="secondary" type="button" id="resetFlow">重設流程</button>
    </div>
    <h3>首頁：先點第一個按鈕</h3>
    <p>按下後會動態產生三個同名目標按鈕。</p>
    <button id="firstButton" type="button">第一個按鈕</button>
    <div id="quickButtons" class="button-row" aria-live="polite"></div>
  `;

  flowStage.querySelector("#firstButton").addEventListener("click", () => {
    const target = flowStage.querySelector("#quickButtons");
    target.innerHTML = "";
    for (let index = 1; index <= 3; index += 1) {
      const button = document.createElement("button");
      button.className = "quick-button";
      button.type = "button";
      button.dataset.option = String(index);
      button.textContent = "趕快點我";
      button.addEventListener("click", renderSeatStep);
      target.append(button);
    }
  });

  flowStage.querySelector("#resetFlow").addEventListener("click", renderFlowStart);
}

function renderSeatStep() {
  const seats = [
    ["特A區搖滾站區 7290 已售完", "sold"],
    ["特B區搖滾站區 7290 已售完", "sold"],
    ["特C區搖滾站區 5990 剩餘 98", "available"],
    ["特D區搖滾站區 5990 熱賣中", "available"],
    ["看台左側 3990 剩餘 12", "available"],
    ["看台右側 3990 已售完", "sold"]
  ];

  flowStage.innerHTML = `
    <div class="stage-head">
      <p class="stage-label">Step 2 / 4</p>
      <button class="secondary" type="button" id="resetFlow">重設流程</button>
    </div>
    <h3>座位頁：先點第二個按鈕，再選區域</h3>
    <button id="secondButton" type="button">第二個按鈕</button>
    <div id="seatGrid" class="seat-grid" aria-live="polite"></div>
  `;

  const grid = flowStage.querySelector("#seatGrid");
  flowStage.querySelector("#secondButton").addEventListener("click", () => {
    grid.innerHTML = "";
    seats.forEach(([label, state], index) => {
      const seat = document.createElement("div");
      seat.className = `seat-item ${state}`;
      seat.dataset.seatId = String(index + 1);
      seat.tabIndex = 0;
      seat.textContent = label;
      seat.addEventListener("click", renderFormStep);
      seat.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          seat.click();
        }
      });
      grid.append(seat);
    });
  });

  flowStage.querySelector("#resetFlow").addEventListener("click", renderFlowStart);
}

function renderFormStep() {
  flowStage.innerHTML = `
    <div class="stage-head">
      <p class="stage-label">Step 3 / 4</p>
      <button class="secondary" type="button" id="resetFlow">重設流程</button>
    </div>
    <h3>表單頁：選擇數量並勾選同意</h3>
    <label class="field">
      張數
      <select id="ticketCount" name="ticketCount">
        <option value="">請選擇</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
      </select>
    </label>
    <label class="checkbox-line">
      <input id="agreeTerms" name="agreeTerms" type="checkbox">
      我同意測試條款
    </label>
    <button id="finishButton" type="button">完成測試</button>
    <p id="flowResult" class="result" aria-live="polite"></p>
  `;

  flowStage.querySelector("#finishButton").addEventListener("click", () => {
    const count = flowStage.querySelector("#ticketCount").value;
    const checked = flowStage.querySelector("#agreeTerms").checked;
    const result = flowStage.querySelector("#flowResult");
    if (!count || !checked) {
      result.textContent = "還沒完成：請選擇張數並勾選同意。";
      result.dataset.state = "error";
      return;
    }
    result.textContent = `成功完成流程，張數 ${count}。`;
    result.dataset.state = "success";
  });

  flowStage.querySelector("#resetFlow").addEventListener("click", renderFlowStart);
}

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const target = document.querySelector(`#${button.dataset.copy}`);
    try {
      await navigator.clipboard.writeText(target.textContent);
      button.textContent = "已複製";
    } catch {
      button.textContent = "請手動複製";
    }
    window.setTimeout(() => {
      button.textContent = "複製";
    }, 1400);
  });
});

document.querySelectorAll(".area-item").forEach((button) => {
  button.addEventListener("click", () => {
    const result = document.querySelector("#areaResult");
    result.textContent = `已點選：${button.textContent.trim()}`;
    result.dataset.state = button.classList.contains("sold") || button.classList.contains("closed") ? "error" : "success";
  });
});

document.querySelectorAll(".row-button").forEach((button) => {
  button.addEventListener("click", () => {
    const result = document.querySelector("#tableResult");
    result.textContent = `已點選：${button.closest("tr").children[0].textContent}`;
    result.dataset.state = button.classList.contains("target-row") ? "success" : "error";
  });
});

document.getElementById("22437_6").addEventListener("click", () => {
  const result = document.querySelector("#tableResult");
  result.textContent = "已成功點擊數字 id 目標按鈕。";
  result.dataset.state = "success";
});

document.querySelector("#prepareDelayed").addEventListener("click", () => {
  const mount = document.querySelector("#delayedMount");
  const result = document.querySelector("#delayResult");
  mount.textContent = "目標產生中，請等待 3 秒...";
  result.textContent = "";
  result.removeAttribute("data-state");

  window.setTimeout(() => {
    mount.innerHTML = `<button id="delayedTarget" type="button">延遲出現的目標</button>`;
    mount.querySelector("#delayedTarget").addEventListener("click", () => {
      result.textContent = "成功點到延遲出現的目標。";
      result.dataset.state = "success";
    });
  }, 3000);
});

renderFlowStart();
