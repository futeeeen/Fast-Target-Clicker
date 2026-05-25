const examples = {
  basic: {
    title: "指定按鈕流程",
    label: "selector + waitForMs",
    description: "適合目標有穩定 id、class 或完整 selector 的頁面。每一步會等待目標出現，成功後再進下一步。",
    code: [
      {
        type: "click",
        selector: "#firstButton",
        waitForMs: 10000
      },
      {
        type: "click",
        selector: "#gameList > table > tbody > tr:nth-child(2) > td:nth-child(4) > button",
        waitForMs: 15000,
        nextDelayMs: 500
      },
      {
        type: "click",
        selector: "#\\32 2437_6",
        waitForMs: 15000
      }
    ]
  },
  text: {
    title: "文字狀態判斷",
    label: "textIncludes AND + textExcludes",
    description: "適合 selector 會變動，但畫面文字有規律的情境。textIncludes 陣列內全部文字都要符合，textExcludes 會排除不該點的狀態。",
    code: [
      {
        type: "click",
        selector: "li",
        textIncludes: ["特C區", "5990", "剩餘"],
        textExcludes: ["已售完"],
        waitForMs: 10000,
        pollMs: 250
      }
    ]
  },
  or: {
    title: "多組條件 OR",
    label: "textIncludes_1 / textIncludes_2",
    description: "適合多個可接受目標，例如 A 區或 C 區都可以。不同組之間是 OR，每組內仍是 AND。",
    code: [
      {
        type: "click",
        selector: "li",
        textIncludes_1: ["特A區", "5990", "剩餘"],
        textIncludes_2: ["特C區", "5990", "剩餘"],
        textExcludes: ["已售完", "不可購買"],
        waitForMs: 12000,
        pollMs: 300
      }
    ]
  },
  form: {
    title: "表單與勾選",
    label: "select + check + click",
    description: "適合進入表單頁後選擇張數、勾選條款，再送出。select 的 value 要填 option 的 value，不一定是畫面上看到的文字。",
    code: [
      {
        type: "select",
        selector: "#ticketCount",
        value: "2",
        waitForMs: 10000
      },
      {
        type: "check",
        selector: "#agreeTerms",
        waitForMs: 10000
      },
      {
        type: "click",
        selector: "#finishButton",
        waitForMs: 10000
      }
    ]
  },
  resume: {
    title: "從指定步驟測試",
    label: "workflowStartStep",
    description: "工具面板的「從第幾步開始」可設定為 2 或 3。JSON 本身不用改，適合已經停在第二頁或第三頁時做局部測試。",
    code: [
      {
        type: "click",
        text: "立即購票",
        waitForMs: 10000
      },
      {
        type: "click",
        selector: "#gameList > table > tbody > tr:nth-child(2) > td:nth-child(4) > button",
        waitForMs: 15000
      },
      {
        type: "click",
        textIncludes: ["剩餘", "5990"],
        textExcludes: ["已售完"],
        waitForMs: 15000
      }
    ]
  }
};

const tabs = Array.from(document.querySelectorAll(".tab"));
const title = document.querySelector("#exampleTitle");
const description = document.querySelector("#exampleDescription");
const label = document.querySelector("#exampleLabel");
const code = document.querySelector("#exampleCode");
const copyButton = document.querySelector("#copyExample");

function renderExample(key) {
  const example = examples[key] || examples.basic;
  title.textContent = example.title;
  description.textContent = example.description;
  label.textContent = example.label;
  code.textContent = JSON.stringify(example.code, null, 2);

  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.example === key);
  });

  copyButton.textContent = "複製 JSON";
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => renderExample(tab.dataset.example));
});

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(code.textContent);
    copyButton.textContent = "已複製";
  } catch {
    copyButton.textContent = "請手動複製";
  }

  window.setTimeout(() => {
    copyButton.textContent = "複製 JSON";
  }, 1600);
});

renderExample("basic");
