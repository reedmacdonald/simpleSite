window.onload = function () {
  console.log("YOU are in the portal");
  const factsButton = document.querySelector("#getFactsButton");
  const factsList = document.querySelector("#factsList");
  const inputBoxInput = document.querySelector("#inputBoxInput");
  const submitFactButton = document.querySelector("#submitFactButton");
  const portalEnterBtn = document.getElementById("portal-enter");
  const portalPassInput = document.getElementById("portal-pass");
  const portalGate = document.getElementById("portal-gate");
  const portalMsg = document.getElementById("portal-msg");
  const addInstructionButton = document.getElementById("addInstructionButton");
  const viewInstructionsButton = document.getElementById(
    "viewInstructionsButton"
  );

  getFacts();

  function normalizeItem(raw) {
    // Supports either { id: {S}, content: {S} } OR { id: {S}, answer: {S} }
    const id = raw?.id?.S ?? raw?.id ?? "";
    const content = raw?.content?.S ?? raw?.answer?.S ?? "";
    return { id: String(id), content: String(content) };
  }

  function appendLiWithDelete(listEl, item) {
    const li = document.createElement("li");
    li.textContent = item.content;
    console.log(item, "<---item");
    li.dataset.id = item.id; // <-- ensure data-id is the REAL id

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "x";
    deleteBtn.style.marginLeft = "10px";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.style.color = "#ff7b72";
    deleteBtn.style.background = "none";
    deleteBtn.style.border = "none";

    deleteBtn.addEventListener("click", async () => {
      const id = li.dataset.id;
      console.log(`Deleting item with id: ${id}`);
      li.remove();
      await deleteFact(id);
    });

    li.appendChild(deleteBtn);
    factsList.appendChild(li);
  }

  const viewInstructions = async () => {
    try {
      const body = { httpMethod: "GET" };
      const response = await fetch(
        reedChatUrl("reedchat-2"),
        reedChatApiStuff(body)
      );
      if (!response.ok) throw new Error("Failed to fetch instructions.");

      const data = await response.json();

      // Normalize, keep id, filter IN Instruction: items
      const instructions = data
        .map(normalizeItem)
        .filter((it) => it.content.startsWith("Instruction: "))
        .map((it) => ({
          id: it.id,
          content: it.content.replace(/^Instruction:\s*/, ""), // strip label for display only
        }));

      factsList.innerHTML = "";
      instructions.forEach((item) => appendLiWithDelete(factsList, item));
      console.log(`✅ Displayed ${instructions.length} instructions`);
    } catch (err) {
      console.error("❌ Error fetching instructions:", err);
    }
  };

  viewInstructionsButton.addEventListener("click", viewInstructions);

  addInstructionButton.addEventListener("click", async () => {
    const newInstruction = inputBoxInput.value.trim();
    if (!newInstruction) {
      alert("Please type an instruction first!");
      return;
    }

    const instructionWithPrefix = `Instruction: ${newInstruction}`;

    const body = {
      httpMethod: "POST",
      id: String(Math.floor(Math.random() * 1000000000) + 1),
      question: "idk",
      answer: instructionWithPrefix,
    };
    console.log(body, "<----body");

    try {
      const response = await fetch(
        reedChatUrl("reedchat-2"),
        reedChatApiStuff(body)
      );
      if (!response.ok) throw new Error("Failed to add instruction.");

      console.log(`✅ Instruction added: ${instructionWithPrefix}`);
      inputBoxInput.value = "";
      await getFacts(); // reuse your fact list refresh function
      factsList.classList.remove("showing-instructions");
    } catch (err) {
      console.error("❌ Error adding instruction:", err);
    }
  });

  if (portalEnterBtn && portalPassInput && portalGate) {
    const tryUnlock = () => {
      const val = portalPassInput.value || "";
      if (val === "passwordmock") {
        // success: remember for this tab/session and hide overlay
        sessionStorage.setItem("portal_ok_v1", "1");
        portalGate.style.display = "none";
        portalMsg.style.display = "none";
      } else {
        // failure: show message and clear input
        if (portalMsg) portalMsg.style.display = "block";
        portalPassInput.value = "";
        portalPassInput.focus();
      }
    };

    portalEnterBtn.addEventListener("click", tryUnlock);

    portalPassInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") tryUnlock();
    });

    // auto-hide if already unlocked in this session
    if (sessionStorage.getItem("portal_ok_v1") === "1") {
      portalGate.style.display = "none";
    }
  }

  function animateLi(li, delayMs = 0) {
    // Ensure the element is in the DOM before toggling the class
    if (delayMs) {
      setTimeout(() => li.classList.add("show"), delayMs);
    } else {
      requestAnimationFrame(() => li.classList.add("show"));
    }
  }

  factsButton.addEventListener("click", () => {
    factsList.classList.add("visible");
    getFacts();
    factsList.classList.remove("showing-instructions");
  });

  let inputShown = false;

  async function deleteFact(id) {
    try {
      const response = await fetch(reedChatUrl("reedchat-2"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          httpMethod: "DELETE",
          id,
          pathParameters: { id: id },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete fact with ID ${id}`);
      }

      console.log(`✅ Fact ${id} deleted successfully`);
    } catch (err) {
      console.error("❌ Error deleting fact:", err);
    }
  }

  submitFactButton.addEventListener("click", async () => {
    let newFact = inputBoxInput.value;
    let body = {
      httpMethod: "POST",
      answer: newFact,
      question: "idk",
      id: String(Math.floor(Math.random() * 1000000000) + 1),
    };
    const response = await fetch(
      reedChatUrl("reedchat-2"),
      reedChatApiStuff(body)
    );
    if (!response.ok) {
      throw new Error("Failed to get response from server.");
    }
    const data = await response.json();
    inputBoxInput.value = "";
    await getFacts();
  });

  const reedChatApiStuff = (body) => {
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      httpMethod: "GET",
      body: JSON.stringify(body),
    };
  };
  const reedChatUrl = (endpoint) =>
    `https://ut8byjwxf4.execute-api.us-west-1.amazonaws.com/prod/${endpoint}`;

  async function getFacts() {
    const body = { httpMethod: "GET" };
    const response = await fetch(
      reedChatUrl("reedchat-2"),
      reedChatApiStuff(body)
    );
    if (!response.ok) throw new Error("Failed to get facts from server.");

    const data = await response.json();

    // Normalize to {id, content}, then filter OUT Instruction: items
    const items = data
      .map(normalizeItem)
      .filter((it) => !it.content.startsWith("Instruction: "));

    factsList.innerHTML = "";
    items.forEach((item) => appendLiWithDelete(factsList, item));
    console.log(`✅ Displayed ${items.length} facts`);
  }
};
